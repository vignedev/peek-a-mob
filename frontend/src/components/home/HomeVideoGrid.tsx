import { Box, Grid } from "@radix-ui/themes";
import VideoPreviewBox from "./VideoPreviewBox";
import { useEffect, useState } from "react";
import { api, Video } from "../../libs/api";
import { ScrollArea } from "@radix-ui/themes/src/index.js";

const HomeVideoGrid = (props: {
  maxHomePageVideos: number;
}) => {
  const [videos, setVideos] = useState<Video[]>([])
  const [modelId, setModelId] = useState<number>();

  useEffect( () => {
    api.videos.getAll()
      .then((video) => setVideos(
        video
          .sort( () => Math.random() - 0.5 )
          .slice(0, props.maxHomePageVideos)
      ))
      .catch(console.error);

    api.models.getAll()
      .then((models) => {
        const primaryModelId = models.find(model => model.modelIsPrimary);
        setModelId(primaryModelId?.modelId || models[0].modelId);
      })
      .catch(console.error);
  }, [])

  return (
    <Box style={{ width: "100%", height: "100%" }}>
      <ScrollArea>
        <Grid columns="3" rows="repeat(2)" gapX="4" gapY="4" height="100%" pr="3">
          {
            modelId && videos &&
            videos.map( (video, index) => {
              return <VideoPreviewBox video={video} modelId={modelId} key={index}/>
            })
          }
        </Grid>
      </ScrollArea>
    </Box>
  )
}

export default HomeVideoGrid;