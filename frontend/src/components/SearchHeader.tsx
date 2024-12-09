import { Button, ButtonProps, Flex } from "@radix-ui/themes";
import { PeekAMobHeading } from "./Branding";
import { MagnifyingGlassIcon, FilePlusIcon, RocketIcon, CameraIcon, Half2Icon } from "@radix-ui/react-icons"
import Search from "./Search";
import { api } from "../libs/api"
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const HeaderButton = ({ style, text, children, ...props }: ButtonProps & { text?: string }) => (
  <Button
    variant={props.variant || 'surface'}
    style={{ height: 'auto', ...style }}
    {...props}
  >
    {children}
    {!!text && <span className='hideOnPhones'>{text}</span>}
  </Button>
)

const SearchHeader = () => {
  const { setTheme, resolvedTheme } = useTheme()
  const navigate = useNavigate();
  const [options, setOptions] = useState<{ value: string, label: string }[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([])
  const [modelId, setModelId] = useState<number>()

  const handleSearch = () => {
    api.videos.getAll(selectedEntities, -1)
      .then((videos) => {
        if (videos && videos.length >= 1) {
          navigate('/search-detail', {
            state: {
              videoList: videos,
              currentVideoId: videos[0].videoId,
              currentEntities: selectedEntities,
              modelId: modelId
            }
          })
        }
      })
      .catch(console.error);
  }

  useEffect(() => {
    api.entities.getAll()
      .then((value) => {
        setOptions(value.map(entity => ({ value: entity.entityName, label: entity.entityName })))
      })
      .catch(console.error)

    api.models.getAll()
      .then((models) => {
        const primaryModelId = models.find(model => model.modelIsPrimary);
        setModelId(primaryModelId?.modelId || models[0].modelId);
      })
      .catch(console.error);
  }, [])

  return (
    <Flex gap={{ sm: "8", initial: '2' }} width="auto" pt='4'>
      <PeekAMobHeading />
      <Flex gap="2" width="100%">
        <Search options={options} setSelectedEntities={setSelectedEntities} />

        <HeaderButton color='iris' onClick={handleSearch} text='Search'>
          <MagnifyingGlassIcon />
        </HeaderButton>

        <HeaderButton onClick={() => { navigate("/request") }} text='Request'>
          <FilePlusIcon />
        </HeaderButton>

        <HeaderButton color='purple' onClick={() => navigate('/admin')} text='Models'>
          <CameraIcon />
        </HeaderButton>

        <HeaderButton color='red' onClick={() => navigate('/debug')} text='Debug'>
          <RocketIcon />
        </HeaderButton>

        <HeaderButton color='gray' onClick={() => setTheme(resolvedTheme == 'dark' ? 'light' : 'dark')}>
          <Half2Icon />
        </HeaderButton>
      </Flex>
    </Flex>
  )
}

export default SearchHeader;