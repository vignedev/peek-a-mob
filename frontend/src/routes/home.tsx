import { Flex } from "@radix-ui/themes"
import { VigTheorem } from "../components/Branding"
import HomeConfigBar from "../components/home/HomeConfigBar"
import HomeVideoGrid from "../components/home/HomeVideoGrid"

const HomePage = () => {
  const maxHomePageVideos = 9;
  return(
    <>
      <Flex
        height='calc(100vh - 10rem)'
        align='center'
        justify='center'
        gap="4"
      >
        <HomeConfigBar />
        <HomeVideoGrid maxHomePageVideos={maxHomePageVideos} />
      </Flex>
      <VigTheorem />
    </>
  )
}

export default HomePage