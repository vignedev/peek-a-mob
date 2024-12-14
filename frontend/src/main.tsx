import './index.css'
import '@radix-ui/themes/styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Container, Theme } from '@radix-ui/themes'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'

import DebugPage from './routes/debug.tsx'
import HomePage from './routes/home.tsx'
import RootPage from './routes/root.tsx'
import RequestPage from './routes/request.tsx'
import AdminPage from './routes/admin.tsx'
import SearchDetailPage from './routes/search-detail.tsx'
import { ErrorRouteCallout } from './components/ErrorCallouts.tsx'
import Error404 from './routes/error404.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootPage />,
    errorElement: <ErrorRouteCallout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'debug',
        element: <DebugPage />
      },
      {
        path: 'request',
        element: <RequestPage />
      },
      {
        path: 'admin',
        element: <AdminPage />
      },
      {
        path: 'search-detail',
        element: <SearchDetailPage />
      },
      {
        path: '*',
        element: <Error404 />
      }
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute='class'>
      <Theme appearance='inherit'>
        <Container p="4" pt="2">
          <RouterProvider router={router} />
        </Container>
      </Theme>
    </ThemeProvider>
  </StrictMode>,
)
