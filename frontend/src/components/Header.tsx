import { Flex } from "@radix-ui/themes";
import { PeekAMobHeading } from "./Branding";
import Search from "./Search";

const SearchHeader = () => {
    return (
        <Flex gap="2" width="auto">
            <PeekAMobHeading />
            <Search />
        </Flex>
    )
}

export default SearchHeader;