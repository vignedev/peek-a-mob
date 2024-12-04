import { Flex } from "@radix-ui/themes";
import SearchDetailVideoSearch from "../components/search-detail/SearchDetailVideoSearch";
import SearchDetailVideoBar from "../components/search-detail/SearchDetailVideoBar";
import { useLocation } from "react-router-dom";
import { Video } from "../libs/api";

const SearchDetailPage = () => {
  const location = useLocation()
  const state = location.state as {
    modelId: number,
    videoList: Video[],
    currentVideoId: number,
    currentEntities?: string[]
  }
  const currentVideo = state.videoList.find(v => v.videoId == state.currentVideoId);

  return (
    <>
      {
        currentVideo &&
        <Flex
          height='calc(100vh - 10rem)'
          align='center'
          justify='center'
          gap="4"
        >
          <Flex direction="column" gap="4" height="100%" width="40rem">
            <SearchDetailVideoBar
              currentVideoId={state.currentVideoId}
              videoList={state.videoList}
              modelId={state.modelId}
              entities={state.currentEntities}
            />
          </Flex>
          <SearchDetailVideoSearch
            video={currentVideo}
            entities={state.currentEntities}
            modelId={state.modelId}
          />
        </Flex>
      }
    </>
  )
}

export default SearchDetailPage;