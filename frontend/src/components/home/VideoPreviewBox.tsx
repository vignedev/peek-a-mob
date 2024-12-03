import { Flex, Text } from "@radix-ui/themes"
import { useNavigate } from "react-router-dom"
import { Video, api } from "../../libs/api";
import VideoTag from "../VideoTag";
import { useEffect, useState } from "react";

const VideoPreviewBox = (props: {
  videos: Video[],
  video: Video,
  modelId: number
}) => {
  const navigate = useNavigate();
  const [entities, setEntities] = useState<string[]>();

  useEffect( () => {
    let apiEntities: string[] = [];
    api.videos.getEntities(props.video.youtubeId, props.modelId)
    .then( (entities) => {
      entities.forEach( (entity) => {
        apiEntities.push(entity.entityName)
      })
      setEntities(apiEntities)
    })
  }, [])

  return (
    <>
    {
      props.video &&
      <Flex
        direction="column"
        onClick={() => navigate('/search-detail', {
          state: {
            videoList: props.videos,
            currentVideo: props.video
          }
        })}
        gap="1"
      >
        <img
          src={`https://img.youtube.com/vi/${props.video.youtubeId}/maxresdefault.jpg`}
          width="100%"
          style={{
            borderRadius: "max(var(--radius-2), var(--radius-full))"
          }}
        />
        <Text>{props.video.videoTitle}</Text>
        <Flex gap="2" wrap="wrap">
          {
            entities && entities.map( (entity, index) => {
              return <VideoTag tagText={entity} key={index}/>
            })
          }
        </Flex>
      </Flex>
    }
    </>
  )
}

export default VideoPreviewBox