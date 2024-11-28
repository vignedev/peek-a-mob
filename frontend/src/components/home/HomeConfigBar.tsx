import { Box, Container, Flex } from "@radix-ui/themes"

const HomeConfigBar = () => {
  return (
    <Box style={{
      width: "24rem",
      height: "100%",
      borderRadius: "max(var(--radius-2), var(--radius-full))",
      background: "var(--gray-a2)"
    }}>
      <Container p="2">
        <Flex>
          Vig config
        </Flex>
      </Container>
    </Box>
  )
}

export default HomeConfigBar;