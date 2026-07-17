import { useEffect, useState } from 'react'

export type Detection = {
  time: number,
  classIdx: number,
  x: number, y: number,
  w: number, h: number,
  conf: number,
}

const DETECTION_SIZE = 26 as const // keep in sync with csvpack.cjs
export const ID_TO_ENTITY_MAP: Record<number, string> = {
  0: 'skeleton',
  1: 'zombie',
  2: 'wolf',
  3: 'creeper',
  4: 'spider',
  5: 'chicken',
  6: 'enderman',
  8: 'pig',
  7: 'cow',
}

export const getDetections = async (binUrl: string, signal?: AbortSignal): Promise<{ detections: Detection[], classes: Record<number, string> }> => {
  const resp = await fetch(binUrl, { signal })
  if (!resp.ok)
    throw new Error(`Failed to retrieve: ${resp.status}`)

  if (!resp.body)
    throw new Error(`where's the body`)

  const bucket: Detection[] = []
  const classes: Record<number, string> = {}

  const reader = resp.body.getReader()
  let buffer = new Uint8Array(0)

  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break

    const temp = new Uint8Array(buffer.length + value.length)
    temp.set(buffer)
    temp.set(value, buffer.length)

    let needle = 0
    const view = new DataView(temp.buffer)
    while (needle + DETECTION_SIZE <= temp.length) {
      const occurence = {
        classIdx: view.getUint16(needle, true),
        time: view.getFloat32(needle + 2 + 4 * 0, true),
        conf: view.getFloat32(needle + 2 + 4 * 1, true),
        x: view.getFloat32(needle + 2 + 4 * 2, true),
        y: view.getFloat32(needle + 2 + 4 * 3, true),
        w: view.getFloat32(needle + 2 + 4 * 4, true),
        h: view.getFloat32(needle + 2 + 4 * 5, true)
      }
      bucket.push(occurence)
      needle += DETECTION_SIZE

      if (!classes[occurence.classIdx])
        classes[occurence.classIdx] = ID_TO_ENTITY_MAP[occurence.classIdx]
    }

    buffer = temp.slice(needle)
  }

  return {
    detections: bucket,
    classes: classes
  }
}


type DetectionsHook = {
  state: 'loading',
  detections: undefined,
  classes: undefined
  error: undefined
} | {
  state: 'error',
  detections: undefined,
  classes: undefined
  error: Error
} | {
  state: 'success',
  detections: Detection[],
  classes: Record<number, string>
  error: undefined
}

export const useDetections = (binUrl: string): DetectionsHook => {
  const [data, setData] = useState<DetectionsHook>({
    state: 'loading',
    detections: undefined,
    classes: undefined,
    error: undefined
  })

  useEffect(() => {
    setData({
      state: 'loading',
      detections: undefined,
      classes: undefined,
      error: undefined
    })

    const abort = new AbortController()
    getDetections(binUrl, abort.signal)
      .then(({ detections, classes }) => setData({ state: 'success', detections, classes, error: undefined }))
      .catch((err) => {
        if (abort.signal.aborted) // it was our abortion
          return
        setData({ state: 'error', detections: undefined, classes: undefined, error: err })
      })

    return () => { abort.abort() }
  }, [binUrl])

  return data
}