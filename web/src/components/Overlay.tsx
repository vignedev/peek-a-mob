import { useCallback, type ComponentProps, type RefObject } from 'react'
import { Canvas, type CanvasRenderFunction } from './Canvas'
import { ID_TO_ENTITY_MAP, type Detection } from '../utils/binreader'
import type { VideoInfoRetrieval } from './Video'
import { lowerBound } from '../utils/lowerbound'
import { EntityColorMapping, type EntityColor } from '../utils/entityColors'

type TProps = ComponentProps<'canvas'> & {
  videoInfo: RefObject<VideoInfoRetrieval | null>
  detections?: Detection[]
}

export const Overlay = (props: TProps) => {
  const { videoInfo, detections, ...rest } = props

  const renderFn = useCallback<CanvasRenderFunction>((_canvas, ctx, width, height) => {
    ctx.font = '12px sans-serif'
    ctx.clearRect(0, 0, width, height)

    if (!videoInfo.current || !detections)
      return

    const currentTime = videoInfo.current.getCurrentTime()

    // get the smallest
    ctx.fillStyle = '#fff'
    const closestIdx = lowerBound(detections, (det) => det.time < currentTime)
    // ctx.fillText(`idx: ${closestIdx}`, 16, 32)

    for (let i = closestIdx; i < detections.length; ++i) {
      const det = detections[i]
      const cls = ID_TO_ENTITY_MAP[det.classIdx]
      const settings = EntityColorMapping[cls]

      if (det.time - currentTime >= (1 / 60 - Number.EPSILON))
        break

      // ctx.fillStyle = '#fff'
      // ctx.fillText(`[${i}] ${det.time.toFixed(2)} ${ID_TO_ENTITY_MAP[det.classIdx]}`, 16, 48 + 16 * (i - closestIdx))

      // precalc of common and requried stuff
      const [x, w] = [det.x, det.w].map(v => v * width)
      const [y, h] = [det.y, det.h].map(v => v * height)
      const clsLabel = `${cls} (${(det.conf * 100).toFixed(1)}%)`
      const measure = ctx.measureText(clsLabel)
      const textHeight = measure.actualBoundingBoxAscent - measure.actualBoundingBoxDescent
      let vertOffset = (y - textHeight <= 0) ? (h + textHeight + ctx.lineWidth * 4) : 0
      const expLineWidth = 3

      // underlay
      ctx.strokeStyle = settings.dark ? '#fff6' : '#0006'
      ctx.lineWidth = 4
      ctx.strokeRect(
        x - expLineWidth / 2, y - expLineWidth / 2,
        w + expLineWidth, h + expLineWidth
      )

      const diff = (ctx.lineWidth - expLineWidth) / 2
      ctx.fillStyle = settings.dark ? '#fff6' : '#0006'
      ctx.fillRect(
        x - expLineWidth - diff, y - textHeight - expLineWidth * 4 + vertOffset - diff,
        measure.width + expLineWidth * 2 + diff * 2, textHeight + expLineWidth * 4 + diff * 2
      )

      // real 
      ctx.strokeStyle = settings.color
      ctx.lineWidth = expLineWidth
      ctx.strokeRect(
        x - ctx.lineWidth / 2, y - ctx.lineWidth / 2,
        w + ctx.lineWidth, h + ctx.lineWidth
      )

      ctx.fillStyle = ctx.strokeStyle
      ctx.fillRect(
        x - ctx.lineWidth, y - textHeight - ctx.lineWidth * 4 + vertOffset,
        measure.width + ctx.lineWidth * 2, textHeight + ctx.lineWidth * 4
      )

      ctx.fillStyle = settings.dark ? '#fff' : '#000'
      ctx.fillText(clsLabel, x, y - ctx.lineWidth * 2 + vertOffset)
    }

    // // debug boundaries
    // ctx.fillStyle = '#00f'
    // ctx.fillRect(0, height - 8, width, 8)

    // ctx.fillStyle = '#0f0'
    // ctx.fillRect(0, height - 8, relX * width, 8)

    // ctx.strokeStyle = 'red'
    // ctx.lineWidth = 4
    // ctx.strokeRect(0, 0, width, height)
  }, [videoInfo, detections])

  return <Canvas
    onRender={renderFn}
    {...rest}
  />
}