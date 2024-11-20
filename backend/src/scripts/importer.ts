import { createReadStream } from 'fs'
import { readFile } from 'fs/promises'
import db from '../libs/database'
import * as schema from '../db/schema'
import { createInterface } from 'readline/promises'
import { and, eq, or } from 'drizzle-orm'

const argv = process.argv.slice(2)
if (argv.length == 0) {
  console.error(`usage: ${process.argv.slice(0, 2).join(' ')} <csv_file> <csv_file> ...`)
  process.exit(1)
}

for (const arg of argv)
  main(arg)

type Result = {
  time: number,
  class: string,
  confidence: number,
  x: number, y: number,
  w: number, h: number
}

type VideoMetadata = {
  video: {
    title: string,
    id: string,
    width: number, height: number, fps: number
    channel: string,
    duration: number,
    format: string,
    uploader_id: string | null,
    channel_id: string
  },
  argv: {
    model: string,
    output: string,
    url: string,
    conf: number,
    iou: number,
    imgsz: number
  }
}

async function get_json_header(csvPath: string) {
  const stream = createReadStream(csvPath)
  const reader = createInterface({ input: stream })
  let count = 0
  let metadata = null
  for await (const line of reader) {
    if (line.startsWith('#$'))
      metadata = JSON.parse(line.substring(2).trim()) as VideoMetadata
    if (line[0] == '#' || line.trim().length == 0)
      continue

    ++count
  }
  return { metadata, count }
}

async function main(csvPath: string) {
  // const metadata from the file
  const { metadata, count } = await get_json_header(csvPath)
  if (!metadata) throw new Error(`"${csvPath}" has no metadata header!`)
  console.error(`[i] ${csvPath} =`, metadata)

  const { channel, model, video, entityMap } = await db.transaction(async tx => {
    // prepare the channel
    const channelInit = await tx.insert(schema.channels).values({
      channelName: metadata.video.channel,
      channelHandle: metadata.video.uploader_id || metadata.video.channel_id
    })
      .onConflictDoNothing()
      .returning()
    const [channel] = await tx
      .select()
      .from(schema.channels)
      .where(
        or(
          eq(schema.channels.channelHandle, metadata.video.uploader_id || '<oh nyo>'), // TODO: just if this, but you are lazy aren't you viggie
          eq(schema.channels.channelHandle, metadata.video.channel_id)
        )
      )

    // prepare the videoId info and such TODO: set the duration + videoTitle
    await tx.insert(schema.videos).values({
      youtubeId: metadata.video.id,
      duration: metadata.video.duration,
      videoTitle: metadata.video.title,
      channelId: channel.channelId,
      aspectRatio: metadata.video.width / metadata.video.height
    }).onConflictDoUpdate({
      target: schema.videos.youtubeId, set: {
        duration: metadata.video.duration,
        videoTitle: metadata.video.title,
        channelId: channel.channelId,
        aspectRatio: metadata.video.width / metadata.video.height
      }
    })
    const [video] = await tx
      .select()
      .from(schema.videos)
      .where(eq(schema.videos.youtubeId, metadata.video.id))
    console.error(`[i] video entry`, video)

    // prepare the model
    await tx.insert(schema.models).values({
      modelPath: metadata.argv.model
    }).onConflictDoNothing()
    const [model] = await tx
      .select()
      .from(schema.models)
      .where(eq(schema.models.modelPath, metadata.argv.model))
    console.error(`[i] model entry`, model)

    // get entity mapping
    const entityMap = (await tx.select().from(schema.entities)).reduce((acc, val) => { acc[val.entityName] = val.entityId; return acc }, {} as Record<string, number>)
    console.error(`[i] entity mapping`, entityMap)

    return { channel, model, video, entityMap }
  })
  await db.transaction(async tx => {
    // commit batches
    let commitTotal = 0
    const commitEveryN = 4096
    let buffer: Result[] = []
    async function commit() {
      await tx.insert(schema.detections).values(buffer.map(result => {
        return {
          confidence: result.confidence,
          bbox: [result.x, result.y, result.w, result.h],
          videoId: video.videoId,
          modelId: model.modelId,
          entityId: entityMap[result.class],
          time: result.time
        }
      }))
      console.error(`[i] committed ${buffer.length} entries (${commitTotal += buffer.length}/${count}; ${(commitTotal / count * 100).toFixed(1)}%)`)
      buffer = []
    }

    // rudimentary csv parser
    const stream = createReadStream(csvPath)
    const reader = createInterface({ input: stream })
    let header: string[] = []
    for await (const line of reader) {
      if (line[0] == '#') continue
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
        await tx.insert(schema.entities)
          .values({ entityName: result.class })
          .onConflictDoNothing()
          .returning()
        const [entity] = await tx.select().from(schema.entities).where(eq(schema.entities.entityName, result.class)).limit(1)
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
  })
}
