import { Box, Grid } from "@radix-ui/themes";
import VideoPreviewBox from "./VideoPreviewBox";

const HomeVideoGrid = () => {
  return (
    <Box style={{ width: "100%", height: "100%" }}>
      <Grid columns="3" rows="repeat(2)" gapX="4" gapY="4" height="100%">
        <VideoPreviewBox />
        <VideoPreviewBox />
        <VideoPreviewBox />
        <VideoPreviewBox />
        <VideoPreviewBox />
        <VideoPreviewBox />
      </Grid>
    </Box>
  )
}

export default HomeVideoGrid;