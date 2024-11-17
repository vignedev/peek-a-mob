import { Blockquote, Container, Flex, Heading, Select } from "@radix-ui/themes"
import { YouTubeWithTimeline } from "./components/YouTube"
import { useEffect, useState } from "react"
import { getVideos, Video } from "./libs/api"

function App() {
  const [videoId, setVideoId] = useState<string>()
  const [videoOptions, setVideoOptions] = useState<Video[]>()

  useEffect(() => {
    getVideos().then(options => {
      setVideoOptions(options)
    }).catch(console.error)
  }, [])

  return (
    <>
      <Container p='4'>
        <Flex direction='column' gap='4'>
          <Heading>peek-a-mob</Heading>
          <Blockquote>ey waddup son what dat mob doin</Blockquote>

          <Select.Root value={videoId} onValueChange={setVideoId}>
            <Select.Trigger placeholder={videoOptions ? 'Select a video! |o wo)b' : 'NOW LOADING'} />
            <Select.Content>
              {
                videoOptions ? (
                  videoOptions.map(video => <Select.Item key={video.videoId} value={video.youtubeId}>{video.videoTitle || video.youtubeId}</Select.Item>)
                ) : null
              }
            </Select.Content>
          </Select.Root>

          {videoId ? <YouTubeWithTimeline videoId={videoId} /> : <div>{' uwo)b'}</div>}
        </Flex>
      </Container>
    </>
  )
}

export default App
