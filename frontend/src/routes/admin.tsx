import { Badge, Button, Card, Code, Dialog, Flex, Grid, Heading, Spinner, Table, Text, TextField } from "@radix-ui/themes"
import { Fragment, useEffect, useRef, useState } from "react"
import { Model, newModel } from "../libs/api"
import { getModels } from "../libs/api"
import ErrorCallout from "../components/ErrorCallouts"

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
    newModel(name, file)
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
            <input onChange={e => setFile(e.target.files![0])} ref={fileRef} disabled={busy} accept='.pt' multiple={false} type='file' />
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

const AdminPage = () => {
  const [models, setModels] = useState<Model[]>()

  function fetchModelList() {
    setModels(undefined)
    getModels()
      .then(setModels)
      .catch(console.error)
  }

  useEffect(() => {
    fetchModelList()
  }, [])

  return (
    <Flex direction='column' gapY='4'>
      <Flex justify='between'>
        <Heading>Models</Heading>
        <UploadButtonDialog onUpload={fetchModelList} />
      </Flex>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.RowHeaderCell>Model ID</Table.RowHeaderCell>
            <Table.RowHeaderCell>Model Name</Table.RowHeaderCell>
            <Table.RowHeaderCell>Model Path</Table.RowHeaderCell>
            <Table.RowHeaderCell>Available</Table.RowHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {
            models ? models.map(model => {
              return <Fragment key={model.modelPath}>
                <Table.Row>
                  <Table.Cell>{model.modelId}</Table.Cell>
                  <Table.Cell>{model.modelName}</Table.Cell>
                  <Table.Cell><Code>{model.modelPath}</Code></Table.Cell>
                  <Table.Cell><Badge color={model.modelAvailable ? 'green' : 'gray'}>{model.modelAvailable ? 'Available' : 'Offline'}</Badge></Table.Cell>
                </Table.Row>
              </Fragment>
            }) : null
          }
        </Table.Body>
      </Table.Root>
    </Flex>
  )
}
export default AdminPage