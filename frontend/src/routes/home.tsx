import { Flex } from "@radix-ui/themes"
import { VigTheorem } from "../components/Branding"
import HomeVideoGrid from "../components/home/HomeVideoGrid"

const HomePage = () => {
  const maxHomePageVideos = 12;
  return (
    <Flex
      direction='column'
      gap='4'
    >
      <Flex
        height='calc(100vh - 11.5rem)'
        align='center'
        justify='center'
        gap="4"
      >
        <HomeVideoGrid maxHomePageVideos={maxHomePageVideos} />
      </Flex>
      <VigTheorem />
    </Flex>
  )
}

export default HomePage