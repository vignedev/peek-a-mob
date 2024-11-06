
export type Entity = {
  conf: number,
  x: number, y: number,
  w: number, h: number
}
export type EntityDetection = Record<string, Entity[]>

// TODO: make it async, and you know... actually work
/**
 * Returns a list of detections and bounding boxes
 * @param videoId Video ID to get the mobs of
 * @param time Time in seconds where it should get the detections at
 * @param after How many seconds should it get as well
 * @param before Back seeking if necessary (basically time-before)
 * @returns Object where keys are the detected classes, and their value is the list of bounding boxes
 */
export function getDetections(videoId: string, time: number, after: number = 5, before: number = 0): EntityDetection {
  return {
    'zombie': [
      {
        conf: 0.8311064839363098,
        x: 0.40599140152335167,
        y: 0.3386853262782097,
        w: 0.0665946677327156,
        h: 0.14601381123065948,
      }
    ]
  }
}