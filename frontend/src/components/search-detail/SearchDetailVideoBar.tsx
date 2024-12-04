import { Flex, Text, Box } from "@radix-ui/themes";
import { Video, api } from "../../libs/api";
import { ScrollArea } from "@radix-ui/themes/src/index.js";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const SearchDetailVideoBar = (props: {
  currentVideo: Video
  entities?: string[]
  modelId: number
}) => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>()

  useEffect( () => {
    if (props.entities) {
      api.videos.getAll(props.entities, props.modelId).then( videos => {
        setVideos(videos)
      })
    }
    else {
      api.videos.getAll().then( videos => {
        setVideos(videos)
      })
    }
  }, [])

  return (
    <Box 
      height="65%"
      style={{
        borderRadius: "max(var(--radius-2), var(--radius-full))",
        background: "var(--gray-a2)"
    }}>
      <ScrollArea>
        <Flex direction="column" gap="1" pr="3" p="1">
          <>
            {
              videos &&
              videos.map( (video, index) => {
                return (
                  <Flex 
                    key={index} 
                    gap="3"
                    pl="2" pt="1" pb="1"
                    onClick={() => navigate('/search-detail', {
                      state: {
                        videoList: videos,
                        currentVideo: video,
                        entities: props.entities
                      }
                    })}
                    style={{
                      backgroundColor: (props.currentVideo.youtubeId == video.youtubeId) ? 
                      "rgba(255,255,255,0.2)" : 
                      "",
                      borderRadius: "max(var(--radius-2), var(--radius-full))",
                      cursor: "pointer"
                    }}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                      style={{
                        borderRadius: "max(var(--radius-2), var(--radius-full))",
                        height: "4.5rem",
                      }}
                    />
                    <Flex>
                      <Text>{video.videoTitle}</Text>
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
