import { createReadStream } from 'fs'
import db from '../libs/database'
import * as schema from '../db/schema'
import { createInterface } from 'readline/promises'
import { eq } from 'drizzle-orm'

const argv = process.argv.slice(2)
if (argv.length != 3) {
  console.error(`usage: ${process.argv.slice(0, 2).join(' ')} <youtube_id> <model_name> <csv_file>`)
  process.exit(1)
}

main(argv[0], argv[1], argv[2])

type Result = {
  time: number,
  class: string,
  confidence: number,
  x: number, y: number,
  w: number, h: number
}

async function main(youtubeId: string, modelName: string, csvPath: string) {
  // prepare the videoId info and such TODO: set the duration + videoTitle
  await db.insert(schema.videos).values({
    youtubeId: youtubeId,
    duration: -1,
    videoTitle: '',
  }).onConflictDoUpdate({ target: schema.videos.youtubeId, set: { duration: -1, videoTitle: '' } })
  const [video] = await db.select().from(schema.videos).where(eq(schema.videos.youtubeId, youtubeId))
  console.error(`[i] video entry`, video)

  // prepare the model
  await db.insert(schema.models).values({
    modelName
  }).onConflictDoNothing()
  const [model] = await db.select().from(schema.models).where(eq(schema.models.modelName, modelName))
  console.error(`[i] model entry`, model)

  // get entity mapping
  const entityMap = (await db.select().from(schema.entities)).reduce((acc, val) => { acc[val.entityName] = val.entityId; return acc }, {} as Record<string, number>)
  console.error(`[i] entity mapping`, entityMap)

  // commit per-1000 batches
  const commitEveryN = 1000
  let buffer: Result[] = []
  async function commit() {
    await db.insert(schema.detections).values(buffer.map(result => {
      return {
        confidence: result.confidence,
        bbox: [result.x, result.y, result.w, result.h],
        videoId: video.videoId,
        modelId: model.modelId,
        entityId: entityMap[result.class],
        time: result.time
      }
    }))
    buffer = []
    console.error(`[i] committed ${commitEveryN} entries`)
  }

  // rudimentary csv parser
  const stream = createReadStream(csvPath)
  const reader = createInterface({ input: stream })
  let header: string[] = []
  for await (const line of reader) {
    const split = line.split(/[;,]/)
    if (header.length == 0) {
      header = split
      continue
    }
    const temp = split.reduce((acc, val, idx) => { acc[header[idx]] = val; return acc }, {} as Record<string, any>)
    for (const key of ['time', 'confidence', 'x', 'y', 'w', 'h'])
      temp[key] = parseFloat(temp[key])

    // for parsed results, push them to the buffer
    const result: Result = temp as Result
    buffer.push(result)

    // mob not found, immediately add it to the database and update our mapping
    if (typeof entityMap[result.class] === 'undefined') {
      console.error(`[i] entity ${result.class} not in db, inserting`)
      await db.insert(schema.entities)
        .values({ entityName: result.class })
        .onConflictDoNothing()
        .returning()
      const [entity] = await db.select().from(schema.entities).where(eq(schema.entities.entityName, result.class)).limit(1)
      if (!entity)
        throw new Error(`Wanted to create entity "${result.class}", but database didn't return the new ID!`)
      entityMap[entity.entityName] = entity.entityId
      console.error(`[i] updated entityMap`, entityMap)
    }

    // commit every once in a while
    if (buffer.length >= commitEveryN)
      await commit()
  }

  // commit the left over anyways
  await commit()
}
