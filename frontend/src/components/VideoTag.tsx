import { Text } from "@radix-ui/themes"

const VideoTag = (props: {
  tagText: string;
}) => {
  return ( 
    <Text style={{
      borderStyle: "solid",
      borderColor: "grey",
      borderWidth: "2px",
      borderRadius: "max(var(--radius-2), var(--radius-full))",
      padding: "0px 8px"
    }}>
      {props.tagText}
    </Text>
  );
}
 
export default VideoTag;