import { integer, pgTable, serial, text, real, index } from 'drizzle-orm/pg-core'

export const channels = pgTable('channels', {
  channelId: serial('channel_id').primaryKey().notNull(),
  channelHandle: text('channel_handle').unique().notNull(),
  channelName: text('channel_name').notNull(),
});

export const videos = pgTable('videos', {
  videoId: serial('video_id').primaryKey().notNull(),
  youtubeId: text('video_yt_id').unique().notNull(),
  videoTitle: text('video_title').notNull(),
  duration: real().notNull(),
  channelId: integer('channel_id').references(() => channels.channelId)
})

export const entities = pgTable('entities', {
  entityId: serial('entity_id').primaryKey().notNull(),
  entityName: text('entity_name').unique().notNull(),
  entityColor: text('entity_color')
})

export const models = pgTable('models', {
  modelId: serial('model_id').primaryKey().notNull(),
  modelPath: text('model_path').unique().notNull(),
  modelName: text('model_name'),
})

export const detections = pgTable('detections', {
  detectionId: serial('detection_id').primaryKey().notNull(),
  videoId: integer('video_id').references(() => videos.videoId),
  entityId: integer('entity_id').references(() => entities.entityId),
  modelId: integer('model_id').references(() => models.modelId),

  time: real('time').notNull(),
  confidence: real('confidence').notNull(),
  bbox: real('bbox').array()
}, (table => ([
  index('ytId_modelId_idx').on(table.videoId, table.modelId),
  index('ytId_time_idx').on(table.videoId, table.modelId, table.time),
  index('ytId_entityId_time_idx').on(table.videoId, table.modelId, table.entityId, table.time)
])))