import * as env from './env'
import * as schema from '../db/schema'
import { drizzle } from 'drizzle-orm/node-postgres'
import { and, eq, gt, gte, inArray, lte } from 'drizzle-orm'

const db = drizzle(env.str('DATABASE_URL'), { schema })
export default db

export type DetectionQuery = {
  entityNames?: string[],
  confidence?: number,
  timeStart?: number,
  timeEnd?: number
}

export async function getDetections(youtubeId: string, modelName: string, options: DetectionQuery = {}) {
  const entities = await (options.entityNames ? db.query.entities.findMany({
    where: (table, op) => op.inArray(table.entityName, options.entityNames!)
  }) : db.query.entities.findMany())
  const entityIds = entities.map(x => x.entityId)

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

  return {
    entities: entities.reduce((acc, val) => { acc[val.entityId] = val; return acc }, {} as Record<string, typeof entities[0]>),
    detections
  }
}

export async function getVideo(youtubeId: string) {
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

  return {
    ...video,
    models: availableModels.map(x => x.modelName)
  }
}

export async function getAllVideos() {
  return await db.query.videos.findMany()
}