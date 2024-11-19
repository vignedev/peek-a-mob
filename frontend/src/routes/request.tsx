import { Badge, Box, Code, ContextMenu, Flex, IconButton, Progress, Table } from "@radix-ui/themes"
import Link from "../components/Link"

const RequestPage = () => {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Job ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Video Title</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Model</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>ETA</Table.ColumnHeaderCell>
        </Table.Row>
        <ContextMenu.Root>
          <ContextMenu.Trigger>
            <Table.Row>
              <Table.Cell>#1</Table.Cell>
              <Table.Cell>
                <Link to='https://youtube.com/'>MINECRAFT - How I lost my map</Link>
              </Table.Cell>
              <Table.Cell><Code>runs/predict/pam_20241010_000006/weights/best.pt</Code></Table.Cell>
              <Table.Cell>
                <Flex align='center' gapX='4'>
                  <Box width='10rem'>
                    <Progress value={50} />
                  </Box>
                  50%
                </Flex>
              </Table.Cell>
              <Table.Cell>in 50 minutes</Table.Cell>
            </Table.Row>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item color='green'>Start</ContextMenu.Item>
            <ContextMenu.Item color='red'>Delete</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      </Table.Header>
    </Table.Root>
  )
}
export default RequestPage