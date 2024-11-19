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
      .select({ modelId: schema.models.modelId, modelName: schema.models.modelName })
      .from(schema.detections)
      .innerJoin(schema.models, eq(schema.detections.modelId, schema.models.modelId))
      .groupBy(schema.models.modelId)
      .where(
        eq(schema.detections.videoId, video.videoId)
      )
      .orderBy(desc(schema.models.modelName))

    return {
      ...video,
      models: availableModels.map(x => x.modelName)
    }
  },
  async getAll() {
    return await db.query.videos.findMany()
  }
}

export const entities = {
  async getAll() {
    return db.select().from(schema.entities)
  }
}

export const detections = {
  async get(youtubeId: string, modelName: string, options: DetectionQuery = {}) {
    const entities_list = await (
      (options.entityNames && options.entityNames.length != 0)
        ? db.query.entities.findMany({
          where: (table, op) => op.inArray(table.entityName, options.entityNames!)
        })
        : entities.getAll()
    )
    const entityIds = entities_list.map(entity => entity.entityId)

    const models = await db.select().from(schema.models).where(eq(schema.models.modelName, modelName)).limit(1)
    if (models.length == 0) return []

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
          eq(schema.detections.modelId, models[0].modelId)
        )
      )

    return detections
  }
}

export const models = {
  async getAll() {
    return await db.query.models.findMany()
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
  }
}
