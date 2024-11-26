import { Button, ButtonProps, Flex } from "@radix-ui/themes";
import { PeekAMobHeading } from "./Branding";
import { MagnifyingGlassIcon, FilePlusIcon, RocketIcon, CameraIcon } from "@radix-ui/react-icons"
import Search from "./Search";
import { api } from "../libs/api"
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const HeaderButton = ({ style, ...props }: ButtonProps) => (
  <Button
    variant={props.variant || 'surface'}
    style={{ height: 'auto', ...style }}
    {...props}
  />
)



const SearchHeader = () => {
  const navigate = useNavigate();
  const [options, setOptions] = useState<{value: string, label: string}[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string[]>([])

  const handleSearch = () => {
    api.videos.getAll(selectedEntity).then( 
      (videos) => {
        console.log(videos)
        if (videos && videos.length >= 1) {
          navigate('/search-detail', {state: {
            modelId: 0,
            videoList: videos,
            currentVideo: videos[0],
            currentEntities: selectedEntity
          }})
        }
      })
  }

  useEffect( () => {
    api.entities.getAll().then(
      (value) => {
        setOptions(value.map( entity => ({value: entity.entityName, label: entity.entityName})))
      }
    );
  }, [])

  return (
    <Flex gap="8" width="auto" pt='4'>
      <PeekAMobHeading />
      <Flex gap="2" width="100%">
        <Search options={options} setSelectedEntities={setSelectedEntity}/>

        <HeaderButton color='iris' onClick={handleSearch}>
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