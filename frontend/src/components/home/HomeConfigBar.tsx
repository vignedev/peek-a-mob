import { Box, Container } from "@radix-ui/themes"

const HomeConfigBar = () => {
  return (
    <Box style={{
      width: "20rem", 
      height: "100%", 
      backgroundColor: "red",
      borderRadius: "max(var(--radius-2), var(--radius-full))",
      background: "var(--gray-a2)"
    }}>
      <Container p="2">
        <Box style={{alignItems: "center", width: "100%", textAlign: "center"}}>
          Vig config
        </Box>
      </Container>
    </Box>
  )
}

export default HomeConfigBar;