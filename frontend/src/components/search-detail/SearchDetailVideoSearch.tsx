import { Box, Container } from "@radix-ui/themes";
import api, { DetailedVideo, Video } from "../../libs/api";
import { YouTubeWithTimeline } from "../YouTube";
import { useEffect, useState } from "react";

const SearchDetailVideoSearch = (props: {
  video: Video,
  entities: string[]
}) => {
  const [videoInfo, setVideoInfo] = useState<DetailedVideo>()
  const [modelId, setModelId] = useState<number>()

  useEffect(() => {
    if (!props.video.youtubeId) return;
    api.videos.get(props.video.youtubeId)
      .then(info => {
        setVideoInfo(info)
        setModelId(info.models[0].modelId)
      })
      .catch(console.error)
  }, [])

  return (
    <Box style={{
      width: "100%",
      height: "100%",
      borderRadius: "max(var(--radius-2), var(--radius-full))",
      background: "var(--gray-a2)"
    }}>
      <Container style={{ height: "100%" }}>
        {
          videoInfo && modelId &&
          <YouTubeWithTimeline
            modelId={modelId}
            videoInfo={videoInfo}
            entities={props.entities}
          />
        }
      </Container>
    </Box>
  );
}

export default SearchDetailVideoSearch;