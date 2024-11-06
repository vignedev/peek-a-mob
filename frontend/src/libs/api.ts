import { lowerBound } from './utils'
import exampleVideo1 from './yt_4Vs1wKjNuUw.json'

export type EntityOccurance = {
  time: number, conf: number,
  x: number, y: number,
  w: number, h: number
}
export type EntityDetection = Record<string, EntityOccurance[]>

// TODO: make it async, and you know... actually work
/**
 * Returns a list of detections and bounding boxes
 * @param videoId Video ID to get the mobs of
 * @param time Time in seconds where it should get the detections at
 * @param after How many seconds should it get as well
 * @param before Back seeking if necessary (basically time-before)
 * @returns Object where keys are the detected classes, and their value is the list of bounding boxes
 */
export async function getDetections(videoId: string, time: number, after: number = 5, before: number = 0): Promise<EntityDetection> {
  if (videoId != '4Vs1wKjNuUw')
    return {}

  const entities: EntityDetection = {}
  const
    lb = lowerBound(exampleVideo1, a => a.time < time - before),
    ub = lowerBound(exampleVideo1, a => a.time < (time - before + after))

  for (let i = lb; i < ub; ++i) {
    const { class: className, confidence, x, y, w, h, time } = exampleVideo1[i]
    if (className in entities === false)
      entities[className] = []
    entities[className].push({
      conf: confidence,
      x, y, w, h, time
    })
  }
  return entities
}