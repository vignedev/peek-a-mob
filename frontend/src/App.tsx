import { Blockquote, Container, Flex, Heading } from "@radix-ui/themes"
import { YouTubeWithTimeline } from "./components/YouTube"
import { Canvas } from "./components/Canvas"

function App() {
  return (
    <>
      <Container p='4'>
        <Flex direction='column' gap='4'>
          <Heading>peek-a-mob</Heading>
          <Blockquote>ey waddup son what dat mob doin</Blockquote>

          <YouTubeWithTimeline videoId="4Vs1wKjNuUw"/>
        </Flex>
      </Container>
    </>
  )
}

export default App
