import { AlertDialog, Badge, Button, Code, ContextMenu, Dialog, Flex, Grid, Heading, IconButton, Link, Spinner, Table, Text, TextField } from "@radix-ui/themes"
import { ReactNode, useEffect, useRef, useState } from "react"
import { DetectionRecord, Model, api } from "../libs/api"
import ErrorCallout from "../components/ErrorCallouts"
import { Pencil1Icon } from "@radix-ui/react-icons"
import { useNavigate } from "react-router-dom"

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

const DetectionTableRow = (props: { videoTitle: string, youtubeId: string, model: Model, onUpdate: () => void }) => {
  const { videoTitle, youtubeId, model, onUpdate } = props
  const navigate = useNavigate()

  const [showDelete, setShowDelete] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setBusy(false)
  }, [])

  function deleteThisEntry() {
    setError(null)
    setBusy(true)

    api.detections.delete(youtubeId, model.modelId)
      .then(() => {
        setShowDelete(false)
        onUpdate()
      })
      .catch(err => {
        console.error(err)
        setError(err)
      })
      .finally(() => {
        setBusy(false)
      })
  }

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger>
          <Table.Row>
            <Table.Cell><Link href={`https://youtube.com/watch?v=${youtubeId}`}>{videoTitle}</Link></Table.Cell>
            <Table.Cell>{model.modelName || <i style={{ opacity: 0.3 }}>[no name] ({model.modelPath})</i>}</Table.Cell>
          </Table.Row>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item onSelect={() => navigate('/debug', { state: { modelId: model.modelId, youtubeId } })}>Open in debug</ContextMenu.Item>
          <ContextMenu.Item onSelect={() => setShowDelete(true)} color='red'>Delete</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>
      <AlertDialog.Root open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialog.Content>
          <AlertDialog.Title>Are you sure?</AlertDialog.Title>
          <AlertDialog.Description>You are removing <Code>{model.modelName || model.modelPath}</Code> detections for video <Code>{videoTitle}</Code>.</AlertDialog.Description>

          <Flex pt='4' gap='2' justify='end'>
            <Button onClick={() => deleteThisEntry()} disabled={busy} variant='solid' color='red'>{busy ? <Spinner /> : 'Delete'}</Button>
            <AlertDialog.Cancel>
              <Button disabled={busy} variant='surface' color='gray'>Cancel</Button>
            </AlertDialog.Cancel>
          </Flex>

          <ErrorCallout error={error} />
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  )
}

const DetectionsTable = (props: { models?: Model[], detections?: DetectionRecord, onUpdate: () => void }) => {
  const { models, detections, onUpdate } = props

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
            acc.push(data.modelIds?.map(modelId =>
            (
              <DetectionTableRow
                model={models.find(x => x.modelId == modelId)!}
                videoTitle={data.videoTitle}
                youtubeId={youtubeId}
                key={`${youtubeId}_${modelId}`}
                onUpdate={onUpdate}
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
      <DetectionsTable models={models} detections={detections} onUpdate={fetchDetectionsList} />
    </Flex>
  )
}
export default AdminPage