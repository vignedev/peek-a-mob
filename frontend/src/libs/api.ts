import { strictFetch } from "./utils"

export type EntityOccurance = {
  time: number,
  confidence: number,
  bbox: number[],
  entityId: number
}
export type EntityDetection = Record<string, EntityOccurance[]>
export type EntityGroup = [start: number, end: number]
export type Video = {
  videoId: number,
  youtubeId: string,
  videoTitle: string,
  duration: number,
  aspectRatio: number,
  frameRate: number
}
export type Entity = {
  entityId: number,
  entityName: string,
  entityColor: string | null
}
export type Model = {
  modelId: number,
  modelName: string | null,
  modelPath: string,
  modelAvailable: boolean,
  modelIsPrimary: boolean
}
export type DetailedVideo = Video & {
  models: Model[]
}

export type VideoEntityItem = {
  entityName: string,
  entityId: number,
  entityCount: number
}

export type JobStatus = 'waiting' | 'cancelled' | 'active' | 'failed' | 'finished' | 'importing'

export type Job = {
  id: number,
  videoUrl: string,
  modelId: number,
  status: JobStatus,
  logs?: Buffer[],
  start: number | null,
  end: number | null,
  exportable: boolean,
  progress: {
    currentFrame: number,
    totalFrames: number,
    rate: {
      average: number,
      last: number
    }
  } | null
}

export type DetectionEntry = { modelIds: number[], videoTitle: string }
export type DetectionRecord = Record<string, DetectionEntry>

export type DetectionQuery = {
  start?: number,
  end?: number,
  confidence?: number,
  entities?: string[]
}

/**
 * Returns the start and end points of groups of entities
 * @param detections Input detections grouped by their entity name
 * @param width Distance where the group should be considered
 * @param threshold Filter out groups which are below this duration threshold
 */
export function groupDetections(detections: EntityDetection, width: number = 1, threshold?: number): Record<string, EntityGroup[]> {
  const bucket: Record<string, EntityGroup[]> = {}
  for (const entityName in detections) {
    detections[entityName].forEach((detection) => {
      if (!bucket[entityName])
        bucket[entityName] = []

      if (bucket[entityName].length == 0)
        bucket[entityName].push([detection.time, detection.time])
      else if ((detection.time - bucket[entityName][bucket[entityName].length - 1][1]) <= width)
        bucket[entityName][bucket[entityName].length - 1][1] = detection.time
      else
        bucket[entityName].push([detection.time, detection.time])
    })
  }

  if (threshold !== undefined)
    for (const entityName in bucket)
      bucket[entityName] = bucket[entityName].filter(([start, end]) => (end - start) > threshold)

  return bucket
}

/**
 * Returns a list of detections and bounding boxes
 * @param youtubeId YouTube Video ID to get the mobs of
 * @param modelId Specified which model to fetch, set to null to pick the last one in list
 * @param query Query settings
 * @returns Object where keys are the detected classes, and their value is the list of bounding boxes
 */
async function getDetections(youtubeId: string, modelId: number | null = null, query: DetectionQuery = {}): Promise<EntityDetection> {
  const entityMap = (await getEntities()).reduce((acc, val) => {
    acc[val.entityId] = val.entityName
    return acc
  }, {} as Record<number, string>)
  const video = await getVideo(youtubeId)
  const usedModelId = modelId ?? video.models.shift()!.modelId
  const searchQuery = Object.entries({
    ss: query.start || 0,
    to: query.end || Infinity,
    // conf: query.confidence || 0.7,
    e: query.entities || []
  }).map(([key, value]) =>
    Array.isArray(value) ?
      value.map(x => `${key}=${encodeURIComponent(x)}`).join('&') :
      `${key}=${encodeURIComponent(value)}`
  ).join('&')
  const occurances: EntityOccurance[] = await (
    await strictFetch(
      `/api/videos/${youtubeId}/detections/${usedModelId}?${searchQuery}`
    )
  ).json()

  const entities: EntityDetection = {}
  for (const occurance of occurances) {
    const name = entityMap[occurance.entityId]
    if (!entities[name])
      entities[name] = []

    entities[name].push(occurance)
  }
  return entities
}

async function getAllDetections(): Promise<DetectionRecord> {
  return (await strictFetch('/api/detections')).json()
}

async function getVideoEntities(youtubeId: string, modelId: number = -1): Promise<VideoEntityItem[]> {
  return (await strictFetch(`/api/videos/${youtubeId}/entities/${modelId}`)).json()
}

async function deleteDetections(youtubeId: string, modelId: number) {
  return (await strictFetch(`/api/videos/${youtubeId}/detections/${modelId}`, {
    method: 'DELETE'
  })).json()
}

async function getVideos(entities?: string[], modelId?: number): Promise<Video[]> {
  const queryString = Object.entries({
    e: entities, model: modelId
  }).reduce((acc, [key, value]) => {
    if (Array.isArray(value))
      acc.push(...value.map(e => `${key}=${encodeURIComponent(e)}`))
    else if (value)
      acc.push(`${key}=${encodeURIComponent(value)}`)
    return acc
  }, [] as string[]).join('&')

  // const queryString = entities ? `?${entities.map(e => `e=${e}`).join('&')}` : ''
  return (await strictFetch(`/api/videos${queryString ? `?${queryString}` : ''}`)).json()
}

async function getVideo(youtubeId: string): Promise<DetailedVideo> {
  return (await strictFetch(`/api/videos/${youtubeId}`)).json()
}

async function getEntities(): Promise<Entity[]> {
  return (await strictFetch(`/api/entities`)).json()
}

async function getJobs(): Promise<Job[]> {
  return (await strictFetch(`/api/jobs`)).json()
}

async function getJob(jobId: number): Promise<Job> {
  return (await strictFetch(`/api/jobs/${jobId}`)).json()
}

async function getJobLogs(jobId: number): Promise<string> {
  return (await strictFetch(`/api/jobs/${jobId}/logs`)).text()
}

async function newJob(youtubeId: string, modelId: number): Promise<Job> {
  return (await strictFetch(`/api/jobs`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ youtubeId, modelId })
  })).json()
}

async function stopJob(modelId: number): Promise<{}> {
  return (await strictFetch(`/api/jobs/${modelId}`, {
    method: 'DELETE'
  })).json()
}

async function getModels(): Promise<Model[]> {
  return (await strictFetch(`/api/models`)).json()
}

async function getModel(modelId: number): Promise<Model> {
  return (await strictFetch(`/api/models/${modelId}`)).json()
}

async function newModel(modelName: string, data: File): Promise<Model> {
  return (await strictFetch(`/api/models`, {
    method: 'POST',
    headers: { 'PAM-Model-Name': modelName },
    body: data
  })).json()
}

async function renameModel(modelId: number, modelName: string): Promise<Model> {
  return (await strictFetch(`/api/models/${modelId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelName })
  })).json()
}

async function setAsPrimaryModel(modelId: number): Promise<Model> {
  return (await strictFetch(`/api/models/${modelId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelIsPrimary: true })
  })).json()
}

export const api = {
  models: {
    get: getModel,
    getAll: getModels,
    new: newModel,
    rename: renameModel,
    setAsPrimary: setAsPrimaryModel
  },
  jobs: {
    get: getJob,
    getAll: getJobs,
    new: newJob,
    getLogs: getJobLogs,
    stop: stopJob
  },
  videos: {
    get: getVideo,
    getAll: getVideos,
    getDetections: getDetections,
    getEntities: getVideoEntities
  },
  entities: {
    getAll: getEntities
  },
  detections: {
    getAll: getAllDetections,
    delete: deleteDetections
  }
}
export default api