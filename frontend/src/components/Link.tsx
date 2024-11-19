import { Text, TextProps } from '@radix-ui/themes'
import { LinkProps as RouterLinkProps, Link as RouterLink } from 'react-router-dom'

const Link = (props: RouterLinkProps & TextProps) => {
  const {
    children,
    className,
    size, weight, align, trim, truncate, wrap, color, highContrast,
    ...rest
  } = props

  return (
    <RouterLink {...rest} className={`rt-Link ${className ?? ''}`.trim()}>
      <Text {...{ size, weight, align, trim, truncate, wrap, color, highContrast }}>
        {children}
      </Text>
    </RouterLink>
  )
}
export default Link