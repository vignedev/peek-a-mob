import { useEffect, useRef, useState } from 'react'
import './App.css'
import screenshot from './assets/img/screenshot.avif'
import { Section } from './components/Section'
import { Select } from './components/Select'
import { Heading } from './components/Heading'
import { Canvas } from './components/Canvas'
import { Timeline } from './components/Timeline'
import { Video, type VideoInfoRetrieval } from './components/Video'
import { YouTube } from './components/YouTube'

type TProps = {

}
const App = (props: TProps) => {
  const [currentVideo, setCurrentVideo] = useState<string | null>(null)
  const videoInfoRef = useRef<VideoInfoRetrieval>(null)

  const [type, src] = currentVideo?.split(':') ?? []

  return (
    <div className='w-full flex justify-center p-2 py-8'>
      <div className='w-full flex gap-4 flex-col max-w-240'>
        <Section>
          <Heading size='1'>peek-a-mob</Heading>
          <span className='text-sm italic'>yeah we suck at naming things</span>
        </Section>

        <Section className='p-0 overflow-hidden'>
          <div className='flex flex-col [&>*:nth-child(2)]:border-y-2 [&>*:nth-child(2)]:border-violet-200 dark:[&>*:nth-child(2)]:border-slate-700'>
            {
              src ? (
                type === 'local' ?
                  (<Video src={src} ref={videoInfoRef} controls className='aspect-video' />) :
                  (<YouTube videoId={src} ref={videoInfoRef} />)
              ) : <div className='bg-black size-full aspect-video flex justify-center items-center'>
                nyaa
              </div>
            }

            <Select
              className='h-10'
              placeholder='select a video'
              value={currentVideo}
              onValueChange={(val) => setCurrentVideo(val)}
              items={[
                {
                  value: 'yt:J9-bakUEJyo',
                  title: 'Daydreaming in Darkness - Chrono Gear: Warden of Time (OST) | BobTheGUYYYYY (ft. tryptech)'
                },
                {
                  value: 'yt:3m15lUh0WP4',
                  title: '【ORIGINAL MV】enough - Gigi Murin'
                },
                {
                  value: 'local:/assets/video/hoyohoyo.mkv',
                  title: 'hoyohoyo.mkv'
                }
              ]}
            />

            <Timeline videoInfo={videoInfoRef} />
          </div>
        </Section>

        <Section>
          <Heading size='2'>what is this</Heading>
          <section>
            <p>
              we finetuned a yolov11 model to detect minecraft mobs from videos and such, and created this web ui to render bounding boxes on top of youtube videos
            </p>
          </section>

          <Heading size='2'>dataset creation</Heading>
          <section>
            <p>
              we were time constrained students, so we needed a relatively efficient way to gather dataset, and so we created a specialized "segmentation" shader that allows extraction of mob types from a screenshot
            </p>

            <p>
              sorry to the faculty for storing 10gb of minecraft screenshots in the repository. tehe
            </p>
          </section>

          <Heading size='2'>what is stored</Heading>
          <section>
            <p>
              on our side, nothing apart from the analyzed bounding boxes in time are stored, in a big csv file. the videos you are watching below are embedded from youtube, with the bounding boxes being overlaid on top of it
            </p>
            <p>
              during analysis, the videos are also being streamed and not stored locally. this allows me to save a couple of bucks avoiding storage, especially in the big ol' 26
            </p>
          </section>

          <Heading size='2'>minimal frontend?</Heading>
          <section>
            <p>original frontend featured more features, such as enqueuing new videos to be analyzed by our model and monitoring its progress. it also received the bounding box informations on the fly, instead of getting them all upon load.</p>

            <p>this is the "minimal" version, as in it works without any additional backend, lacks the request options etc. on the flip side though, it has optimizations and improvements that i learned while making the original version</p>
          </section>
        </Section>

        <Section>
        </Section>

        <Section>
          what's sleep for 30$
        </Section>
      </div>
    </div>
  )
}

export default App
