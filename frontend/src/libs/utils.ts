import { EntityDetection } from "./api";

/**
 * Performs the C++'s version of lower_bound. Assumes the array is sorted.-
 * @param array Sorted array tofind the lower bound in
 * @param isLess Function that performs 'a < value'
 * @returns Closest lower bound of the selected value
 */
export function lowerBound<T>(array: T[], isLess: (a: T) => boolean): number {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    if (isLess(array[mid])) { // array[mid] < value
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function tryUntil<T>(source: () => Promise<T>, tester?: (a: T) => boolean, max: number = 60, timeout: number = 16): Promise<T> {
  let result: T
  let count = 0
  let _tester = tester ?? ((val) => typeof val !== 'undefined')
  while (!_tester(result = await source()) && count++ < max)
    await wait(timeout)
  return result
}

export async function strictFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init)
  if (!response.ok) {
    if (response.headers.get('content-type') === 'application/json')
      throw await response.json()
    const body = await response.text()
    throw new Error(`Server responded with ${response.status} ${body ?? ` "${body}"`}`)
  }
  return response
}

export async function invokeDownload(url: string, filename: string) {
  const temp = document.createElement('a')
  temp.href = url
  temp.download = filename
  temp.click()
}

export function formatDuration(time: number, duration?: number) {
  return new Date(time * 1000.0).toISOString().substring(((duration || time) >= 3_600) ? 11 : 14, 19) + (time - Math.floor(time)).toFixed(2).substring(1)
}

export const RandomColorFromString = (text: string, alpha: number = 0.03) => {
  let value = 0
  for (let i = 0; i < text.length; ++i)
    value += Math.pow(text.charCodeAt(i), 2.6)

  return `hsla(${value % 360}, 80%, 45%, ${alpha})`
}

export function sliceLowerBound<T>(array: T[], start: (a: T) => boolean, end: (b: T) => boolean): T[] {
  const startIdx = Math.max(lowerBound(array, start), 0)
  const endIdx = Math.max(Math.min(lowerBound(array, end), array.length - 1), 0)
  return array.slice(startIdx, endIdx)
}

export function sliceDetections(detections: EntityDetection, start: number, end: number): EntityDetection {
  const copy: EntityDetection = {}
  for (const key in detections)
    copy[key] = sliceLowerBound(detections[key], a => a.time < start, b => b.time < end)
  return copy
}