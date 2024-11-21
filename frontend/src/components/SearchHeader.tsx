import { Button, ButtonProps, Flex } from "@radix-ui/themes";
import { PeekAMobHeading } from "./Branding";
import { MagnifyingGlassIcon, FilePlusIcon, RocketIcon, CameraIcon } from "@radix-ui/react-icons"
import Search from "./Search";
import { useNavigate } from "react-router-dom";

const HeaderButton = ({ style, ...props }: ButtonProps) => (
  <Button
    variant={props.variant || 'surface'}
    style={{ height: 'auto', ...style }}
    {...props}
  />
)

const SearchHeader = () => {
  const navigate = useNavigate();

  return (
    <Flex gap="8" width="auto" pt='4'>
      <PeekAMobHeading />
      <Flex gap="2" width="100%">
        <Search />

        <HeaderButton color='iris' onClick={() => { navigate("search-detail") }}>
          <MagnifyingGlassIcon /> Search
        </HeaderButton>

        <HeaderButton onClick={() => { navigate("/request") }}>
          <FilePlusIcon /> Request
        </HeaderButton>

        <HeaderButton color='purple' onClick={() => navigate('/admin')}>
          <CameraIcon /> Models
        </HeaderButton>

        <HeaderButton color='red' onClick={() => navigate('/debug')}>
          <RocketIcon /> Debug
        </HeaderButton>
      </Flex>
    </Flex>
  )
}

export default SearchHeader;