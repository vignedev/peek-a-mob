import { useEffect, useState } from 'react'
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube'
import { Canvas } from './Canvas'
import { Flex } from '@radix-ui/themes'

type PlayerProps = {
  videoId: string
}

type TimelineProps = {

}

const Timeline = (props: TimelineProps) => {

}


export const YouTubeWithTimeline = (props: PlayerProps) => {
  const [player, setPlayer] = useState<YouTubePlayer>()
  const [duration, setDuration] = useState<number>(-1)

  return (
    <Flex direction='column'>
      <YouTube
        videoId={props.videoId}
        onReady={async (event) => {
          setDuration(await event.target.getDuration())
          setPlayer(event.target)
        }}
      />
      <Canvas style={{
        height: '5rem'
      }} onDraw={async (ctx, mouse) => {
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.fillStyle = 'white'
        ctx.fillText(`${ctx.canvas.width} x ${ctx.canvas.height} | ${new Date().toLocaleString()}`, 16, 16)

        if (!player) return;
        const currentTime = await player.getCurrentTime()

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
    </Flex>
  )
}