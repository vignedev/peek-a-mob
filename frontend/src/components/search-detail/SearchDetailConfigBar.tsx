import { Box, Flex } from "@radix-ui/themes";

const SearchRetailConfigBar = () => {
  return (
    <Box style={{
      height: "35%",
      borderRadius: "max(var(--radius-2), var(--radius-full))",
      background: "var(--gray-a2)"
    }}>
      <Flex>
        Config bar
      </Flex>
    </Box>
  );
}

export default SearchRetailConfigBar;