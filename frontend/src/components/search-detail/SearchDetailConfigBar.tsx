import { Box } from "@radix-ui/themes";

const SearchRetailConfigBar = () => {
  return ( 
    <Box style={{
      height: "100%", 
      borderRadius: "max(var(--radius-2), var(--radius-full))",
      background: "var(--gray-a2)"
    }}>
      Config bar
    </Box> 
  );
}
 
export default SearchRetailConfigBar;