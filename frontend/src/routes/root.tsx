//import { PeekAMobHeading, VigTheorem } from "../components/Branding";
//import RouterTabNav from "../components/TabNav";
import { Box, Flex } from "@radix-ui/themes";
import { Outlet } from "react-router-dom";
import SearchHeader from "../components/SearchHeader";

const RootPage = () => (
  <Flex gap='4' direction='column'>
    <SearchHeader />
    <Box pt='4'>
      <Outlet />
    </Box>
  </Flex>
)
export default RootPage