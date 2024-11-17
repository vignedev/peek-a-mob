import { Blockquote, Container, Em, Flex, Grid, Heading, Select, Text } from "@radix-ui/themes"
import { YouTubeWithTimeline } from "./components/YouTube"
import { useEffect, useState } from "react"
import { DetailedVideo, getVideo, getVideos, Video } from "./libs/api"

function App() {
  const [videoId, setVideoId] = useState<string>()
  const [modelName, setModelName] = useState<string>()

  const [videoOptions, setVideoOptions] = useState<Video[]>()
  const [videoInfo, setVideoInfo] = useState<DetailedVideo>()

  useEffect(() => {
    getVideos()
      .then(setVideoOptions)
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!videoId) return;
    getVideo(videoId)
      .then(info => {
        setVideoInfo(info)
        setModelName(info.models[0])
      })
      .catch(console.error)
  }, [videoId])

  return (
    <>
      <Container p='4' mt='8'>
        <Flex direction='column' gap='4'>
          <Heading>peek-a-mob</Heading>
          <Blockquote size='4'>
            <Em>"Everything is either a chicken or a cow, there is no in between."</Em><br />
            <Text align='right'><i>— vignedev's theorem</i></Text>
          </Blockquote>

          <Grid columns='max-content 1fr' gap='1' gapX='3' justify='end' align='center'>
            <Text align='right' ml='4' color='gray'>uwu select a video:</Text>
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

            <Text align='right' ml='4' color='gray'>owo which model:</Text>
            <Select.Root value={modelName} onValueChange={setModelName}>
              <Select.Trigger
                placeholder={videoInfo ? 'Select a model as well | uwu)7' : (!videoId ? 'tsk tsk' : 'NOW LOADING')}
                disabled={!videoInfo}
              />
              <Select.Content>
                {
                  videoInfo ? (
                    videoInfo.models.map(model => <Select.Item key={model} value={model}>{model}</Select.Item>)
                  ) : null
                }
              </Select.Content>
            </Select.Root>
          </Grid>

          {(videoId && modelName) ? <YouTubeWithTimeline videoId={videoId} modelName={modelName} /> : null}
        </Flex>
      </Container>
    </>
  )
}

export default App
