import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (typeof window !== 'undefined') {
  window.onYouTubeIframeAPIReady = () => {
    window.isYouTubeLoaded = true
    window.dispatchEvent(new CustomEvent('youtube-load'))
  }

  if (!window.YT) {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    if (firstScriptTag?.parentNode)
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    else
      document.head.appendChild(tag)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
