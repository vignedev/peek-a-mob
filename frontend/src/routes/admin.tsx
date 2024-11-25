import { Badge, Button, Code, Dialog, Flex, Grid, Heading, IconButton, Link, Spinner, Table, Text, TextField } from "@radix-ui/themes"
import { ReactNode, useEffect, useRef, useState } from "react"
import { DetectionRecord, Model, api } from "../libs/api"
import ErrorCallout from "../components/ErrorCallouts"
import { Pencil1Icon } from "@radix-ui/react-icons"

const UploadButtonDialog = (props: { onUpload: () => void }) => {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<any>()
  const [file, setFile] = useState<File>()

  const [name, setName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadFile = () => {
    if (!file) return

    setBusy(false)
    api.models.new(name, file)
      .then(_newModel => {
        console.log(_newModel)
        props.onUpload()
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
      setName('')
      setFile(undefined)
      setError(undefined)
    }} open={open}>
      <Dialog.Trigger>
        <Button>Add</Button>
      </Dialog.Trigger>
      <Dialog.Content onInteractOutside={e => e.preventDefault()}>
        <Dialog.Title>Upload a new model</Dialog.Title>
        <Dialog.Description>The expected file is a <Code>best.pt</Code>, limited to 10 MB.</Dialog.Description>

        <Flex direction='column' gapY='3' py='6'>
          <Grid columns='max-content 1fr' gapX='4' gapY='2' align='center'>
            <Text>Name: </Text>
            <TextField.Root value={name} onChange={e => setName(e.target.value)} disabled={busy} placeholder='Model name' />

            <Text>File: </Text>
            <input onChange={e => {
              const file = e.target.files![0]
              setFile(file)

              if (!name)
                setName(`${file.name} (${new Date(file.lastModified).toISOString()})`)
            }} ref={fileRef} disabled={busy} accept='.pt' multiple={false} type='file' />
          </Grid>

          <ErrorCallout error={error} />
        </Flex>

        <Flex gap='3' justify='end'>
          <Button onClick={uploadFile} disabled={busy || !file || name.trim().length == 0}>{busy ? <Spinner /> : 'Upload'}</Button>
          <Dialog.Close>
            <Button disabled={busy} variant='outline'>Close</Button>
          </Dialog.Close>
        </Flex>


      </Dialog.Content>
    </Dialog.Root>
  )
}

const ModelTableRow = (props: { model: Model, onUpdate: () => void }) => {
  const { model, onUpdate } = props
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const [name, setName] = useState<string>(model.modelName || '')
  const renameModel = () => {
    setBusy(true)
    api.models.rename(model.modelId, name)
      .then(_newModel => {
        onUpdate()
        setOpen(false)
      })
      .catch(err => console.error(err))
      .finally(() => setBusy(false))
  }

  return (
    <Table.Row>
      <Table.Cell>{model.modelId}</Table.Cell>
      <Table.Cell>
        <Flex align='center' gapX='2'>
          {model.modelName || <i style={{ opacity: 0.3 }}>[no name]</i>}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger>
              <IconButton variant='ghost'>
                <Pencil1Icon />
              </IconButton>
            </Dialog.Trigger>
            <Dialog.Content onInteractOutside={e => e.preventDefault()}>
              <Dialog.Title>Rename model</Dialog.Title>

              <TextField.Root
                value={name || ''} onChange={e => setName(e.target.value)}
                onKeyDown={e => {
                  if (!busy && e.code == 'Enter') {
                    renameModel()
                    e.preventDefault()
                  }
                }}
                disabled={busy}
              />

              <Flex gap='3' justify='end' pt='4'>
                <Button disabled={busy} onClick={renameModel}>{busy ? <Spinner /> : 'Rename'}</Button>
                <Dialog.Close>
                  <Button disabled={busy} variant='outline'>Close</Button>
                </Dialog.Close>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>
      </Table.Cell>
      <Table.Cell>
        <Badge color={model.modelAvailable ? 'green' : 'gray'}>
          {model.modelAvailable ? 'Available' : 'Offline'}
        </Badge>
      </Table.Cell>
    </Table.Row>
  )
}

const ModelTable = (props: { models?: Model[], onUpdate: () => void }) => {
  const { models, onUpdate } = props

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.RowHeaderCell>Model ID</Table.RowHeaderCell>
          <Table.RowHeaderCell>Model Name</Table.RowHeaderCell>
          <Table.RowHeaderCell>Available</Table.RowHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {
          models ? models.map(model => (
            <ModelTableRow
              key={model.modelId} model={model}
              onUpdate={onUpdate}
            />
          )) : <Spinner />
        }
      </Table.Body>
    </Table.Root>
  )
}

const DetectionTableRow = (props: { videoTitle: string, videoUrl: string, modelName: string, modelId: number }) => {
  const { modelName, videoTitle, videoUrl, modelId } = props

  return (
    <Table.Row>
      <Table.Cell><Link href={videoUrl}>{videoTitle}</Link></Table.Cell>
      <Table.Cell>{modelName || <i style={{ opacity: 0.3 }}>[no name (id={modelId})]</i>}</Table.Cell>
    </Table.Row>
  )
}

const DetectionsTable = (props: { models?: Model[], detections?: DetectionRecord }) => {
  const { models, detections } = props

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.RowHeaderCell>Video Title</Table.RowHeaderCell>
          <Table.RowHeaderCell>Model Name</Table.RowHeaderCell>
        </Table.Row>
      </Table.Header>
      {
        (models && detections) ? (
          Object.entries(detections).reduce((acc, [youtubeId, data]) => {
            console.log(data)
            acc.push(data.modelIds?.map(modelId =>
            (
              <DetectionTableRow
                modelName={models.find(x => x.modelId == modelId)!.modelName!}
                videoTitle={data.videoTitle}
                videoUrl={`https://youtube.com/watch?v=${youtubeId}`}
                modelId={modelId}
                key={`${youtubeId}_${modelId}`}
              />
            )
            ))
            return acc
          }, [] as ReactNode[])
        ) : <Spinner />
      }
      <Table.Body>
      </Table.Body>
    </Table.Root>
  )
}

const AdminPage = () => {
  const [models, setModels] = useState<Model[]>()
  const [detections, setDetection] = useState<DetectionRecord>()

  function fetchModelList() {
    setModels(undefined)
    api.models.getAll()
      .then(setModels)
      .catch(console.error)
  }

  function fetchDetectionsList() {
    setDetection(undefined)
    api.detections.getAll()
      .then(setDetection)
      .catch(console.error)
  }

  useEffect(() => {
    fetchModelList()
    fetchDetectionsList()
  }, [])

  return (
    <Flex direction='column' gapY='4'>
      <Flex justify='between'>
        <Heading>Models</Heading>
        <UploadButtonDialog onUpload={fetchModelList} />
      </Flex>
      <ModelTable models={models} onUpdate={fetchModelList} />

      <Flex justify='between'>
        <Heading>Detections</Heading>
      </Flex>
      <DetectionsTable models={models} detections={detections} />
    </Flex>
  )
}
export default AdminPage