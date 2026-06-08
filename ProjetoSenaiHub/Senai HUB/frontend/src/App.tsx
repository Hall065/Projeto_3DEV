import { BrowserRouter } from 'react-router-dom'
import { AppearanceProvider } from './contexts/AppearanceContext'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { GlobalSearchProvider } from './contexts/GlobalSearchContext'
import { GlobalSearchPalette } from './components/search/GlobalSearchPalette'
import { AppRoutes } from './routes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <GlobalSearchProvider>
            <AppearanceProvider>
              <AppRoutes />
              <GlobalSearchPalette />
            </AppearanceProvider>
          </GlobalSearchProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
