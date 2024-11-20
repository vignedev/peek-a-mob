import { Flex, Grid } from "@radix-ui/themes";
import SearchDetailVideoSearch from "../components/search-detail/SearchDetailVideoSearch";
import SearchRetailConfigBar from "../components/search-detail/SearchDetailConfigBar";
import SearchDetailVideoBar from "../components/search-detail/SearchDetailVideoBar";

const SearchDetailPage = () => {
  return (
    <Flex 
      height='calc(100vh - 10rem)' 
      align='center' 
      justify='center'
      gap="4"
    >
      <Grid rows="2" gap="4" height="100%" width="38rem">
        <SearchRetailConfigBar />
        <SearchDetailVideoBar />
      </Grid>
      <SearchDetailVideoSearch />
    </Flex>
  )
}

export default SearchDetailPage;