import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Callout } from "@radix-ui/themes"

export const ErrorCallout = (props: { error: any }) => {
  if (!props.error) return null
  return (
    <Callout.Root color='red' style={{ marginTop: '1rem' }}>
      <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
      <Callout.Text>Whoopsie! Something has gone awry.<br />{props.error.message || JSON.stringify(props.error)}</Callout.Text>
    </Callout.Root>
  )
}

export default ErrorCallout