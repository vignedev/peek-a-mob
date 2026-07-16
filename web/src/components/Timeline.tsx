import { useCallback, useRef, type ComponentPropsWithRef, type MouseEvent, type RefObject } from 'react'
import { Canvas } from './Canvas'
import type { VideoInfoRetrieval } from './Video'

export type Detection = {
  timestamp: number
  confidence: number
  x: number, y: number, w: number, h: number
  class: string
}

type TProps = ComponentPropsWithRef<'canvas'> & {
  videoInfo?: RefObject<VideoInfoRetrieval | null>
  detections?: Detection[]
}

export const Timeline = (props: TProps) => {
  const { videoInfo } = props

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

  const renderFn = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let mouse = mousePos.current

    ctx.clearRect(0, 0, width, height)
    ctx.font = '12px Fira Mono'

    ctx.strokeStyle = '#f00'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, width, height)

    ctx.fillStyle = '#f004'
    if (videoInfo?.current)
      ctx.fillRect(0, 0, videoInfo.current.getCurrentTime() / videoInfo.current.getDuration() * width, height)

    if (mouse) {
      ctx.strokeStyle = '#0f06'
      ctx.beginPath()
      ctx.moveTo(0, mouse.y)
      ctx.lineTo(width, mouse.y)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(mouse.x, 0)
      ctx.lineTo(mouse.x, height)
      ctx.stroke()
    }

    ctx.fillStyle = '#fff'
    const lines = [
      `virtual: w:${width} h:${height} dpr:${window.devicePixelRatio}`,
      `canvas:  w:${canvas.width} h:${canvas.height}`,
      `mouse:   ${mouse ? `x:${mouse?.x} y:${mouse?.y}` : ''}`,
      videoInfo?.current ? `video:   ${videoInfo.current.getPlaying() ? 'play' : 'pause'}, ${videoInfo.current.getCurrentTime().toFixed(4)} / ${videoInfo.current.getDuration()}` : '<missing videoInfo>'
    ]
    lines.forEach((line, idx) => {
      ctx.fillText(line, 16, 8 + 16 + 16 * idx)
    })
  }, [videoInfo])

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