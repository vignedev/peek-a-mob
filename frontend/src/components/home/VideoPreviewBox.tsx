import { Flex, Text } from "@radix-ui/themes"
import { useNavigate } from "react-router-dom"
import { Video, api } from "../../libs/api";
import VideoTag, { SkeletonTag } from "../VideoTag";
import { useEffect, useState } from "react";

const VideoPreviewBox = (props: {
  video: Video,
  modelId: number,
}) => {
  const navigate = useNavigate();
  const [entities, setEntities] = useState<string[]>();

  const handleVideoClick = () => {
    api.videos.getAll(entities, props.modelId)
      .then(videos => {
        navigate('/search-detail', {
          state: {
            videoList: videos,
            currentVideoId: props.video.videoId,
            currentEntities: entities,
            modelId: props.modelId
          }
        })
      });
  }

  useEffect(() => {
    setEntities(undefined)
    api.videos.getEntities(props.video.youtubeId, props.modelId)
      .then((entities) => setEntities(entities.map(entity => entity.entityName)))
      .catch(console.error)
  }, [props.video, props.video.videoId, props.modelId])

  return (
    <>
      {
        props.video &&
        <Flex
          direction="column"
          onClick={handleVideoClick}
          gap="1"
          style={{
            cursor: 'pointer'
          }}
          className='videoPreviewBox'
        >
          <img
            src={`https://img.youtube.com/vi/${props.video.youtubeId}/mqdefault.jpg`}
            width="100%"
            style={{
              borderRadius: "max(var(--radius-2), var(--radius-full))"
            }}
          />
          <Text>{props.video.videoTitle}</Text>
          <Flex gap="1" wrap="wrap">
            {
              entities ? entities.map((entity, index) => {
                return <VideoTag tagText={entity} key={index} />
              }) : <>
                <SkeletonTag children={'wah wah wah!'} />
                <SkeletonTag children={'Bibbidi'} />
                <SkeletonTag children={'bobbidi'} />
                <SkeletonTag children={'boowa'} />
                <SkeletonTag children={'yeah'} />
                <SkeletonTag children={'混絡がっても仕様が無い'} />
              </>
            }
          </Flex>
        </Flex>
      }
    </>
  )
}

export default VideoPreviewBox