//import { PeekAMobHeading, VigTheorem } from "../components/Branding";
//import RouterTabNav from "../components/TabNav";
import { Flex } from "@radix-ui/themes";
import { Outlet } from "react-router-dom";
import SearchHeader from "../components/Header";

const RootPage = () => (
  <Flex gap='4' direction='column'>
    <SearchHeader />
    <Outlet />
  </Flex>
)
export default RootPage