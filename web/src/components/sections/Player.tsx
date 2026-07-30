import { useMemo, useRef, useState } from 'react'
import { Section } from '../Section'
import { Video, type VideoInfoRetrieval } from '../Video'
import { useDetections } from '../../utils/binreader'
import { YouTube } from '../YouTube'
import { Overlay } from '../Overlay'
import { VideoSelect } from '../VideoSelect'
import { Timeline } from '../Timeline'

export const PlayerSection = () => {
  const [currentVideo, setCurrentVideo] = useState<string>()
  const videoInfoRef = useRef<VideoInfoRetrieval>(null)
  const [type, src] = useMemo(() => currentVideo?.split(':') ?? [], [currentVideo])
  const { detections, state, classes } = useDetections(src ? `/detections/${src}.bin` : undefined)

  return <Section className='p-0 overflow-hidden'>
    <div className='flex flex-col [&>*:not(:nth-child(1))]:border-t-2 [&>*:not(:nth-child(1))]:border-violet-200 dark:[&>*:not(:nth-child(1))]:border-slate-700'>
      <div className='relative aspect-video size-full'>
        {
          src ? (
            type === 'local' ?
              (<Video src={src} ref={videoInfoRef} controls className='aspect-video' />) :
              (<YouTube videoId={src} ref={videoInfoRef} className='size-full *:size-full *:outline-0' />)
          ) : <div className='bg-black size-full aspect-video flex justify-center items-center'>
            ey select the video below mate
          </div>
        }

        <div className='size-full absolute inset-0 pointer-events-none'>
          <Overlay className='size-full' videoInfo={videoInfoRef} detections={detections} />
        </div>
      </div>

      <VideoSelect className='border-b-0' currentVideo={currentVideo} setCurrentVideo={setCurrentVideo} />

      {
        src && (
          <div className='relative'>
            <Timeline className='size-full' videoInfo={videoInfoRef} detections={detections} classes={classes} />

            {
              (state === 'loading' || state === 'error') ? (
                <div className='font-extrabold text-2xl italic size-full absolute inset-0 text-white/40 flex justify-center items-center bg-black/60'>
                  {
                    state === 'loading' ?
                      <span >NOW LOADING!!!</span> :
                      <span className='text-red-600/90'>oh nyo, error occured</span>
                  }
                </div>
              ) : null
            }
          </div>
        )
      }

    </div>
  </Section>
}