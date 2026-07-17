import { useCallback, useEffect, useRef, type ComponentPropsWithRef, type MouseEvent, type RefObject } from 'react'
import { Canvas, type CanvasRenderFunction } from './Canvas'
import type { VideoInfoRetrieval } from './Video'
import { type Detection } from '../utils/binreader'

type TProps = ComponentPropsWithRef<'canvas'> & {
  videoInfo: RefObject<VideoInfoRetrieval | null>
  detections?: Detection[]
}

export const Timeline = (props: TProps) => {
  const { detections, videoInfo } = props

  const mousePos = useRef<{ x: number, y: number } | null>(null)
  const extractPosition = (e: MouseEvent<HTMLCanvasElement>) => {
    return { x: e.pageX - e.currentTarget.offsetLeft, y: e.pageY - e.currentTarget.offsetTop }
  }

  const onMouseTrack = (e: MouseEvent<HTMLCanvasElement>) => {
    mousePos.current = (e.type === 'mouseleave') ? null : extractPosition(e)

    // "seek dragging"
    if (e.buttons === 1)
      onMouseDown(e)
  }

  const onMouseDown = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    if (!videoInfo || !videoInfo.current)
      return

    const relativeX = extractPosition(e).x / e.currentTarget.clientWidth
    videoInfo.current.seekTo(relativeX * videoInfo.current.getDuration())
  }, [videoInfo])

  const heatmapMemo = useRef<HTMLCanvasElement | null>(null)
  const renderHeatmap = useCallback((detections: Detection[], duration: number) => {
    const canvas = heatmapMemo.current ?? document.createElement('canvas')
    canvas.width = canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (!ctx)
      return

    const lineWidth = Math.ceil(canvas.width / duration / 60.0)
    ctx.fillStyle = '#00ffff0f'
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const d of detections) {
      const relX = d.time / duration
      ctx.fillRect(
        Math.floor(relX * canvas.width - lineWidth / 2), 0,
        lineWidth, canvas.height
      )
    }

    heatmapMemo.current = canvas
  }, [])
  useEffect(() => {
    heatmapMemo.current = null
  }, [renderHeatmap])

  const renderFn = useCallback<CanvasRenderFunction>((canvas, ctx, width, height) => {
    let mouse = mousePos.current

    ctx.clearRect(0, 0, width, height)
    ctx.font = '12px sans-serif'

    if (heatmapMemo.current)
      ctx.drawImage(heatmapMemo.current, 0, 0, width, height)

    if (videoInfo.current) {
      const currentTime = videoInfo.current.getCurrentTime()
      const duration = videoInfo.current.getDuration()

      const posX = currentTime / duration * width
      ctx.fillStyle = '#f004'
      ctx.fillRect(0, 0, posX, height)

      ctx.strokeStyle = '#f00'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(posX, 0)
      ctx.lineTo(posX, height)
      ctx.stroke()

      if (!heatmapMemo.current && detections && duration !== 0 && !isNaN(duration))
        renderHeatmap(detections, duration)
    }

    // mouse highlight
    if (mouse) {
      ctx.strokeStyle = '#0f0f'
      ctx.beginPath()
      ctx.moveTo(mouse.x, 0)
      ctx.lineTo(mouse.x, height)
      ctx.stroke()
    }

    // debug output
    ctx.fillStyle = '#fff'
    const lines = [
      `virtual: w:${width} h:${height} dpr:${window.devicePixelRatio}`,
      `canvas:  w:${canvas.width} h:${canvas.height}`,
      `mouse:   ${mouse ? `x:${mouse?.x} y:${mouse?.y}` : ''}`,
      `heatmapMemo: ${!!heatmapMemo.current}`,
      `detections: ${!!detections}`,
      videoInfo.current ? `video:   ${videoInfo.current.getPlaying() ? 'play' : 'pause'}, ${videoInfo.current.getCurrentTime().toFixed(4)} / ${videoInfo.current.getDuration()}` : '<missing videoInfo>'
    ]
    lines.forEach((line, idx) => {
      ctx.fillText(line, 16, 8 + 16 + 16 * idx)
    })
  }, [videoInfo, heatmapMemo, detections, renderHeatmap])

  return (
    <Canvas
      className='h-80'
      onRender={renderFn}
      onMouseEnter={onMouseTrack}
      onMouseMove={onMouseTrack}
      onMouseLeave={onMouseTrack}
      onMouseDown={onMouseDown}
      onContextMenu={(e) => e.preventDefault()}
    />
  )
}