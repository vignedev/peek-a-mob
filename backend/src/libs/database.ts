import * as env from './env'
import * as schema from '../db/schema'
import { drizzle } from 'drizzle-orm/node-postgres'
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'

const db = drizzle(env.str('DATABASE_URL'), { schema })
export default db

export type DetectionQuery = {
  entityNames?: string[],
  confidence?: number,
  timeStart?: number,
  timeEnd?: number
}

export const videos = {
  async get(youtubeId: string) {
    const videos = await db.select().from(schema.videos).where(eq(schema.videos.youtubeId, youtubeId)).limit(1)
    const video = videos.length == 0 ? null : videos[0]

    if (!video) return video
    const availableModels = await db
      .select({
        modelId: schema.models.modelId,
        modelName: schema.models.modelName,
        modelPath: schema.models.modelPath
      })
      .from(schema.detections)
      .innerJoin(schema.models, eq(schema.detections.modelId, schema.models.modelId))
      .groupBy(schema.models.modelId)
      .where(
        eq(schema.detections.videoId, video.videoId)
      )
      .orderBy(desc(schema.models.modelId))

    return {
      ...video,
      models: availableModels
    }
  },
  async getAll(entities?: string[]) {
    if (!entities || entities.length == 0)
      return await db.query.videos.findMany({ orderBy: schema.videos.videoId })

    const { videoId, youtubeId, videoTitle, duration, channelId, aspectRatio } = schema.videos
    return await db
      .select({ videoId, youtubeId, videoTitle, duration, channelId, aspectRatio })
      .from(schema.detections)
      .fullJoin(schema.entities, eq(schema.detections.entityId, schema.entities.entityId))
      .fullJoin(schema.videos, eq(schema.detections.videoId, schema.videos.videoId))
      .where(inArray(schema.entities.entityName, entities))
      .groupBy(schema.videos.videoId)
      .orderBy(schema.videos.videoId)
  }
}

export const entities = {
  async getAll() {
    return db.select()
      .from(schema.entities)
      .orderBy(schema.entities.entityId)
  }
}

export const detections = {
  async exists(youtubeId: string, modelId: number) {
    const detections = await db
      .select({
        time: schema.detections.time,
        confidence: schema.detections.confidence,
        bbox: schema.detections.bbox,
        entityId: schema.detections.entityId
      })
      .from(schema.detections)
      .rightJoin(schema.videos, eq(schema.videos.videoId, schema.detections.videoId))
      .where(
        and(
          eq(schema.videos.youtubeId, youtubeId),
          eq(schema.detections.modelId, modelId)
        )
      )
      .limit(1)

    return detections.length !== 0
  },
  async get(youtubeId: string, modelId: number, options: DetectionQuery = {}) {
    const entities_list = await (
      (options.entityNames && options.entityNames.length != 0)
        ? db.query.entities.findMany({
          where: (table, op) => op.inArray(table.entityName, options.entityNames!),
          orderBy: schema.entities.entityId
        })
        : entities.getAll()
    )
    const entityIds = entities_list.map(entity => entity.entityId)

    const _models = await db.select().from(schema.models).where(eq(schema.models.modelId, modelId)).limit(1)
    if (_models.length == 0) return []
    const model = _models[0]

    const detections = await db
      .select({
        time: schema.detections.time,
        confidence: schema.detections.confidence,
        bbox: schema.detections.bbox,
        entityId: schema.detections.entityId
      })
      .from(schema.detections)
      .rightJoin(schema.videos, eq(schema.videos.videoId, schema.detections.videoId))
      .where(
        and(
          eq(schema.videos.youtubeId, youtubeId),
          inArray(schema.detections.entityId, entityIds),
          gte(schema.detections.time, options.timeStart || 0),
          lte(schema.detections.time, options.timeEnd || Infinity),
          gte(schema.detections.confidence, options.confidence || 0.65),
          eq(schema.detections.modelId, model.modelId)
        )
      )

    return detections
  }
}

export const models = {
  async getAll() {
    return await db.query.models.findMany({ orderBy: schema.models.modelId })
  },
  async get(modelId: number) {
    const result = await db.select().from(schema.models).where(eq(schema.models.modelId, modelId)).limit(1)
    return result.length == 0 ? null : result[0]
  },
  async new(path: string, name: string) {
    const model = await db.insert(schema.models).values({
      modelPath: path,
      modelName: name,
      modelAvailable: true
    }).returning()
    if (model.length == 0)
      throw new Error('New model has no returning value, this should not happen!')
    return model[0]
  },
  async rename(modelId: number, newName: string) {
    return await db
      .update(schema.models)
      .set({ modelName: newName })
      .where(eq(schema.models.modelId, modelId))
      .returning()
  }
}
