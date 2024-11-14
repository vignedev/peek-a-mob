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
  duration: number
}
export type Entity = {
  entityId: number,
  entityName: string,
  entityColor: string | null
}
export type DetailedVideo = Video & {
  models: string[]
}

/**
 * Returns a list of detections and bounding boxes
 * @param videoId Video ID to get the mobs of
 * @param time Time in seconds where it should get the detections at
 * @param model Specified which model to fetch, set to null to pick the last one in list
 * @param after How many seconds should it get as well
 * @param before Back seeking if necessary (basically time-before)
 * @returns Object where keys are the detected classes, and their value is the list of bounding boxes
 */
export async function getDetections(videoId: string, time: number, model: string | null = null, after: number = 5, before: number = 0): Promise<EntityDetection> {
  const entityMap = (await getEntities()).reduce((acc, val) => {
    acc[val.entityId] = val.entityName
    return acc
  }, {} as Record<number, string>)
  const video = await getVideo(videoId)
  const occurances: EntityOccurance[] = await (await fetch(`/api/videos/${videoId}/detections/${model ?? video.models.shift()}?ss=${time - before}&to=${time + after}`)).json()

  const entities: EntityDetection = {}
  for (const occurance of occurances) {
    const name = entityMap[occurance.entityId]
    if (!entities[name])
      entities[name] = []

    entities[name].push(occurance)
  }
  return entities
}

export async function getVideos(): Promise<Video[]> {
  return (await fetch('/api/videos')).json()
}

export async function getVideo(youtubeId: string): Promise<DetailedVideo> {
  return (await fetch(`/api/videos/${youtubeId}`)).json()
}

export async function getEntities(): Promise<Entity[]> {
  return (await fetch(`/api/entities`)).json()
}