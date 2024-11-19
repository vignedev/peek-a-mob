import { TabNav } from "@radix-ui/themes"
import { useLocation, Link } from "react-router-dom"

const RouterTabNav = () => {
  const location = useLocation()

  const routeMap = {
    '/': 'Home',
    '/debug': 'Debug'
  }

  return (
    <TabNav.Root>
      {
        Object.entries(routeMap).map(([path, title]) => (
          <TabNav.Link asChild key={path} active={location.pathname == path}>
            <Link to={path}>{title}</Link>
          </TabNav.Link>
        ))
      }
    </TabNav.Root>
  )
}

export default RouterTabNav