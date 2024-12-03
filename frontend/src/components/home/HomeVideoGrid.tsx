import { Box, Grid } from "@radix-ui/themes";
import VideoPreviewBox from "./VideoPreviewBox";
import { useEffect, useState } from "react";
import { api, Video } from "../../libs/api";

const HomeVideoGrid = () => {
  const [videos, setVideos] = useState<Video[]>([])
  const [modelId, setModelId] = useState<number>();

  useEffect( () => {
    api.videos.getAll().then((video) => {
      setVideos(video)
    });
    api.models.getAll().then((models) => {
      setModelId(models[0].modelId)
      models.forEach(model => {
        if(model.modelIsPrimary)
          setModelId(model.modelId)
      });
    }
    )
  }, [])

  return (
    <Box style={{ width: "100%", height: "100%" }}>
      <Grid columns="3" rows="repeat(2)" gapX="4" gapY="4" height="100%">
        {
          modelId &&
          <VideoPreviewBox videos={videos} video={videos[4]} modelId={modelId}/>
        }
      </Grid>
    </Box>
  )
}

export default HomeVideoGrid;