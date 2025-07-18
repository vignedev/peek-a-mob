import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import YouTube, { YouTubePlayer } from 'react-youtube'
import { Canvas, CanvasDrawingFunction } from './Canvas'
import { Box, Flex, Spinner } from '@radix-ui/themes'
import { EntityDetection, Video, api, groupDetections } from '../libs/api'
import { formatDuration, lowerBound, wait, RandomColorFromString, sliceDetections } from '../libs/utils'
import { expandContext } from '../libs/canvasEx'

type TimeInfo = [currentTime: number, duration: number]
type ValidRange = [start: number, end: number]



export const VideoTimeline = (props: { player?: YouTubePlayer, videoInfo: Video, timeInfo: TimeInfo, detections: EntityDetection, style?: React.CSSProperties }) => {
  const { player, detections, timeInfo, videoInfo } = props
  const [currentTime, duration] = timeInfo

  const detectionGroups = useMemo(() => {
    if (!detections) return null
    return groupDetections(detections, 5, 1 / videoInfo.frameRate)
  }, [detections, videoInfo])

  let [cachedTimeline, setCachedTimeline] = useState<HTMLCanvasElement>()
  const cacheTimeline = useCallback(async (width: number, height: number) => {
    console.log('(redrawing cacheTimeline)', width, height, detections, player)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = expandContext(canvas.getContext('2d')!)

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
    let lineHeight = Math.floor(ctx.canvas.height / Object.keys(detections).length)

    if (!detectionGroups) return
    Object.entries(detectionGroups).forEach(([entName, groups], idx) => {
      // borders
      if (idx != 0)
        ctx.drawLine(
          0, lineHeight * idx,
          ctx.canvas.width, lineHeight * idx,
          1, '#fffa'
        )

      // groupings
      ctx.fillStyle = RandomColorFromString(entName, 0.7)
      for (const [start, end] of groups) {
        ctx.fillRect(
          Math.round(start / duration * ctx.canvas.width),
          lineHeight * idx,
          Math.round(Math.max((end - start) / duration * ctx.canvas.width, 2.0)),
          lineHeight
        )
      }

      // lines
      detections[entName].forEach(detection => {
        ctx.drawLine(
          detection.time / duration * ctx.canvas.width + ctx.lineWidth / 2,
          lineHeight * idx,
          detection.time / duration * ctx.canvas.width + ctx.lineWidth / 2,
          lineHeight * (idx + 1),
          2, RandomColorFromString(entName, 0.05),
          true
        )
      })
    })
    return canvas
  }, [player, detectionGroups, timeInfo])

  useEffect(() => setCachedTimeline(undefined), [detectionGroups, duration])

  const onDraw = useCallback<CanvasDrawingFunction>(async (ctx, mouse) => {
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (!player)
      return;

    // const currentTime = await tryUntil(() => player.getCurrentTime())
    // const duration = await tryUntil(() => player.getDuration())

    if (!cachedTimeline || cachedTimeline.width != ctx.canvas.width || cachedTimeline.height != ctx.canvas.height) {
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
    ctx.font = '12px monospace'
    ctx.fillStyle = '#f092'
    ctx.fillRect(0, 0, currentTime / duration * ctx.canvas.width, ctx.canvas.height)

    ctx.drawLine(
      Math.floor(currentTime / duration * ctx.canvas.width) + 0.5, 0,
      Math.floor(currentTime / duration * ctx.canvas.width) + 0.5, ctx.canvas.height,
      6, '#0005'
    )
    ctx.drawLine(
      Math.floor(currentTime / duration * ctx.canvas.width) + 0.5, 0,
      Math.floor(currentTime / duration * ctx.canvas.width) + 0.5, ctx.canvas.height,
      1, '#f09'
    )

    // print the thingamijig timeline
    const timestamp = formatDuration(currentTime, duration)
    ctx.drawTextWithBackground(timestamp, currentTime / duration * ctx.canvas.width, ctx.canvas.height - 12, '#f09')

    // print of the timelines
    let callCount = 0
    let lineHeight = Math.floor(ctx.canvas.height / Object.keys(detections).length)
    Object.entries(detections).forEach(([entName, occurances], idx) => {
      const start = lowerBound(occurances, a => a.time < (currentTime - (2 / videoInfo.frameRate)))
      for (let i = start; i < occurances.length; ++i) {
        const detection = occurances[i]
        callCount++

        // this occurance is came too late, ignore it
        if (detection.time < currentTime)
          continue

        const diff = detection.time - currentTime
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max((1.0 - diff / 30), 0.25)})`
        ctx.fillText(`${entName}`, 8, lineHeight * idx + 16)
        ctx.fillText((diff).toFixed(2), 8, lineHeight * idx + 32)
        break
      }
      // display label even if out of time
      if (start >= occurances.length) {
        ctx.fillStyle = `rgba(255, 255, 255, 0.25)`
        ctx.fillText(`${entName}`, 8, lineHeight * idx + 16)
      }
    })

    // ctx.fillStyle = 'white'
    // ctx.fillText(`callCount = ${callCount}`, 16, 256)
    // display cursor if mouse is hovering on top
    if (mouse != null) {
      ctx.drawLine(
        mouse.x + 0.5, 0,
        mouse.x + 0.5, ctx.canvas.height,
        6, '#0005'
      )

      ctx.drawLine(
        mouse.x + 0.5, 0,
        mouse.x + 0.5, ctx.canvas.height,
        1, '#0ff',
      )

      const cursorTime = mouse.x / ctx.canvas.width * duration

      const timestamp = formatDuration(cursorTime, duration)
      ctx.drawTextWithBackground(timestamp, mouse.x, 16, '#0ff')

      const index = Math.floor(mouse.y / lineHeight)
      ctx.fillStyle = '#ffffff19'
      ctx.fillRect(0, index * lineHeight, ctx.canvas.width, lineHeight)

      const arr = Object.values(detections)[index]
      const closest = lowerBound(arr, a => a.time < cursorTime)
      const withinBounds = closest < arr.length
      ctx.drawTextWithBackground(
        withinBounds ? (
          `next: ${formatDuration(arr[closest].time - cursorTime)}`
        ) : (
          `last: -${formatDuration(cursorTime - arr[arr.length - 1].time)} ago`
        ),
        mouse.x, mouse.y + 8,
        withinBounds ? '#fff' : '#f00'
      )
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
        if (e.button != 0) return;
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

export const VideoOverlay = (props: { player?: YouTubePlayer, videoInfo: Video, rollingDetections: EntityDetection, timeInfo: TimeInfo }) => {
  const { player, rollingDetections, timeInfo, videoInfo } = props
  const [currentTime, _duration] = timeInfo

  const onDraw = useCallback<CanvasDrawingFunction>(async (ctx, _mouse) => {
    if (!player) return
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // ctx.fillStyle = 'red'
    // ctx.fillText(`${currentTime}`, 16, 16)
    // ctx.fillText(`rds: ${Object.keys(rollingDetections).join(', ')}`, 16, 32)

    const aspect = ctx.canvas.width / ctx.canvas.height;
    const videoAr = videoInfo.aspectRatio || (16 / 9)
    let x, y, w, h;

    if (aspect > videoAr) { // wider 
      y = 0; h = ctx.canvas.height;
      w = ctx.canvas.width / aspect * videoAr;
      x = (ctx.canvas.width - w) / 2;
    } else if (aspect < videoAr) { // taller
      x = 0; w = ctx.canvas.width;
      h = ctx.canvas.height / videoAr * aspect;
      y = (ctx.canvas.height - h) / 2;
    } else { // == is correct aspect ratio
      x = y = 0;
      w = ctx.canvas.width;
      h = ctx.canvas.height;
    }

    const frameThreshold = 1.0 / (videoInfo.frameRate)
    let callCount = 0;
    for (const name in rollingDetections) {
      const lb_idx = lowerBound(rollingDetections[name], (a => a.time < currentTime - frameThreshold * 4.0))
      for (let i = lb_idx; i < rollingDetections[name].length; ++i) {
        callCount++;

        const entity = rollingDetections[name][i]
        const [bx, by, bw, bh] = entity.bbox

        const dist = Math.abs(entity.time - currentTime)

        if (dist <= frameThreshold) {
          ctx.drawBoundingBox(
            x + bx * w,
            y + by * h,
            bw * w,
            bh * h,
            `${name} ${(entity.confidence * 100.0).toFixed(2)}%`,
            RandomColorFromString(name, 1.0)
          )
        }

        if ((entity.time - currentTime) > (frameThreshold * 2))
          break;
      }
    }

    // ctx.fillStyle = 'black'
    // ctx.fillRect(0, 128, 200, 16)
    // ctx.fillStyle = 'white'
    // ctx.fillText(`callCount = ${callCount}`, 2, 128 + 14)
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

export const YouTubeWithTimeline = (props: { videoInfo: Video, modelId: number, entities?: string[], fullScreenWidth?: boolean }) => {
  const { videoInfo, modelId, entities, fullScreenWidth } = props

  const [player, setPlayer] = useState<YouTubePlayer>()
  const [detections, setDetections] = useState<EntityDetection | null>(null)
  const [rollingDetections, setRollingDetections] = useState<{ detections: EntityDetection, range: ValidRange }>()
  const [timeInfo, setTimeInfo] = useState<TimeInfo>([0, 0])

  // loop - time retaining, keeps timeInfo
  useEffect(() => {
    let condition = true
    const loop = async () => {
      while (condition) {
        if (player) setTimeInfo([await player.getCurrentTime(), await player.getDuration()])
        await wait(1000 / (videoInfo.frameRate * 2.0)) // shannon theorem be <respected>
      }
    }
    loop()
    return () => { condition = false }
  }, [player])

  // update the detections array on new video ID update
  useEffect(() => {
    setDetections(null)
    setTimeInfo([0, 0])
    setRollingDetections(undefined)

    if (videoInfo)
      api.videos.getDetections(videoInfo.youtubeId, modelId, { entities })
        .then(setDetections)
  }, [videoInfo, modelId])

  // loop - for rolling detections
  useEffect(() => {
    if (!player) return;

    let condition = true
    const loop = async () => {
      while (condition) {
        const newTime = await player!.getCurrentTime()
        if (detections && (!rollingDetections || newTime <= rollingDetections.range[0] || newTime >= rollingDetections.range[1])) {
          setRollingDetections({
            detections: sliceDetections(detections, newTime - 10, newTime + 10),
            range: [newTime - 7, newTime + 7] // the "valid range" where this cached are is for
          })
        }
        await wait(1000) // shannon theorem is ignored here tbh wwwwwwwwww
      }
    }
    loop()
    return () => { condition = false }
  }, [player, videoInfo, rollingDetections, modelId, detections])

  // silly fullscreen using F
  const refPlayerCombo = useRef<HTMLDivElement>(null)
  const refPlayer = useRef<YouTube>(null)
  useEffect(() => {
    if (!refPlayerCombo.current) return

    // https://github.com/radix-ui/themes/blob/2dfb565cf077a1f78a7f9f824a4afe1e2f25c5b5/packages/radix-ui-themes/src/components/theme-panel.tsx#L123C5-L131C7
    const keyboardInputElement = `
      [contenteditable],
      [role="combobox"],
      [role="listbox"],
      [role="menu"],
      input:not([type="radio"], [type="checkbox"]),
      select,
      textarea
    `
    const onkeydown = (e: KeyboardEvent) => {
      if (document.activeElement?.closest(keyboardInputElement) || !refPlayer.current?.internalPlayer)
        return

      switch (e.code) {
        // fullscreen
        case 'KeyF': {
          if (document.fullscreenElement) document.exitFullscreen()
          else refPlayerCombo.current?.requestFullscreen()
        } break

        case 'Space':
        case 'KeyK': {
          if (!player) break
          player.getPlayerState().then(state => {
            if ([YouTube.PlayerState.PAUSED, YouTube.PlayerState.UNSTARTED, YouTube.PlayerState.CUED].includes(state))
              return player.playVideo()
            else if (state == YouTube.PlayerState.PLAYING)
              return player.pauseVideo()
          }).catch(console.error)
        } break

        // seek -10
        case 'KeyJ': {
          if (!player) break
          player.getCurrentTime().then(time => {
            return player.seekTo(Math.max(time - 10, 0), true)
          }).catch(console.error)
        } break

        // seek +10
        case 'KeyL': {
          if (!player) break
          player.getCurrentTime().then(time => {
            return player.seekTo(time + 10, true)
          }).catch(console.error)
        } break

        // seek -5
        case 'ArrowLeft': {
          if (!player) break
          player.getCurrentTime().then(time => {
            return player.seekTo(Math.max(time - 5, 0), true)
          }).catch(console.error)
        } break

        // seek +5
        case 'ArrowRight': {
          if (!player) break
          player.getCurrentTime().then(time => {
            return player.seekTo(time + 5, true)
          }).catch(console.error)
        } break

        // frame back
        case 'Comma': {
          if (!player || !videoInfo) break
          player.getCurrentTime().then(time => {
            return player.seekTo(time - 1.0 / videoInfo.frameRate, true)
          }).catch(console.error)
        } break

        // frame forward
        case 'Period': {
          if (!player || !videoInfo) break
          player.getCurrentTime().then(time => {
            return player.seekTo(time - 1.0 / videoInfo.frameRate, true)
          }).catch(console.error)
        } break
      }
    }

    document.addEventListener('keydown', onkeydown)
    return () => document.removeEventListener('keydown', onkeydown)
  }, [refPlayerCombo, refPlayer, videoInfo])

  return (
    <Flex direction='column' gap='1' ref={refPlayerCombo} className='youtubeWithTimeline'>
      <Box
        className='playerCombo'
        style={{
          position: fullScreenWidth ? 'relative' : 'sticky',
          top: 0,
          borderRadius: 'max(var(--radius-2), var(--radius-full))',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-2)',
          aspectRatio: videoInfo.aspectRatio,
          zIndex: 2,
        }}
      >
        <YouTube
          className='youtubeEmbed'
          videoId={videoInfo.youtubeId}
          onReady={async (event) => {
            setPlayer(event.target)
          }}
          opts={{
            playerVars: {
              fs: 0
            }
          }}
          ref={refPlayer}
        />
        <VideoOverlay
          player={player}
          videoInfo={videoInfo}
          timeInfo={timeInfo}
          rollingDetections={rollingDetections?.detections || {}}
        />
      </Box>

      {
        (detections) ? (
          <Box height={`${Object.keys(detections).length * 3}rem`} overflow='hidden' className='playerTimeline'>
            <VideoTimeline
              player={player}
              videoInfo={videoInfo}
              timeInfo={timeInfo}
              detections={detections}
              style={{
                borderRadius: 'max(var(--radius-2), var(--radius-full))',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-2)',
                width: fullScreenWidth ? 'calc(100% - 2rem)' : '100%',
                height: `${Object.keys(detections).length * 3}rem`,
                position: fullScreenWidth ? 'absolute' : 'relative',
                left: fullScreenWidth ? '1rem' : 0,
              }}
            />
          </Box>
        ) : (
          <Flex
            justify='center'
            align='center'
            p='4'
            overflow='hidden'
            style={{
              background: 'black',
              borderRadius: 'max(var(--radius-2), var(--radius-full))',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-2)',
            }}
          >
            <Spinner size='3' />
          </Flex>
        )
      }
    </Flex>
  )
}
