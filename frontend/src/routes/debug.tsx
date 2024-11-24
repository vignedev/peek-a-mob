import { Box, Flex, Grid, Select, Text } from "@radix-ui/themes"
import { YouTubeWithTimeline } from "../components/YouTube"
import { useEffect, useState } from "react"
import { DetailedVideo, Video, api } from "../libs/api"
import meow from '../assets/plink-cat.gif'
import { useLocation } from "react-router-dom"
import ErrorCallout from "../components/ErrorCallouts"

function DebugPage() {
  const location = useLocation()
  const state = location.state as { modelId?: number, youtubeId?: string }

  const [modelId, setModelId] = useState<number | null>(state?.modelId == undefined ? null : state.modelId)
  const [youtubeId, setYoutubeId] = useState<string | undefined>(state?.youtubeId)
  const [videoOptions, setVideoOptions] = useState<Video[]>()
  const [videoInfo, setVideoInfo] = useState<DetailedVideo>()
  const [error, setError] = useState()

  useEffect(() => {
    api.videos.getAll()
      .then(setVideoOptions)
      .catch(err => {
        console.error(err)
        setError(err)
      })
  }, [])

  useEffect(() => {
    if (!youtubeId) return;
    api.videos.get(youtubeId)
      .then(info => {
        setVideoInfo(info)
        setModelId(info.models[0].modelId)
      })
      .catch(err => {
        console.error(err)
        setError(err)
      })
  }, [youtubeId])

  return (
    <Flex direction='column' gap='4'>
      <Grid columns='max-content minmax(0, 1fr)' gap='1' gapX='3' justify='end' align='center'>
        <Text color='gray'>uwu select a video:</Text>
        <Select.Root value={youtubeId} onValueChange={setYoutubeId}>
          <Select.Trigger placeholder={videoOptions ? 'Select a video! |o wo)b' : 'NOW LOADING'} />
          <Select.Content>
            {
              videoOptions ? (
                videoOptions.map(video =>
                  <Select.Item
                    key={video.youtubeId}
                    value={video.youtubeId}
                  >
                    {video.videoTitle || video.youtubeId}
                  </Select.Item>)
              ) : null
            }
          </Select.Content>
        </Select.Root>

        <Text color='gray'>owo which model:</Text>
        <Select.Root value={(modelId || '').toString()} onValueChange={value => setModelId(+value)}>
          <Select.Trigger
            placeholder={videoInfo ? 'Select a model as well | uwu)7' : (!youtubeId ? 'tsk tsk' : 'NOW LOADING')}
            disabled={!videoInfo}
          />
          <Select.Content>
            {
              videoInfo ? (
                videoInfo.models.map(model => (
                  <Select.Item
                    key={model.modelId}
                    value={model.modelId.toString()}>
                    {model.modelName || model.modelPath}
                  </Select.Item>
                ))
              ) : null
            }
          </Select.Content>
        </Select.Root>
      </Grid>

      <ErrorCallout error={error} />

      {
        (videoInfo && modelId != null && typeof modelId !== 'undefined') ?
          <YouTubeWithTimeline videoInfo={videoInfo} modelId={modelId} /> :
          <Box style={{
            aspectRatio: '16 / 9',
            boxShadow: 'var(--shadow-3)',
            borderRadius: 'max(var(--radius-2), var(--radius-full))',
            background: 'rgba(0, 0, 0, 0.9)',
            userSelect: 'none',
            fontStyle: 'italic',
            backgroundImage: `url(${meow})`,
            backgroundSize: '100% 100%',
            backgroundBlendMode: 'darken'
          }}>
            <Flex justify='center' align='center' height='100%'>
              <Text style={{ opacity: 0.2 }} size='8'>
                pick a video nya~
              </Text>
            </Flex>
          </Box>
      }
    </Flex>
  )
}

export default DebugPage
