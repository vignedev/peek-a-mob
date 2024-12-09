import { ScrollArea, Grid } from "@radix-ui/themes";
import VideoPreviewBox from "./VideoPreviewBox";
import { useEffect, useState } from "react";
import { api, Video } from "../../libs/api";

const HomeVideoGrid = (props: {
  maxHomePageVideos: number;
}) => {
  const [videos, setVideos] = useState<Video[]>([])
  const [modelId, setModelId] = useState<number>();

  useEffect(() => {
    api.models.getAll()
      .then(models => {
        const primary = models.find(x => x.modelIsPrimary)! // enforce it - if not, admin had f'd up
        setModelId(primary.modelId)

        return api.videos.getAll([], primary.modelId)
      })
      .then((video) => setVideos(
        video
          .sort(() => Math.random() - 0.5)
          .slice(0, props.maxHomePageVideos)
      ))
      .catch(console.error);
  }, [])

  return (
    <ScrollArea>
      <Grid p='2' gapX="4" gapY="4" height="100%" pr="3" style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
        gridAutoRows: 'max-content'
      }}>
        {
          modelId && videos &&
          videos.map((video, index) => {
            return <VideoPreviewBox video={video} modelId={modelId} key={index} />
          })
        }
      </Grid>
    </ScrollArea>
  )
}

export default HomeVideoGrid;
