import { forwardRef, useImperativeHandle, useRef, type ComponentPropsWithRef } from 'react';

export type VideoInfoRetrieval = {
  getPlaying(): boolean
  getCurrentTime(): number
  getDuration(): number
  seekTo(time: number): void
}

type TProps = ComponentPropsWithRef<'video'> & {}

export const Video = forwardRef<VideoInfoRetrieval, TProps>(
  (props, ref) => {
    const { ...rest } = props

    const videoRef = useRef<HTMLVideoElement>(null)
    useImperativeHandle(ref, () => {
      return {
        getPlaying: () => !videoRef.current?.paused,
        getCurrentTime: () => videoRef.current?.currentTime ?? 0,
        getDuration: () => videoRef.current?.duration ?? 0,
        seekTo: (time) => {
          if (videoRef.current)
            videoRef.current.currentTime = time
        }
      }
    }, [videoRef])

    return <video {...rest} ref={videoRef} />
  }
)

