import { Blockquote, Em, Heading, Text } from "@radix-ui/themes";
import { useNavigate } from "react-router-dom";

export const PeekAMobHeading = () => {
  const navigate = useNavigate();

  return (
    <Heading style={{
      whiteSpace: "nowrap",
      alignContent: "center",
      cursor: "pointer",
    }}
      onClick={() => { navigate("/") }}>
      Peek A Mob
    </Heading>
  );
}

export const VigTheorem = () => (
  <Blockquote size='4'>
    <Em>"Everything is either a chicken or a cow, there is no in between."</Em><br />
    <Text size='2' align='right'><i>— vignedev's theorem</i></Text>
  </Blockquote>
)