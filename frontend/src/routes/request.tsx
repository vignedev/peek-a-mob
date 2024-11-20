import { Badge, BadgeProps, Box, Button, Code, Dialog, Flex, Grid, Heading, Progress, Select, Spinner, Table, Text, TextField, Tooltip } from "@radix-ui/themes"
import Link from "../components/Link"
import { getJobs, getModels, Job, Model, newJob } from "../libs/api"
import { useEffect, useMemo, useState } from "react"
import ErrorCallout from "../components/ErrorCallouts"

// https://stackoverflow.com/a/6904504
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i

const JobTableRow = (props: { data: Job, models: Record<number, Model> }) => {
  const { data, models } = props

  const percentage: number = data.progress ? (data.progress.currentFrame / data.progress.totalFrames * 100) : 0
  const eta: number | null = data.progress ? (data.progress.totalFrames - data.progress.currentFrame) * data.progress.rate.average : null

  const colorMapping: Record<Job['status'], BadgeProps['color']> = {
    active: 'blue',
    cancelled: 'gray',
    failed: 'red',
    finished: 'green',
    waiting: 'gray'
  }

  const model: Model | undefined = models[data.modelId]

  return (
    <Table.Row>
      <Table.Cell>
        <Link to={`/api/jobs/${data.id}/logs`} reloadDocument>#{data.id}</Link>
      </Table.Cell>
      <Table.Cell>
        <Link to={data.videoUrl}>{data.videoUrl}</Link>
      </Table.Cell>
      <Table.Cell><Code>{model?.modelName || model?.modelPath || data.modelId}</Code></Table.Cell>
      <Table.Cell><Badge color={colorMapping[data.status]}>{data.status}</Badge></Table.Cell>
      <Table.Cell>
        <Flex align='center' gapX='4'>
          <Box width='10rem'>
            <Progress color={colorMapping[data.status]} value={percentage} />
          </Box>
          {percentage.toFixed(1)}%
        </Flex>
      </Table.Cell>
      <Table.Cell>
        {data.progress ? (1.0 / data.progress.rate.average).toFixed(2) : null}
      </Table.Cell>
      <Table.Cell>
        {(eta == null) ? 'No ETA' : <Tooltip content={<span>in {eta.toFixed(1)} seconds<br />{new Date(Date.now() + eta * 1000).toLocaleString()}</span>}><Text>{new Date(eta * 1000).toISOString().substring(11, 19)}</Text></Tooltip>}
      </Table.Cell>
    </Table.Row>
  )
}

const NewJobDialog = (props: { onCreation: () => void }) => {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<any>()
  const [models, setModels] = useState<Model[]>()

  const [url, setUrl] = useState('')
  const videoId = useMemo(() => {
    return url.match(YOUTUBE_REGEX)?.[1] || null
  }, [url])

  const [modelId, setModelId] = useState<number | null>(null)

  useEffect(() => {
    getModels()
      .then(setModels)
      .catch(console.error)
  }, [])

  const uploadFile = () => {
    if (!videoId || modelId == null)
      return

    setBusy(true)
    newJob(`https://youtube.com/watch?v=${videoId}`, modelId)
      .then(_job => {
        console.log(_job)
        props.onCreation()
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
          <Grid columns='max-content 1fr' gapX='4' gapY='2' align='center'>
            <Text>YouTube URL:</Text>
            <TextField.Root
              value={url} onChange={e => setUrl(e.target.value)}
              placeholder='https://youtube.com/watch?v=INAAAAAA'
            />

            <Text>Model:</Text>
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
          <Button onClick={uploadFile} disabled={busy || !videoId || modelId == null}>{busy ? <Spinner /> : 'Enqueue'}</Button>
          <Dialog.Close>
            <Button disabled={busy} variant='outline'>Close</Button>
          </Dialog.Close>
        </Flex>


      </Dialog.Content>
    </Dialog.Root>
  )
}

const RequestPage = () => {
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [models, setModels] = useState<Record<number, Model>>({})
  const [error, setError] = useState<any>()


  function fetchJobList() {
    return getJobs()
      .then(jobs => {
        setJobs(jobs)
        if (!models || jobs.findIndex(x => !models[x.modelId]) != -1)
          fetchModelList()
      })
      .catch(error => {
        console.error(error)
        setError(error)
      })
  }

  function fetchModelList() {
    getModels()
      .then(models => {
        setModels(Object.values(models).reduce((acc, val) => {
          acc[val.modelId] = val
          return acc
        }, {} as Record<number, Model>))
      })
      .catch(console.error)
  }

  useEffect(() => {
    fetchJobList()

    let fetched = true
    const interval = setInterval(() => {
      if (!fetched) return
      fetched = false
      fetchJobList().finally(() => { fetched = true })
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <Flex direction='column' gapY='4'>
      <Flex justify='between'>
        <Heading>Requests</Heading>
        <NewJobDialog onCreation={fetchJobList} />
      </Flex>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Job ID</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Video URL</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Model</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Progress</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>FPS</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>ETA</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {
            jobs ?
              jobs.map(job => <JobTableRow key={job.id} data={job} models={models} />) :
              <Table.Row><Table.Cell><Spinner /></Table.Cell></Table.Row>
          }
        </Table.Body>
      </Table.Root>

      <ErrorCallout error={error} />
    </Flex>
  )
}
export default RequestPage