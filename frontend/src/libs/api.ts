import { strictFetch } from "./utils"

export type EntityOccurance = {
  time: number,
  confidence: number,
  bbox: number[],
  entityId: number
}
export type EntityDetection = Record<string, EntityOccurance[]>
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
  modelAvailable: boolean
}
export type DetailedVideo = Video & {
  models: Model[]
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

export type DetectionRecord = Record<string, { modelIds: number[], videoTitle: string }>

export type DetectionQuery = {
  start?: number,
  end?: number,
  confidence?: number,
  entities?: string[]
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
    conf: query.confidence || 0.7,
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

async function deleteDetections(youtubeId: string, modelId: number) {
  return (await strictFetch(`/api/videos/${youtubeId}/detections/${modelId}`, {
    method: 'DELETE'
  })).json()
}

async function getVideos(entities?: string[]): Promise<Video[]> {
  const queryString = entities ? `?${entities.map(e => `e=${e}`).join('&')}` : ''
  return (await strictFetch(`/api/videos${queryString}`)).json()
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

export const api = {
  models: {
    get: getModel,
    getAll: getModels,
    new: newModel,
    rename: renameModel
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
    getDetections: getDetections
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