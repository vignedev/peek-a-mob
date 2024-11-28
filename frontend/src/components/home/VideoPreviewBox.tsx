import { Flex, Text } from "@radix-ui/themes"
import { useNavigate } from "react-router-dom"

const VideoPreviewBox = () => {
  const navigate = useNavigate();
  return (
    <Flex
      direction="column"
      onClick={() => navigate("/search-detail")}
      gap="1"
    >
      <img
        src="https://img.youtube.com/vi/uEvwuvod2F4/maxresdefault.jpg"
        width="100%"
        style={{
          borderRadius: "max(var(--radius-2), var(--radius-full))"
        }}
      />
      <Text>【Minecraft】 Together As One!!! #MythOneblock</Text>
      <Flex gap="2" wrap="wrap">
        <Text style={{
          borderStyle: "solid",
          borderColor: "grey",
          borderWidth: "2px",
          borderRadius: "max(var(--radius-2), var(--radius-full))",
          padding: "0px 8px"
        }}>
          Enderman
        </Text>
        <Text style={{
          borderStyle: "solid",
          borderColor: "grey",
          borderWidth: "2px",
          borderRadius: "max(var(--radius-2), var(--radius-full))",
          padding: "0px 8px"
        }}>
          Chicken
        </Text>
        <Text style={{
          borderStyle: "solid",
          borderColor: "grey",
          borderWidth: "2px",
          borderRadius: "max(var(--radius-2), var(--radius-full))",
          padding: "0px 8px"
        }}>
          Zombie
        </Text>
        <Text style={{
          borderStyle: "solid",
          borderColor: "grey",
          borderWidth: "2px",
          borderRadius: "max(var(--radius-2), var(--radius-full))",
          padding: "0px 8px"
        }}>
          Pig
        </Text>
      </Flex>
    </Flex>
  )
}

export default VideoPreviewBox