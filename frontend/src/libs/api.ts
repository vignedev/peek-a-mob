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

export type JobStatus = 'waiting' | 'cancelled' | 'active' | 'failed' | 'finished'

export type Job = {
  id: number,
  videoUrl: string,
  modelId: number,
  status: JobStatus,
  logs?: Buffer[],
  progress: {
    currentFrame: number,
    totalFrames: number,
    rate: {
      average: number,
      last: number
    }
  } | null
}

/**
 * Returns a list of detections and bounding boxes
 * @param videoId Video ID to get the mobs of
 * @param time Time in seconds where it should get the detections at
 * @param modelId Specified which model to fetch, set to null to pick the last one in list
 * @param after How many seconds should it get as well
 * @param before Back seeking if necessary (basically time-before)
 * @returns Object where keys are the detected classes, and their value is the list of bounding boxes
 */
async function getDetections(videoId: string, time: number, modelId: number | null = null, after: number = 5, before: number = 0): Promise<EntityDetection> {
  const entityMap = (await getEntities()).reduce((acc, val) => {
    acc[val.entityId] = val.entityName
    return acc
  }, {} as Record<number, string>)
  const video = await getVideo(videoId)
  const occurances: EntityOccurance[] = await (await strictFetch(`/api/videos/${videoId}/detections/${modelId ?? video.models.shift()!.modelId}?ss=${time - before}&to=${time + after}`)).json()

  const entities: EntityDetection = {}
  for (const occurance of occurances) {
    const name = entityMap[occurance.entityId]
    if (!entities[name])
      entities[name] = []

    entities[name].push(occurance)
  }
  return entities
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

async function newJob(videoUrl: string, modelId: number): Promise<Job> {
  return (await strictFetch(`/api/jobs`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl, modelId })
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

export const api = {
  models: {
    get: getModel,
    getAll: getModels,
    new: newModel
  },
  jobs: {
    get: getJob,
    getAll: getJobs,
    new: newJob,
    getLogs: getJobLogs
  },
  videos: {
    get: getVideo,
    getAll: getVideos,
    getDetections: getDetections
  },
  entities: {
    getAll: getEntities
  }
}
export default api