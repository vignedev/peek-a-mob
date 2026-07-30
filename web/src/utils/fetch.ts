import { useEffect, useState } from 'react'

export type FetchHook<T> = {
  state: 'loading' | 'idle',
  data: undefined,
  error: undefined
} | {
  state: 'error',
  data: undefined,
  error: Error
} | {
  state: 'success',
  data: T,
  error: undefined
}

export const useFetch = <T>(endpoint: string): FetchHook<T> => {
  const [data, setData] = useState<FetchHook<T>>({
    state: 'idle',
    data: undefined,
    error: undefined
  })

  useEffect(() => {
    setData({
      state: 'loading',
      data: undefined,
      error: undefined
    })

    const abort = new AbortController()
    fetch(endpoint, { signal: abort.signal })
      .then(res => res.json())
      .then(data => setData({ state: 'success', data: data as T, error: undefined }))
      .catch(error => setData({ state: 'error', data: undefined, error }))

    return () => { abort.abort() }
  }, [endpoint])

  return data
}