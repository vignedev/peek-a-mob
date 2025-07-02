import dynamic_api from './dynamic_api'
import static_api from './static_api'

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
  frameRate: number,

  channelId: number,
  channelName: string,
  channelHandle?: string
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

export const api = __IS_STATIC__ ? static_api : dynamic_api
export default api