import { Badge, BadgeProps, Box, Button, Checkbox, Code, ContextMenu, Dialog, Flex, Grid, Heading, Progress, Select, Spinner, Table, Text, TextField, Tooltip } from "@radix-ui/themes"
import Link from "../components/Link"
import { Job, Model, Video, api } from "../libs/api"
import { useCallback, useEffect, useMemo, useState } from "react"
import ErrorCallout from "../components/ErrorCallouts"
import { useLocation, useNavigate } from "react-router-dom"
import { DownloadIcon, ExternalLinkIcon, FileTextIcon } from "@radix-ui/react-icons"
import { invokeDownload } from "../libs/utils"

// https://stackoverflow.com/a/6904504
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i

const JobTableRow = (props: { data: Job, models: Record<number, Model>, video?: Video }) => {
  const navigate = useNavigate()
  const { data, models, video } = props

  const percentage: number = data.progress ? (data.progress.currentFrame / data.progress.totalFrames * 100) : 0
  const eta: number | null = data.progress ? (data.progress.totalFrames - data.progress.currentFrame) * data.progress.rate.average : null

  const colorMapping: Record<Job['status'], BadgeProps['color']> = {
    active: 'blue',
    cancelled: 'gray',
    failed: 'red',
    finished: 'green',
    waiting: 'gray',
    importing: 'amber'
  }

  const model: Model | undefined = models[data.modelId]

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Table.Row>
          <Table.Cell maxWidth='20rem'>
            <Link to={data.videoUrl}>{video ? video.videoTitle : data.videoUrl}</Link>
          </Table.Cell>
          <Table.Cell maxWidth='20rem'><Code>{model?.modelName || model?.modelPath || data.modelId}</Code></Table.Cell>
          <Table.Cell>
            <Tooltip content={(
              <>
                <span>Current rate: {(1.0 / data.progress?.rate.last!).toFixed(2)} FPS</span><br />
                <span>Average rate: {(1.0 / data.progress?.rate.average!).toFixed(2)} FPS</span><br />

                <span>Started: {data.start ? new Date(data.start).toLocaleString() : 'not yet'}</span><br />
                <span>Ended: {data.end ? new Date(data.end).toLocaleString() : 'not yet'}</span><br />

                <span>Duration: {data.end ? new Date(data.end - data.start!).toISOString().substring(11, 19) : 'not yet'}</span><br />
              </>
            )} hidden={!data.progress}>
              <Badge color={colorMapping[data.status]}>{data.status}</Badge>
            </Tooltip>
          </Table.Cell>
          <Table.Cell>
            <Flex align='center' gapX='4'>
              <Box width='7rem'>
                <Progress color={colorMapping[data.status]} value={percentage} />
              </Box>
              {percentage.toFixed(1)}%
            </Flex>
          </Table.Cell>
          <Table.Cell>
            {
              (eta == null) ?
                'No ETA' :
                (
                  <Tooltip content={(
                    <span>
                      in {eta.toFixed(1)} seconds {data.progress ? `(${(1.0 / data.progress.rate.average).toFixed(2)} FPS)` : ''}<br />
                      {new Date(Date.now() + eta * 1000).toLocaleString()}<br />
                    </span>
                  )} hidden={data.status !== 'active'}>
                    <Text>{new Date(eta * 1000).toISOString().substring(11, 19)}</Text>
                  </Tooltip>
                )
            }
          </Table.Cell>
        </Table.Row>
      </ContextMenu.Trigger >
      <ContextMenu.Content>
        <ContextMenu.Item disabled>Job ID: #{data.id}</ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item
          disabled={data.status !== 'finished'}
          onSelect={() => navigate('/debug', { state: { modelId: data.modelId, youtubeId: data.videoUrl.match(YOUTUBE_REGEX)?.[1] || null } })}
          shortcut={<ExternalLinkIcon /> as unknown as string}
        >
          Open in debug
        </ContextMenu.Item>
        <ContextMenu.Item
          onSelect={() => window.open(`/api/jobs/${data.id}/logs`, '_blank')}
          shortcut={<FileTextIcon /> as unknown as string}
        >
          Show logs
        </ContextMenu.Item>
        <ContextMenu.Item
          disabled={!data.exportable}
          onSelect={() => invokeDownload(`/api/jobs/${data.id}/export`, `${data.videoUrl}_${data.modelId}.csv`)}
          shortcut={<DownloadIcon /> as unknown as string}
        >
          Export CSV
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root >
  )
}

const NewJobDialog = (props: { initialState?: { existing: boolean, youtubeId: string } | null, onCreation: () => void }) => {
  const { initialState, onCreation } = props

  const [open, setOpen] = useState(!!initialState || false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<any>()
  const [models, setModels] = useState<Model[]>()
  const [existing, setExisting] = useState(initialState?.existing || false)
  const [videoList, setVideoList] = useState<Video[]>()

  const [url, setUrl] = useState(initialState ? `https://youtube.com/watch?v=${initialState.youtubeId}` : '')
  const youtubeId = useMemo(() => {
    return url.match(YOUTUBE_REGEX)?.[1] || null
  }, [url])

  const [modelId, setModelId] = useState<number | null>(null)

  useEffect(() => {
    api.models.getAll()
      .then(setModels)
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (videoList && !videoList.find(x => x.youtubeId == youtubeId))
      setUrl('')

    if (!existing) return

    api.videos.getAll().then(setVideoList).catch(err => {
      console.error(err)
      setError(err)
    })
  }, [existing])

  const enqueueJob = () => {
    if (!youtubeId || modelId == null)
      return

    setBusy(true)
    api.jobs.new(youtubeId, modelId)
      .then(_job => {
        onCreation()
        setOpen(false)
      })
      .catch(err => {
        console.error(err)
        setError(err)
      })
      .finally(() => setBusy(false))
  }

  return (
    <Dialog.Root onOpenChange={state => {
      setOpen(state)
      setUrl('')
      setModelId(null)
      setError(undefined)
    }} open={open}>
      <Dialog.Trigger>
        <Button>Add</Button>
      </Dialog.Trigger>
      <Dialog.Content onInteractOutside={e => e.preventDefault()}>
        <Dialog.Title>Enqueue a video</Dialog.Title>
        <Dialog.Description>Supported videos are currently <i>YouTube</i> links.</Dialog.Description>

        <Flex direction='column' gapY='3' py='6'>
          <Grid columns='max-content minmax(0, 1fr)' gapX='4' gapY='2' align='center' width='100%'>
            <Text as='label' htmlFor='reanalvid'>Use existing video</Text>
            <Flex>
              <Checkbox id='reanalvid' checked={existing} onCheckedChange={state => setExisting(!!state)} />
            </Flex>

            <Text>YouTube URL</Text>
            {
              existing ? (
                <Select.Root value={url} onValueChange={setUrl}>
                  <Select.Trigger disabled={!videoList} placeholder={!videoList ? 'NOW LOADING!!!' : 'pick a video uwu'} />
                  <Select.Content>
                    {
                      videoList?.map(video => (
                        <Select.Item
                          key={video.youtubeId}
                          value={`https://youtube.com/watch?v=${video.youtubeId}`}
                        >
                          {video.videoTitle || video.youtubeId}
                        </Select.Item>
                      ))
                    }
                  </Select.Content>
                </Select.Root>
              ) : (
                <TextField.Root
                  value={url} onChange={e => setUrl(e.target.value)}
                  placeholder='https://youtube.com/watch?v=INAAAAAA'
                />
              )
            }

            <Text>Model</Text>
            <Select.Root value={modelId?.toString()} onValueChange={id => setModelId(+id)}>
              <Select.Trigger placeholder={models ? 'select a model uwu' : 'NOW LOADING!!!'} />
              <Select.Content>
                {
                  models?.filter(model => model.modelAvailable)
                    .map(model => (
                      <Select.Item
                        key={model.modelId}
                        value={model.modelId.toString()}
                      >
                        {model.modelName || model.modelPath}
                      </Select.Item>
                    ))
                }
              </Select.Content>
            </Select.Root>
          </Grid>

          <ErrorCallout error={error} />
        </Flex>

        <Flex gap='3' justify='end'>
          <Button onClick={enqueueJob} disabled={busy || !youtubeId || modelId == null}>{busy ? <Spinner /> : 'Enqueue'}</Button>
          <Dialog.Close>
            <Button disabled={busy} variant='outline'>Close</Button>
          </Dialog.Close>
        </Flex>


      </Dialog.Content>
    </Dialog.Root>
  )
}

const RequestPage = () => {
  const location = useLocation()
  const state = location.state as { existing: boolean, youtubeId: string }

  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [models, setModels] = useState<Record<number, Model>>({})
  const [error, setError] = useState<any>()
  const [videos, setVideos] = useState<Video[]>([])

  const fetchJobList = useCallback(() => {
    return api.jobs.getAll()
      .then(jobs => {
        setError(null)
        setJobs(jobs)
        if (!models || jobs.findIndex(x => !models[x.modelId]) != -1)
          fetchModelList()
      })
      .catch(error => {
        console.error(error)
        setError(error)
      })
  }, [models])

  function fetchModelList() {
    api.models.getAll()
      .then(models => {
        setModels(Object.values(models).reduce((acc, val) => {
          acc[val.modelId] = val
          return acc
        }, {} as Record<number, Model>))
      })
      .catch(console.error)
  }

  const killActiveJob = useCallback(() => {
    if (!jobs) return
    const job = jobs.find(job => job.status === 'active')

    if (!job) return
    api.jobs.stop(job.id)
      .then(() => fetchJobList())
      .catch(err => {
        console.error(err)
        setError(err)
      })
  }, [jobs])

  useEffect(() => {
    api.videos.getAll()
      .then(setVideos)
      .catch(console.error)

    fetchJobList()

    let fetched = true
    const interval = setInterval(() => {
      if (!fetched) return
      fetched = false
      fetchJobList().finally(() => { fetched = true })
    }, 1000)
    return () => clearInterval(interval)
  }, [models])

  return (
    <Flex direction='column' gapY='4'>
      <Flex justify='between'>
        <Heading>Requests</Heading>

        <Flex gapX='2'>
          <Button color='red' onClick={killActiveJob} disabled={!jobs || !jobs.find(job => job.status === 'active')}>Kill</Button>
          <NewJobDialog onCreation={fetchJobList} initialState={state} />
        </Flex>
      </Flex>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Video URL</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Model</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Progress</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>ETA</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {
            jobs ?
              jobs.map(job => <JobTableRow video={videos.find(x => job.videoUrl.includes(x.youtubeId))} key={job.id} data={job} models={models} />) :
              error ? null :
                <Table.Row><Table.Cell><Spinner /></Table.Cell></Table.Row>
          }
        </Table.Body>
      </Table.Root>

      <ErrorCallout error={error} />
    </Flex>
  )
}
export default RequestPage