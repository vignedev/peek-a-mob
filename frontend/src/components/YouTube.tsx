import { useCallback, useEffect, useState } from 'react'
import YouTube, { YouTubePlayer } from 'react-youtube'
import { Canvas, CanvasDrawingFunction } from './Canvas'
import { Box, Flex } from '@radix-ui/themes'
import { EntityDetection, getDetections } from '../libs/api'
import { tryUntil, wait } from '../libs/utils'

type TimeInfo = [currentTime: number, duration: number]
type ValidRange = [start: number, end: number]

const EntityColors: Record<string, { line: string, box: string }> = {
  chicken: {
    line: 'rgba(0, 255, 0, 0.03)',
    box: ''
  },
  creeper: {
    line: 'rgba(255, 0, 0, 0.03)',
    box: ''
  },
  skeleton: {
    line: 'rgba(255, 0, 0, 0.03)',
    box: ''
  },
  spider: {
    line: 'rgba(255, 0, 0, 0.03)',
    box: ''
  },
  zombie: {
    line: 'rgba(255, 0, 0, 0.03)',
    box: ''
  },
  enderman: {
    line: 'rgba(255, 0, 0, 0.03)',
    box: ''
  }
}

export const VideoTimeline = (props: { player?: YouTubePlayer, timeInfo: TimeInfo, detections: EntityDetection, style?: React.CSSProperties }) => {
  const { player, detections, timeInfo } = props
  const [currentTime, duration] = timeInfo

  let [cachedTimeline, setCachedTimeline] = useState<HTMLCanvasElement>()
  const cacheTimeline = useCallback(async (width: number, height: number) => {
    console.log('(redrawing cacheTimeline)', width, height, detections, player)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // again debug
    // ctx.fillStyle = 'white'
    // ctx.fillText(`keys: ${Object.keys(detections)},${timeInfo.join(', ')}`, 256, 32)

    if (!player)
      return;

    // get the duration
    // const duration = await tryUntil(() => player.getDuration())

    // print of the timelines
    let printed = new Set()
    let lineHeight = Math.floor(ctx.canvas.height / Object.keys(detections).length)
    Object.keys(detections).sort().forEach((entName, idx) => {
      detections[entName].forEach(detection => {
        // borders
        if (idx != 0 && !printed.has(entName)) {
          ctx.strokeStyle = '#fffa'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(0, lineHeight * (idx))
          ctx.lineTo(ctx.canvas.width, lineHeight * (idx))
          ctx.stroke()
        }

        // lines 
        ctx.strokeStyle = EntityColors[entName]?.line || '#ff000005'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(detection.time / duration * ctx.canvas.width + ctx.lineWidth / 2, lineHeight * idx)
        ctx.lineTo(detection.time / duration * ctx.canvas.width + ctx.lineWidth / 2, lineHeight * (idx + 1))
        ctx.stroke()
      })
    })
    return canvas
  }, [player, detections, timeInfo])

  useEffect(() => setCachedTimeline(undefined), [detections, duration])

  const onDraw = useCallback<CanvasDrawingFunction>(async (ctx, mouse) => {
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (!player)
      return;

    // const currentTime = await tryUntil(() => player.getCurrentTime())
    // const duration = await tryUntil(() => player.getDuration())

    if (!cachedTimeline) {
      const newTimeline = await cacheTimeline(ctx.canvas.width, ctx.canvas.height)
      setCachedTimeline(newTimeline)
      if (newTimeline) ctx.drawImage(newTimeline, 0, 0)
    } else {
      ctx.drawImage(cachedTimeline, 0, 0)
    }

    // debug text
    // ctx.fillStyle = 'red'
    // ctx.fillText(`${currentTime} | ${duration} | ${Date.now()} | ${!!cachedTimeline}`, 32, 32)

    // display time in seconds as well as the progress
    ctx.fillStyle = '#f094'
    ctx.fillRect(0, 0, currentTime / duration * ctx.canvas.width, ctx.canvas.height)

    ctx.strokeStyle = '#0005'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(currentTime / duration * ctx.canvas.width, 0)
    ctx.lineTo(currentTime / duration * ctx.canvas.width, ctx.canvas.height)
    ctx.stroke()
    ctx.strokeStyle = '#f09'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(currentTime / duration * ctx.canvas.width, 0)
    ctx.lineTo(currentTime / duration * ctx.canvas.width, ctx.canvas.height)
    ctx.stroke()

    ctx.fillStyle = '#f09'
    ctx.fillText(currentTime?.toFixed(2), currentTime / duration * ctx.canvas.width + 8, ctx.canvas.height - 12)

    // print of the timelines
    let printed = new Set()
    let lineHeight = Math.floor(ctx.canvas.height / Object.keys(detections).length)
    Object.keys(detections).sort().forEach((entName, idx) => {
      const occurances = detections[entName]
      occurances.forEach(detection => {
        // labeling
        if (detection.time < currentTime || printed.has(entName)) return
        const diff = detection.time - currentTime
        printed.add(entName)
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max((1.0 - diff / 30), 0.25)})`
        ctx.fillText(`${entName} [${occurances.filter(x => x.time > currentTime).length}/${occurances.length}]`, 8, lineHeight * idx + 16)
        ctx.fillText((diff).toFixed(2), 8, lineHeight * idx + 32)
      })
    })

    // display cursor if mouse is hovering on top
    if (mouse != null) {
      ctx.strokeStyle = '#0005'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(Math.floor(mouse.x), 0)
      ctx.lineTo(Math.floor(mouse.x), ctx.canvas.height)
      ctx.stroke()

      ctx.fillStyle = ctx.strokeStyle = '#0ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(Math.floor(mouse.x), 0)
      ctx.lineTo(Math.floor(mouse.x), ctx.canvas.height)
      ctx.stroke()

      ctx.fillText((mouse.x / ctx.canvas.width * duration).toFixed(2), mouse.x + 8, 16)
    }
  }, [player, detections, timeInfo, cachedTimeline])

  return (
    <Canvas
      style={{
        height: '24rem',
        ...props.style
      }}
      onDraw={onDraw}
      onMouseDown={async (e, ctx) => {
        if (!player) return;
        player.seekTo((await player.getDuration()) * e.offsetX / ctx.canvas.width, true)
      }}
      onResize={async (canvas) => {
        console.log('[onResize called on timeline]', canvas.width, canvas.height)
        setCachedTimeline(undefined) // force it to redraw the next cycle
        // setCachedTimeline(await cacheTimeline(canvas.width, canvas.height))
      }}
    />
  )
}

export const VideoOverlay = (props: { player?: YouTubePlayer, rollingDetections: EntityDetection, timeInfo: number[] }) => {
  const { player, rollingDetections, timeInfo } = props
  const [currentTime, _duration] = timeInfo

  const onDraw = useCallback<CanvasDrawingFunction>(async (ctx, _mouse) => {
    if (!player) return
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // ctx.fillStyle = 'red'
    // ctx.fillText(`${currentTime}`, 16, 16)
    // ctx.fillText(`rds: ${Object.keys(rollingDetections).join(', ')}`, 16, 32)

    const aspect = ctx.canvas.width / ctx.canvas.height;
    const videoAr = 16 / 9; // TODO: constant aspect ratio, consider variable?
    let x, y, w, h;

    if (aspect > videoAr) { // wider 
      y = 0; h = ctx.canvas.height;
      w = ctx.canvas.width / aspect * videoAr;
      x = (ctx.canvas.width - w) / 2;
    } else if (aspect < videoAr) { // taller
      x = 0; w = ctx.canvas.width;
      h = ctx.canvas.height / videoAr * aspect;
      y = (ctx.canvas.height - h) / 2;
    } else { // == 16/9
      x = y = 0;
      w = ctx.canvas.width;
      h = ctx.canvas.height;
    }

    for (const name in rollingDetections) {
      for (const entity of rollingDetections[name]) {
        const [bx, by, bw, bh] = entity.bbox

        const frameThreshold = 1 / 120
        const dist = Math.abs(entity.time - currentTime)
        const fadeOutSeconds = 1
        let color = 'magenta', alpha = 0.0

        if (dist <= frameThreshold) {
          alpha = 1
          color = EntityColors[name]?.box || 'red'
        } else if (dist <= fadeOutSeconds && currentTime > entity.time) {
          alpha = (1 - (currentTime - entity.time) / fadeOutSeconds) * 0.01
          color = `rgba(0, 0, 255, ${alpha})`
        } else {
          continue
        }

        const header = `${name} ${(entity.confidence * 100).toFixed(1)}%`
        const headerSize = ctx.measureText(header)
        const headerHeight = headerSize.fontBoundingBoxAscent + headerSize.fontBoundingBoxDescent + 4

        if (alpha == 1.0) {
          ctx.lineWidth = 8
          ctx.fillStyle = ctx.strokeStyle = '#000000ff';
          ctx.strokeRect(
            x + bx * w,
            y + by * h,
            bw * w,
            bh * h
          )
          ctx.fillRect(x + bx * w - ctx.lineWidth / 2, y + by * h - headerHeight - ctx.lineWidth / 4, headerSize.width + 4 + ctx.lineWidth / 2, headerHeight)
        }

        ctx.lineWidth = 4
        ctx.fillStyle = ctx.strokeStyle = color;
        ctx.strokeRect(
          x + bx * w,
          y + by * h,
          bw * w,
          bh * h
        )
        ctx.fillRect(x + bx * w - ctx.lineWidth / 2 - 1, y + by * h - headerHeight, headerSize.width + 4 + ctx.lineWidth / 2, headerHeight)
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.fillText(header, x + bx * w, y + by * h - 4)
      }
    }
  }, [player, rollingDetections, timeInfo])

  return <Canvas
    style={{
      pointerEvents: 'none',
      position: 'absolute',
      left: 0, top: 0,
      width: '100%',
      height: '100%'
    }}
    onDraw={onDraw}
  />
}

export const YouTubeWithTimeline = (props: { videoId: string, modelName: string }) => {
  const [player, setPlayer] = useState<YouTubePlayer>()
  const [detections, setDetections] = useState<EntityDetection>({})
  const [rollingDetections, setRollingDetections] = useState<{ detections: EntityDetection, range: ValidRange }>()
  const [timeInfo, setTimeInfo] = useState<TimeInfo>([0, 0])

  // time retaining loop
  useEffect(() => {
    let condition = true
    const loop = async () => {
      while (condition) {
        if (player) setTimeInfo([await player.getCurrentTime(), await player.getDuration()])
        await wait(1000 / 30) // shannon theorem be damned
      }
    }
    loop()
    return () => { condition = false }
  }, [player])

  // update the detections array on new video ID update
  useEffect(() => {
    setDetections({})
    setTimeInfo([0, 0])
    getDetections(props.videoId, 0, props.modelName, Infinity)
      .then(setDetections)
  }, [props.videoId, props.modelName])

  useEffect(() => {
    console.log('model change')
    setRollingDetections(undefined)
  }, [props.modelName])

  // loop 
  useEffect(() => {
    if (!player) return;

    let condition = true
    const loop = async () => {
      while (condition) {
        const newTime = await player!.getCurrentTime()
        if (!rollingDetections || newTime <= rollingDetections.range[0] || newTime >= rollingDetections.range[1]) {
          setRollingDetections({
            detections: await getDetections(props.videoId, newTime, props.modelName, 10, 10),
            range: [newTime - 7, newTime + 7] // the "valid range" where this cached are is for
          })
        }
        await wait(1000) // shannon theorem is ignored here tbh wwwwwwwwww
      }
    }
    loop()
    return () => { condition = false }
  }, [player, props.videoId, rollingDetections, props.modelName])


  return (
    <Flex direction='column' gap='1'>
      <Box height='40rem' position='relative' style={{ borderRadius: '.5rem', overflow: 'hidden' }}>
        <YouTube
          className='youtubeEmbed'
          videoId={props.videoId}
          onReady={async (event) => {
            setPlayer(event.target)
          }}
        />
        <VideoOverlay
          player={player}
          timeInfo={timeInfo}
          rollingDetections={rollingDetections?.detections || {}}
        />
      </Box>
      <VideoTimeline
        player={player}
        timeInfo={timeInfo}
        detections={detections}
        style={{ borderRadius: '.5rem', overflow: 'hidden' }}
      />
    </Flex>
  )
}
