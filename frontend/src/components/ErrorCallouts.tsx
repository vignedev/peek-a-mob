import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Blockquote, Button, Callout, Code, Flex } from "@radix-ui/themes"
import { useState } from "react"
import { useRouteError } from "react-router-dom"

export const ErrorCallout = (props: { title?: string, error: any }) => {
  const { title, error } = props
  if (!error) return null

  const [show, setShow] = useState(false)

  return (
    <Callout.Root color='red' style={{ marginTop: '1rem' }}>
      <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
      <Callout.Text>
        <b>{title || 'Whoopsie! Something has gone awry.'}</b><br />
        {error.message || error.error || (typeof error === 'object' ? JSON.stringify(error) : error)}
      </Callout.Text>

      {error?.stack ? (
        <Flex direction='column' gapY='1' width='100%'>
          <Button size='1' variant='surface' onClick={() => setShow(s => !s)} style={{ width: 'fit-content' }}>
            {show ? 'Hide' : 'Show'} stack
          </Button>
          {!show ? null : (
            <Blockquote size='1'>
              <pre style={{ whiteSpace: 'pre-wrap' }}>
                {error.stack}
              </pre>
            </Blockquote>
          )}
        </Flex>
      ) : null
      }
    </Callout.Root >
  )
}

export const ErrorRouteCallout = () => {
  const routeError = useRouteError()
  return <ErrorCallout title='Oh goodness... A wild error boundary!' error={routeError} />
}

export default ErrorCallout