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
          height={{ sm: 'calc(100vh - 10rem)', initial: '' }}
          align='center'
          justify='center'
          gap="4"
          direction={{ sm: 'row', initial: 'column-reverse' }}
        >
          <SearchDetailVideoBar
            currentVideoId={state.currentVideoId}
            videoList={state.videoList}
            modelId={state.modelId}
            entities={state.currentEntities}
          />
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