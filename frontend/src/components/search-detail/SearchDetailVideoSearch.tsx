import { Box, Container, Flex, Text } from "@radix-ui/themes";
import { DetailedVideo, getVideos, getVideo, Video } from "../../libs/api";
import { useEffect, useState } from "react";
import { YouTubeWithTimeline } from "../YouTube";

const SearchDetailVideoSearch = () => {
  const [videoInfo, setVideoInfo] = useState<DetailedVideo>()
  const [modelId, setModelId] = useState<number>()
  const [videoId, setVideoId] = useState<string>()
  const [videoOptions, setVideoOptions] = useState<Video[]>()

  useEffect(() => {
    getVideos()
      .then((videos: Video[]) => {
        setVideoOptions(videos)
        if(videos) {
          setVideoId(videos[0].youtubeId);
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!videoId) return;
    getVideo(videoId)
      .then(info => {
        setVideoInfo(info)
        setModelId(info.models[0].modelId)
      })
      .catch(console.error)
  }, [videoId])

  return ( 
    <Box style={{
      width: "100%", 
      height: "100%", 
      borderRadius: "max(var(--radius-2), var(--radius-full))",
      background: "var(--gray-a2)"
    }}>
      <Container style={{height: "100%"}}>
        {
        (videoId && modelId != null && typeof modelId !== 'undefined' && videoInfo) &&
        <YouTubeWithTimeline 
          modelId={modelId} 
          videoId={videoInfo.youtubeId} 
          aspectRatio={videoInfo.aspectRatio}
        />
        }
      </Container>
    </Box> 
  );
}
 
export default SearchDetailVideoSearch;