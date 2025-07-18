import * as env from './env'
import * as schema from '../db/schema'
import { drizzle } from 'drizzle-orm/node-postgres'
import { and, count, countDistinct, desc, eq, getTableColumns, gte, inArray, lte } from 'drizzle-orm'

const GLOBAL_CONFIDENCE_THRESHOLD = env.float('GLOBAL_CONFIDENCE_THRESHOLD', 0.7)

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
    const videos = await db.select({
      ...getTableColumns(schema.videos),
      ...getTableColumns(schema.channels)
    })
      .from(schema.videos)
      .leftJoin(schema.channels, eq(schema.videos.channelId, schema.channels.channelId))
      .where(eq(schema.videos.youtubeId, youtubeId))
      .limit(1)
    const video = videos.length == 0 ? null : videos[0]

    if (!video) return video
    const availableModels = await db
      .select({
        modelId: schema.models.modelId,
        modelName: schema.models.modelName,
        modelPath: schema.models.modelPath,
        modelIsPrimary: schema.models.modelIsPrimary
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
  async getAll(entities?: string[], _modelId?: number) {
    if ((!entities || entities.length == 0) && (typeof _modelId === 'undefined'))
      return await db
        .select({
          ...getTableColumns(schema.videos),
          ...getTableColumns(schema.channels)
        })
        .from(schema.videos)
        .leftJoin(schema.channels, eq(schema.videos.channelId, schema.channels.channelId))
        .orderBy(schema.videos.videoId)

    let modelId = _modelId
    if (modelId == -1) {
      const [model] = await db.select({ modelId: schema.models.modelId }).from(schema.models).where(eq(schema.models.modelIsPrimary, true))
      if (!model)
        throw new Error('Primary model was requested for search, but none was set!')

      modelId = model.modelId
    }

    const andConditions = [
      (entities && entities.length !== 0) ? inArray(schema.entities.entityName, entities) : null,
      (typeof modelId !== 'undefined') ? eq(schema.detections.modelId, modelId) : null,
      gte(schema.detections.confidence, GLOBAL_CONFIDENCE_THRESHOLD)
    ].filter(x => !!x)

    const query = db
      .select({
        ...getTableColumns(schema.videos),
        ...getTableColumns(schema.channels)
      })
      .from(schema.detections)
      .fullJoin(schema.entities, eq(schema.detections.entityId, schema.entities.entityId))
      .fullJoin(schema.videos, eq(schema.detections.videoId, schema.videos.videoId))
      .leftJoin(schema.channels, eq(schema.videos.channelId, schema.channels.channelId))
      .where(and(...andConditions))
      .groupBy(schema.videos.videoId, schema.channels.channelId)
      .orderBy(schema.videos.videoId)

    if (entities && entities.length != 0)
      return await query.having(eq(countDistinct(schema.detections.entityId), entities.length))

    return await query
  },
  async getEntities(youtubeId: string, _modelId: number = -1) {
    let modelId = _modelId
    if (modelId == -1) {
      const [model] = await db.select({ modelId: schema.models.modelId }).from(schema.models).where(eq(schema.models.modelIsPrimary, true))
      if (!model)
        throw new Error('Primary model was requested for search, but none was set!')
      modelId = model.modelId
    }

    return await db.select({
      entityName: schema.entities.entityName,
      entityId: schema.entities.entityId,
      entityCount: count(schema.entities.entityId)
    }).from(schema.detections)
      .innerJoin(schema.entities, eq(schema.detections.entityId, schema.entities.entityId))
      .innerJoin(schema.videos, eq(schema.detections.videoId, schema.videos.videoId))
      .where(
        and(
          eq(schema.videos.youtubeId, youtubeId),
          eq(schema.detections.modelId, modelId),
          gte(schema.detections.confidence, GLOBAL_CONFIDENCE_THRESHOLD)
        )
      )
      .groupBy(schema.entities.entityId)
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
          gte(schema.detections.confidence, options.confidence || GLOBAL_CONFIDENCE_THRESHOLD),
          eq(schema.detections.modelId, model.modelId)
        )
      )

    return detections
  },
  async delete(youtubeId: string, modelId: number) {
    const [video] = await db.select().from(schema.videos).where(eq(schema.videos.youtubeId, youtubeId)).limit(1)
    if (!video) throw new Error('YouTube video ID was not found in the database')

    return await db
      .delete(schema.detections)
      .where(
        and(
          eq(schema.detections.videoId, video.videoId),
          eq(schema.detections.modelId, modelId)
        )
      )
  },
  async getAll() {
    return db.selectDistinctOn([schema.detections.videoId, schema.detections.modelId], {
      youtubeId: schema.videos.youtubeId,
      videoTitle: schema.videos.videoTitle,
      modelId: schema.detections.modelId
    })
      .from(schema.detections)
      .innerJoin(schema.videos, eq(schema.detections.videoId, schema.videos.videoId))
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
  },
  async setAsPrimary(modelId: number) {
    await db.transaction(async tx => {
      await tx.update(schema.models).set({ modelIsPrimary: false })
      await tx.update(schema.models).set({ modelIsPrimary: true })
        .where(eq(schema.models.modelId, modelId))
    })

    return await db.select()
      .from(schema.models)
      .where(
        and(
          eq(schema.models.modelId, modelId),
          eq(schema.models.modelIsPrimary, true)
        )
      )
  }
}
