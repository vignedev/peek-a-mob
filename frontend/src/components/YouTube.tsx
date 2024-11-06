import { useEffect, useState } from 'react'
import YouTube, { YouTubePlayer } from 'react-youtube'
import { Canvas } from './Canvas'
import { Box, Flex } from '@radix-ui/themes'
import { getDetections } from '../libs/api'

type PlayerProps = {
  videoId: string
}

export const YouTubeWithTimeline = (props: PlayerProps) => {
  const [player, setPlayer] = useState<YouTubePlayer>()
  const [duration, setDuration] = useState<number>(-1)
  const [currentTime, setCurrentTime] = useState<number>(-1)

  useEffect(() => {
    if (!player) return;
    const interval = setInterval(async () => {
      setCurrentTime(await player.getCurrentTime())
    }, 500)
    return () => clearInterval(interval)
  }, [player])

  // TODO: make the fetcher work "as needed"
  const detections = getDetections(props.videoId, currentTime)

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

        for (const name in detections) {
          for (const entity of detections[name]) {
            ctx.strokeStyle = 'red'
            ctx.strokeRect(
              x + entity.x * w,
              y + entity.y * h,
              entity.w * w,
              entity.h * h
            )

            const header = `${name} ${entity.conf.toFixed(2)}`
            const headerSize = ctx.measureText(header)
            const headerHeight = headerSize.fontBoundingBoxAscent + headerSize.fontBoundingBoxDescent + 4
            ctx.fillStyle = 'red'
            ctx.fillRect(x + entity.x * w - 1, y + entity.y * h - headerHeight, headerSize.width + 4, headerHeight)
            ctx.fillStyle = 'white'
            ctx.fillText(header, x + entity.x * w, y + entity.y * h - 4)
          }
        }
      }}
    />
  )

  const VideoTimeline = () => (
    <Canvas style={{
      height: '5rem'
    }} onDraw={async (ctx, mouse) => {
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.fillStyle = 'white'
      ctx.fillText(`${ctx.canvas.width} x ${ctx.canvas.height} | ${new Date().toLocaleString()}`, 16, 16)

      if (!player) return;

      ctx.fillText(`${currentTime.toFixed(2)}/${duration} | x=${mouse.x} | y=${mouse.y}`, 16, 32)

      ctx.fillStyle = '#f005'
      ctx.fillRect(0, 0, currentTime / duration * ctx.canvas.width, ctx.canvas.height)

      ctx.strokeStyle = '#0ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(mouse.x, 0)
      ctx.lineTo(mouse.x, ctx.canvas.height)
      ctx.stroke()

    }} onMouseDown={(e, ctx) => {
      if (!player) return;
      player.seekTo(duration * e.offsetX / ctx.canvas.width, true)
    }} />
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
        />
        <VideoOverlay />
      </Box>
      <VideoTimeline />
    </Flex>
  )
}