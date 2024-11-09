import { Blockquote, Container, Flex, Heading, Select } from "@radix-ui/themes"
import { YouTubeWithTimeline } from "./components/YouTube"
import { Canvas } from "./components/Canvas"
import { useState } from "react"

function App() {
  const videoOptions = [
    '4Vs1wKjNuUw',
    'INzUhj9SRX8',
    'uEvwuvod2F4'
  ]
  const [videoId, setVideoid] = useState<string>(videoOptions[0])

  return (
    <>
      <Container p='4'>
        <Flex direction='column' gap='4'>
          <Heading>peek-a-mob</Heading>
          <Blockquote>ey waddup son what dat mob doin</Blockquote>

          <Select.Root value={videoId} onValueChange={setVideoid}>
            <Select.Trigger />
            <Select.Content>
              {videoOptions.map(id => <Select.Item key={id} value={id}>{id}</Select.Item>)}
            </Select.Content>
          </Select.Root>

          <YouTubeWithTimeline videoId={videoId} />
        </Flex>
      </Container>
    </>
  )
}

export default App
