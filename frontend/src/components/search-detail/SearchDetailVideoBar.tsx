import { ScrollArea, Flex, Text, Box } from "@radix-ui/themes";
import { Video } from "../../libs/api";
import { useNavigate } from "react-router-dom";

const SearchDetailVideoBar = (props: {
  currentVideoId: number
  modelId: number
  entities?: string[]
  videoList: Video[]
}) => {
  const navigate = useNavigate();

  return (
    <Box
      height="100%"
      style={{
        borderRadius: "max(var(--radius-2), var(--radius-full))",
        background: "var(--gray-a2)"
      }}
    >
      <ScrollArea>
        <Flex direction="column" gap="1" p="1">
          <>
            {
              props.videoList &&
              props.videoList.map((video, index) => {
                return (
                  <Flex
                    key={index}
                    gap="3"
                    pl="1" pt="1" pb="1" pr='4'
                    onClick={() => navigate('/search-detail', {
                      state: {
                        videoList: props.videoList,
                        currentVideoId: video.videoId,
                        currentEntities: props.entities,
                        modelId: props.modelId
                      }
                    })}
                    style={{
                      backgroundColor: (props.currentVideoId == video.videoId) ?
                        "rgba(255,255,255,0.2)" :
                        "",
                      borderRadius: "max(var(--radius-2), var(--radius-full))",
                      cursor: "pointer"
                    }}
                    className='searchDetailVideoSuggestion'
                  >
                    <img
                      src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                      style={{
                        borderRadius: "max(var(--radius-2), var(--radius-full))",
                        height: "4.5rem",
                      }}
                    />
                    <Flex direction='column'>
                      <Text>{video.videoTitle}</Text>
                      <Text size='1' color='gray'>{video.channelName}</Text>
                    </Flex>
                  </Flex>
                )
              })
            }
          </>
        </Flex>
      </ScrollArea>
    </Box>
  );
}

export default SearchDetailVideoBar;
