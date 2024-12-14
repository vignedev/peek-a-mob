import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes"
import { useNavigate } from "react-router-dom"

const Error404 = () => {
  const navigate = useNavigate()
  return (
    <Flex justify='center' align='center' height='calc(100vh - 10rem)'>
      <Card>
        <Flex direction='column' gap='2' p='4'>
          <Heading>Welcome to the Void!</Heading>

          <Text>
            How did you get here, little one...?<br />
            You can stay here if you want, but there is nothing here.
          </Text>

          <Flex pt='4' justify='between' align='end'>
            <Text color='gray' size='1'><i>(this is a 404 error message btw)</i></Text>
            <Button color='violet' onClick={() => navigate('/')} variant='outline'>Go Home</Button>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  )
}

export default Error404