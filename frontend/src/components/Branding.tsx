import { Blockquote, Em, Heading, Text, Tooltip } from "@radix-ui/themes";
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
      <Tooltip content={(<>
        <span>{__BUILD_INFO__.hash} {__BUILD_INFO__.message}</span><br />
        <span>Build date: {new Date(__BUILD_INFO__.date).toLocaleString()}</span>
      </>)} delayDuration={3000}>
        <Text>
          Peek A Mob
        </Text>
      </Tooltip>
    </Heading>
  );
}

export const VigTheorem = () => (
  <Blockquote size='4'>
    <Em>"Everything is either a chicken or a cow, there is no in between."</Em><br />
    <Text size='2' align='right'><i>— vignedev's theorem</i></Text>
  </Blockquote>
)