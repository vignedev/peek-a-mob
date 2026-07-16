export { }

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void
    isYouTubeLoaded?: boolean
    YT: typeof YT
  }
}