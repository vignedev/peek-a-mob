import { useCallback, useEffect, useState } from 'react'
import YouTube, { YouTubePlayer } from 'react-youtube'
import { Canvas, CanvasDrawingFunction, CanvasProps } from './Canvas'
import { Box, Flex } from '@radix-ui/themes'
import { EntityDetection, getDetections } from '../libs/api'

type PlayerProps = {
  videoId: string
}

export const VideoTimeline = (props: { player: YouTubePlayer | undefined, currentTime: number, duration: number, detections: EntityDetection }) => {
  const { player, currentTime, duration, detections } = props
  console.log(props)

  const onDraw = useCallback<CanvasDrawingFunction>(async (ctx, mouse) => {
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = 'white'
    ctx.fillText(`${ctx.canvas.width} x ${ctx.canvas.height} | ${new Date().toLocaleString()}`, ctx.canvas.width / 2, 16)
    ctx.fillText(`${!!player}`, ctx.canvas.width / 2, 48)

    if (!player)
      return;

    ctx.fillText(`${currentTime.toFixed(2)}/${duration} | x=${mouse.x} | y=${mouse.y}`, ctx.canvas.width / 2, 32)

    let lines = 0
    Object.entries(detections).forEach(([entName, occurances]) => {
      occurances.forEach(detection => {
        ctx.strokeStyle = '#0f0'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(detection.time / duration * ctx.canvas.width, 0)
        ctx.lineTo(detection.time / duration * ctx.canvas.width, ctx.canvas.height)
        ctx.stroke()

        if (detection.time < currentTime) return
        ctx.fillStyle = 'white'
        ctx.fillText(`${entName} ${detection.time - currentTime}`, ctx.canvas.width / 2, 48 + 16 * lines++)
      })
    })

    ctx.fillStyle = '#f005'
    ctx.fillRect(0, 0, currentTime / duration * ctx.canvas.width, ctx.canvas.height)

    ctx.strokeStyle = '#f00'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(mouse.x, 0)
    ctx.lineTo(mouse.x, ctx.canvas.height)
    ctx.stroke()
  }, [player, currentTime, duration, detections])

  return (
    <Canvas
      style={{
        height: '5rem'
      }}
      onDraw={onDraw}
      onMouseDown={(e, ctx) => {
        if (!player) return;
        player.seekTo(duration * e.offsetX / ctx.canvas.width, true)
      }} />
  )
}

export const YouTubeWithTimeline = (props: PlayerProps) => {
  const [player, setPlayer] = useState<YouTubePlayer>()
  const [duration, setDuration] = useState<number>(-1)
  const [currentTime, setCurrentTime] = useState<number>(-1)
  const [detections, setDetections] = useState<EntityDetection>({})

  const [rollingDetections, setRollingDetections] = useState<EntityDetection>({})

  useEffect(() => {
    getDetections(props.videoId, 0, Infinity).then(setDetections)
  }, [])

  useEffect(() => {
    if (!player) return;

    const interval = setInterval(async () => {
      const newTime = await player.getCurrentTime()
      if (Math.abs(newTime - currentTime) >= 5)
        setRollingDetections(await getDetections(props.videoId, currentTime, Infinity, 5))
      setCurrentTime(newTime)
    }, 16)
    return () => clearInterval(interval)
  }, [player])

  const VideoOverlay = () => (
    <Canvas
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        left: 0, top: 0,
        width: '100%',
        height: '100%'
      }}
      onDraw={(ctx, _mouse) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

        ctx.fillStyle = 'red'
        ctx.fillText(`${currentTime}`, 16, 16)

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

        ctx.lineWidth = 1
        ctx.strokeStyle = 'red'

        let width = Math.abs(Math.sin(Date.now() / 1000.0 * Math.PI)) * 16
        ctx.strokeRect(x + width, y + width, w - width * 2, h - width * 2)

        for (const name in rollingDetections) {
          for (const entity of rollingDetections[name]) {
            const dist = Math.abs(entity.time - currentTime)
            const alpha = Math.pow(Math.max(1.0 - dist / 2, 0.0), 2.3)
            if (Math.abs(entity.time - currentTime) > 10)
              continue

            ctx.fillStyle = ctx.strokeStyle = (currentTime < entity.time) ?
              `rgba(0, 0, 255, ${alpha})` :
              `rgba(255, 0, 0, ${alpha})`
            ctx.strokeRect(
              x + entity.x * w,
              y + entity.y * h,
              entity.w * w,
              entity.h * h
            )

            const header = `${name} ${entity.conf.toFixed(2)} ${(currentTime - entity.time).toFixed(2)}`
            const headerSize = ctx.measureText(header)
            const headerHeight = headerSize.fontBoundingBoxAscent + headerSize.fontBoundingBoxDescent + 4
            ctx.fillRect(x + entity.x * w - 1, y + entity.y * h - headerHeight, headerSize.width + 4, headerHeight)
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
            ctx.fillText(header, x + entity.x * w, y + entity.y * h - 4)
          }
        }
      }}
    />
  )


  return (
    <Flex direction='column'>
      <Box height='40rem' position='relative'>
        <YouTube
          className='youtubeEmbed'
          videoId={props.videoId}
          onReady={async (event) => {
            setDuration(await event.target.getDuration())
            setPlayer(event.target)
          }}
          opts={{
            playerVars: {
              start: 1325
            }
          }}
        />
        <VideoOverlay />
      </Box>
      <VideoTimeline
        player={player}
        currentTime={currentTime}
        detections={detections}
        duration={duration}
      />
    </Flex>
  )
}