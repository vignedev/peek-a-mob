import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { VideoInfoRetrieval } from './Video'
import type { ClassValue } from 'clsx'
import { cn } from '../utils/combine'

type TProps = {
  videoId: string,
  className?: ClassValue
}

export const YouTube = forwardRef<VideoInfoRetrieval, TProps>(
  (props, ref) => {

    const { videoId, className } = props
    const yt = useYouTube()

    const replRef = useRef<HTMLDivElement>(null)
    const ytRef = useRef<YT.Player | null>(null)

    useEffect(() => {
      if (!yt || !replRef.current)
        return

      const player = new yt.Player(replRef.current, {
        videoId: videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          playsinline: 1,
          enablejsapi: 1,
          iv_load_policy: 3
        }
      })
      ytRef.current = player
      return () => player.destroy()
    }, [yt, videoId])

    useImperativeHandle(ref, () => {
      return {
        getPlaying: () => {
          console.log(ytRef?.current)
          return ytRef.current?.getPlayerState?.() === YT.PlayerState.PLAYING
        },
        getCurrentTime: () => ytRef.current?.getCurrentTime?.() ?? 0,
        getDuration: () => ytRef.current?.getDuration?.() ?? 0,
        seekTo: (time) => ytRef.current?.seekTo?.(time, true)
      }
    }, [ytRef])

    return <div className={cn(className)}>
      <div ref={replRef} />
    </div>
  }
)

// basically to await for youtube api to be loaded properly
const useYouTube = () => {
  const [isReady, setIsReady] = useState(!!window.YT && window.isYouTubeLoaded)
  useEffect(() => {
    if (isReady)
      return

    const callback = () => setIsReady(true)
    window.addEventListener('youtube-load', callback)
    return () => window.removeEventListener('youtube-load', callback)
  }, [isReady])

  return isReady ? window.YT : null
}