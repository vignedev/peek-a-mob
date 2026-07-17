import { useCallback, useEffect, useRef, useState, type ComponentPropsWithRef, type MouseEvent, type RefObject } from 'react'
import { Canvas, type CanvasRenderFunction } from './Canvas'
import type { VideoInfoRetrieval } from './Video'
import { type Detection } from '../utils/binreader'

type TProps = ComponentPropsWithRef<'canvas'> & {
  videoInfo: RefObject<VideoInfoRetrieval | null>
  detections?: Detection[]
  classes?: Record<number, string>
}

export const Timeline = (props: TProps) => {
  const { detections, classes, videoInfo } = props

  const [canvasHeight, setCanvasHeight] = useState(3 * 24)
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

  const heatmapMemo = useRef<{ canvas: HTMLCanvasElement, name: string, ctx: CanvasRenderingContext2D }[] | null>(null)
  const renderHeatmap = useCallback((detections: Detection[], classes: Record<number, string>, duration: number) => {
    const HEATMAP_RESOLUTION = 1024 as const

    let idToCanvasMap: Record<number, number> = {}
    const canvases = Object.entries(classes).map(([classIdx, cls], idx) => {
      const canvas = heatmapMemo.current?.[idx]?.canvas ?? document.createElement('canvas')
      canvas.width = HEATMAP_RESOLUTION
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (!ctx)
        throw new Error('failed to get drawing context, for some reason...')

      idToCanvasMap[+classIdx] = idx
      return { name: cls, canvas: canvas, ctx: ctx }
    })

    const lineWidth = Math.max(Math.ceil(HEATMAP_RESOLUTION / duration / 60.0), 3.0)
    for (const d of detections) {
      const { canvas, ctx } = canvases[idToCanvasMap[d.classIdx]]
      const relX = d.time / duration

      ctx.fillStyle = '#00aaff2a'
      ctx.fillRect(
        Math.floor(relX * canvas.width - lineWidth / 2), 0,
        lineWidth, canvas.height
      )
    }

    setCanvasHeight(canvases.length * 32)
    heatmapMemo.current = canvases
  }, [])
  useEffect(() => {
    heatmapMemo.current = null
  }, [detections, renderHeatmap])

  const renderFn = useCallback<CanvasRenderFunction>((_canvas, ctx, width, height) => {
    let mouse = mousePos.current

    ctx.clearRect(0, 0, width, height)
    ctx.font = '12px sans-serif'

    // layer 0: heatmap
    if (heatmapMemo.current) {
      const rowHeight = height / heatmapMemo.current.length
      heatmapMemo.current?.forEach(({ canvas }, idx) => {
        ctx.drawImage(canvas, 0, rowHeight * idx, width, rowHeight)
      })
    }

    // layer 1: progress indicators
    if (videoInfo.current) {
      const currentTime = videoInfo.current.getCurrentTime()
      const duration = videoInfo.current.getDuration()

      const posX = currentTime / duration * width
      ctx.fillStyle = '#f004'
      ctx.fillRect(0, 0, posX, height)

      ctx.strokeStyle = '#f005'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(posX, 0)
      ctx.lineTo(posX, height)
      ctx.stroke()

      if (!heatmapMemo.current && classes && detections && duration !== 0 && !isNaN(duration))
        renderHeatmap(detections, classes, duration)
    }

    // layer 2: swimlines
    if (heatmapMemo.current) {
      const rowHeight = height / heatmapMemo.current.length
      heatmapMemo.current?.forEach((_, idx) => {
        if (idx > 0) {
          const y = Math.floor(rowHeight * idx) + 0.5
          ctx.strokeStyle = '#fff7'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(width, y)
          ctx.stroke()
        }
      })
    }

    // layer 3: mouse highlight
    if (mouse) {
      ctx.strokeStyle = '#0f0f'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(mouse.x + 0.5, 0)
      ctx.lineTo(mouse.x + 0.5, height)
      ctx.stroke()
    }

    // layer 4: labels
    if (heatmapMemo.current) {
      const rowHeight = height / heatmapMemo.current.length
      heatmapMemo.current?.forEach(({ name }, idx) => {
        const metrics = ctx.measureText(name)
        let x = 10
        let y = rowHeight * idx + rowHeight / 2 + (metrics.fontBoundingBoxDescent + metrics.fontBoundingBoxAscent) / 4.0
        let padding = 6
        let bbHeight = 10

        ctx.fillStyle = '#000b'
        ctx.strokeStyle = '#fff3'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.roundRect(
          x - padding,
          rowHeight * idx + (rowHeight - bbHeight) / 2.0 - padding,
          metrics.width + padding * 2, bbHeight + padding * 2,
          4
        )
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.fillText(name, x, y)
      })
    }

    // debug output
    // ctx.fillStyle = '#fff'
    // const lines = [
    //   `virtual: w:${width} h:${height} dpr:${window.devicePixelRatio}`,
    //   `canvas:  w:${canvas.width} h:${canvas.height}`,
    //   `mouse:   ${mouse ? `x:${mouse?.x} y:${mouse?.y}` : ''}`,
    //   `heatmapMemo: ${!!heatmapMemo.current}`,
    //   `detections: ${!!detections} ${detections ? detections.length : '?'}`,
    //   videoInfo.current ? `video:   ${videoInfo.current.getPlaying() ? 'play' : 'pause'}, ${videoInfo.current.getCurrentTime().toFixed(4)} / ${videoInfo.current.getDuration()}` : '<missing videoInfo>'
    // ]
    // lines.forEach((line, idx) => {
    //   ctx.fillText(line, 16, 8 + 16 + 16 * idx)
    // })
  }, [videoInfo, heatmapMemo, classes, detections, renderHeatmap])

  return (
    <Canvas
      className='bg-slate-950'
      style={{
        height: `${canvasHeight}px`
      }}
      onRender={renderFn}
      onMouseEnter={onMouseTrack}
      onMouseMove={onMouseTrack}
      onMouseLeave={onMouseTrack}
      onMouseDown={onMouseDown}
      onContextMenu={(e) => e.preventDefault()}
    />
  )
}