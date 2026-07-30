import type { ComponentProps } from 'react'
import { Select } from './Select'
import { cn } from '../utils/combine'
import { useFetch } from '../utils/fetch'

type TProps = {
  className?: ComponentProps<'select'>['className'],
  currentVideo: string,
  setCurrentVideo: (value: string) => void
}
export const VideoSelect = (props: TProps) => {
  const { className, currentVideo, setCurrentVideo } = props
  const { state, data } = useFetch<{ title: string, value: string }[]>('/detections/index.json')

  return <Select
    className={cn('h-10', className)}
    placeholder={state === 'loading' ? 'chotto a minute' : (state === 'error' ? 'dangit, something went awry' : 'select a video')}
    value={currentVideo}
    onValueChange={(val) => setCurrentVideo(val)}
    items={data ?? []}
  />
}