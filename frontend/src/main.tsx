import './index.css'
import '@radix-ui/themes/styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Container, Theme, ThemePanel } from '@radix-ui/themes'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import DebugPage from './routes/debug.tsx'
import HomePage from './routes/home.tsx'
import RootPage from './routes/root.tsx'
import RequestPage from './routes/request.tsx'
import AdminPage from './routes/admin.tsx'
import SearchDetailPage from './routes/search-detail.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootPage />,
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
      }
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme appearance='dark'>
      <Container p="4" pt="2">
        <RouterProvider router={router} />
      </Container>
      <ThemePanel defaultOpen={false} />
    </Theme>
  </StrictMode>,
)
