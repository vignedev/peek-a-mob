import { Flex } from "@radix-ui/themes"
import { VigTheorem } from "../components/Branding"
import HomeConfigBar from "../components/home/HomeConfigBar"
import HomeVideoGrid from "../components/home/HomeVideoGrid"

const HomePage = () => (
  <>
    <Flex
      height='calc(100vh - 10rem)'
      align='center'
      justify='center'
      gap="4"
    >
      <HomeConfigBar />
      <HomeVideoGrid />
    </Flex>
    <VigTheorem />
  </>
)

export default HomePage