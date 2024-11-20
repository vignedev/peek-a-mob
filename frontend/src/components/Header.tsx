import { Button, Flex } from "@radix-ui/themes";
import { PeekAMobHeading } from "./Branding";
import { MagnifyingGlassIcon, FilePlusIcon } from "@radix-ui/react-icons"
import Search from "./Search";
import { useNavigate } from "react-router-dom";

const SearchHeader = () => {
  const navigate = useNavigate();

  return (
    <Flex gap="8" width="auto">
      <PeekAMobHeading />
      <Flex gap="2" width="100%">
        <Search />
        <Button variant="outline" highContrast style={{height: "auto", cursor: "pointer"}}>
          <MagnifyingGlassIcon /> Search
        </Button>
      
      <Button variant="outline" style={{height: "auto", cursor: "pointer"}} 
        onClick={() => { navigate("/request") }}>
          <FilePlusIcon /> Request
      </Button>
      </Flex>
    </Flex>
  )
}

export default SearchHeader;