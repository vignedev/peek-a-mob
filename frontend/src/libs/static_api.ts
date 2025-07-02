import { DetailedVideo, DetectionQuery, DetectionRecord, Entity, EntityDetection, EntityOccurance, Job, Model, Video, VideoEntityItem } from "./api"
import { strictFetch } from "./utils"

async function getDetections(youtubeId: string, modelId: number | null = null, query: DetectionQuery = {}): Promise<EntityDetection> {
  return {}
}

async function getAllDetections(): Promise<DetectionRecord> {
  return {}
}

async function getVideoEntities(youtubeId: string, modelId: number = -1): Promise<VideoEntityItem[]> {
  return []
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

  return []
}

async function getVideo(youtubeId: string): Promise<DetailedVideo> {
  // @ts-ignore
  return {}
}

async function getEntities(): Promise<Entity[]> {
  return []
}

async function getModels(): Promise<Model[]> {
  return [
    {
      modelId: 0,
      modelAvailable: true,
      modelIsPrimary: true,
      modelName: 'Hey',
      modelPath: '/tmp/model.pt'
    }
  ]
}

async function getModel(_modelId: number): Promise<Model> {
  // @ts-ignore
  return {}
}

// Below are stub functions -- not intended for static APIs

async function deleteDetections(_youtubeId: string, _modelId: number) {
}

async function getJobs(): Promise<Job[]> {
  return []
}

async function getJob(_jobId: number): Promise<Job> {
  // @ts-ignore
  return {}
}

async function getJobLogs(_jobId: number): Promise<string> {
  return ''
}

async function newJob(_youtubeId: string, _modelId: number): Promise<Job> {
  // @ts-ignore
  return {}
}

async function stopJob(_modelId: number): Promise<{}> {
  return {}
}

async function newModel(_modelName: string, _data: File): Promise<Model> {
  // @ts-ignore
  return {}
}

async function renameModel(_modelId: number, _modelName: string): Promise<Model> {
  // @ts-ignore
  return {}
}

async function setAsPrimaryModel(_modelId: number): Promise<Model> {
  // @ts-ignore
  return {}
}

const api = {
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