import { Box, Grid } from "@radix-ui/themes";
import VideoPreviewBox from "./VideoPreviewBox";
import { useEffect, useState } from "react";
import { api, Video } from "../../libs/api";

const HomeVideoGrid = () => {
  const [videos, setVideos] = useState<Video[]>([])

  useEffect( () => {
    api.videos.getAll().then((video) => {
      setVideos(video)
    })
  }, [])

  return (
    <Box style={{ width: "100%", height: "100%" }}>
      <Grid columns="3" rows="repeat(2)" gapX="4" gapY="4" height="100%">
        <VideoPreviewBox videos={videos} video={videos[1]}/>
      </Grid>
    </Box>
  )
}

export default HomeVideoGrid;