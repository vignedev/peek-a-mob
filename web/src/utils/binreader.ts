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

export const getDetections = async (binUrl: string, signal?: AbortSignal): Promise<Detection[]> => {
  const resp = await fetch(binUrl, { signal })
  if (!resp.ok)
    throw new Error(`Failed to retrieve: ${resp.status}`)

  const bucket: Detection[] = []
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
      bucket.push({
        classIdx: view.getUint16(needle, true),
        time: view.getFloat32(needle + 2 + 4 * 0, true),
        conf: view.getFloat32(needle + 2 + 4 * 1, true),
        x: view.getFloat32(needle + 2 + 4 * 2, true),
        y: view.getFloat32(needle + 2 + 4 * 3, true),
        w: view.getFloat32(needle + 2 + 4 * 4, true),
        h: view.getFloat32(needle + 2 + 4 * 5, true)
      })
      needle += DETECTION_SIZE
    }

    buffer = temp.slice(needle)
  }

  return bucket
}


type DetectionsHook = {
  state: 'loading',
  detections: undefined,
  error: undefined
} | {
  state: 'error',
  detections: undefined,
  error: Error
} | {
  state: 'success',
  detections: Detection[],
  error: undefined
}

export const useDetections = (binUrl: string): DetectionsHook => {
  const [data, setData] = useState<DetectionsHook>({
    state: 'loading',
    detections: undefined,
    error: undefined
  })

  useEffect(() => {
    setData({
      state: 'loading',
      detections: undefined,
      error: undefined
    })

    const abort = new AbortController()
    getDetections(binUrl, abort.signal)
      .then((det) => setData({ state: 'success', detections: det, error: undefined }))
      .catch((err) => {
        if (abort.signal.aborted) // it was our abortion
          return
        setData({ state: 'error', detections: undefined, error: err })
      })

    return () => { abort.abort() }
  }, [binUrl])

  return data
}