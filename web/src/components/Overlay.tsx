import { useCallback, type ComponentProps, type RefObject } from 'react'
import { Canvas, type CanvasRenderFunction } from './Canvas'
import { ID_TO_ENTITY_MAP, type Detection } from '../utils/binreader'
import type { VideoInfoRetrieval } from './Video'
import { lowerBound } from '../utils/lowerbound'

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
    const closestIdx = lowerBound(detections, ([, time]) => time < currentTime)
    // ctx.fillText(`idx: ${closestIdx}`, 16, 32)

    for (let i = closestIdx; i < detections.length; ++i) {
      const [classIdx, time, conf, x, y, w, h] = detections[i]

      if (time - currentTime >= (1 / 60 - Number.EPSILON))
        break

      // ctx.fillStyle = '#fff'
      // ctx.fillText(`[${i}] ${det.time.toFixed(2)} ${ID_TO_ENTITY_MAP[det.classIdx]}`, 16, 48 + 16 * (i - closestIdx))

      ctx.fillStyle = '#ff04'
      ctx.strokeStyle = '#ff0'
      ctx.lineWidth = 2
      const [bbx, bbw] = [x, w].map(v => v * width)
      const [bby, bbh] = [y, h].map(v => v * height)

      ctx.fillRect(bbx, bby, bbw, bbh)
      ctx.strokeRect(
        bbx - ctx.lineWidth / 2, bby - ctx.lineWidth / 2,
        bbw + ctx.lineWidth, bbh + ctx.lineWidth
      )

      const clsLabel = `${ID_TO_ENTITY_MAP[classIdx]} (${(conf * 100).toFixed(1)}%)`
      const measure = ctx.measureText(clsLabel)
      const textHeight = measure.actualBoundingBoxAscent - measure.actualBoundingBoxDescent

      let vertOffset = (y - textHeight <= 0) ? (h + textHeight + ctx.lineWidth * 4) : 0

      ctx.fillStyle = ctx.strokeStyle
      ctx.fillRect(
        x - ctx.lineWidth, y - textHeight - ctx.lineWidth * 4 + vertOffset,
        measure.width + ctx.lineWidth * 2, textHeight + ctx.lineWidth * 4
      )
      ctx.fillStyle = '#000'
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