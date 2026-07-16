import { useEffect, useState } from 'react'

export const useYouTube = () => {
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