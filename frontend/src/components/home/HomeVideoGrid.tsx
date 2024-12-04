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
    api.videos.getAll().then((video) => {
      const homePageVideos: Video[] = [];
      const randomVideos = video.sort(() => Math.random() - 0.5);
      for (let i = 0; i < video.length; i++) {
        if (i == props.maxHomePageVideos) break;
        homePageVideos.push(randomVideos[i]);
      }

      setVideos(homePageVideos);
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
      <ScrollArea>
        <Grid columns="3" rows="repeat(2)" gapX="4" gapY="4" height="100%" pr="3">
          {
            modelId && videos &&
            videos.map( (video, index) => {
              return <VideoPreviewBox videos={videos} video={video} modelId={modelId} key={index}/>
            })
          }
        </Grid>
      </ScrollArea>
    </Box>
  )
}

export default HomeVideoGrid;