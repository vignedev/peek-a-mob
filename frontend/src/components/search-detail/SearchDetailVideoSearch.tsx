import { Box, ScrollArea } from "@radix-ui/themes";
import api, { DetailedVideo, Video } from "../../libs/api";
import { YouTubeWithTimeline } from "../YouTube";
import { useEffect, useState } from "react";

const SearchDetailVideoSearch = (props: {
  video: Video,
  entities?: string[],
  modelId: number
}) => {
  const [videoInfo, setVideoInfo] = useState<DetailedVideo>()

  useEffect(() => {
    if (!props.video.youtubeId) return;
    api.videos.get(props.video.youtubeId)
      .then(info => {
        setVideoInfo(info)
      })
      .catch(console.error)
  }, [props.video, props.entities])

  return (
    <Box style={{
      width: "100%",
      height: "100%",
      borderRadius: "max(var(--radius-2), var(--radius-full))",
      background: "var(--gray-a2)"
    }}>
      <ScrollArea>
        {
          videoInfo && props.modelId &&
          <YouTubeWithTimeline
            modelId={props.modelId}
            videoInfo={videoInfo}
            entities={props.entities}
          />
        }
      </ScrollArea>
    </Box>
  );
}

export default SearchDetailVideoSearch;