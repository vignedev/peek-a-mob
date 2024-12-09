import { Skeleton, Text } from "@radix-ui/themes"
import { RandomColorFromString } from "../libs/utils";
import { ReactNode } from "react";

const VideoTag = (props: {
  tagText: string;
}) => {
  return (
    <Text style={{
      borderStyle: "solid",
      borderColor: RandomColorFromString(props.tagText, 0.5),
      background: RandomColorFromString(props.tagText, 0.1),
      borderWidth: "1px",
      borderRadius: "max(var(--radius-2), var(--radius-full))",
      padding: "0 0.25rem"
    }} size='1'>
      {props.tagText}
    </Text>
  );
}

export const SkeletonTag = (props: {
  children: ReactNode | undefined
}) => {
  return <Skeleton>
    <Text size='1' style={{ padding: '0 0.25rem' }}>{props.children}</Text>
  </Skeleton>
}

export default VideoTag;