import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import { BrowserRouter } from 'react-router-dom'
import { AppearanceProvider } from './contexts/AppearanceContext'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { GlobalSearchProvider } from './contexts/GlobalSearchContext'
import { GlobalSearchPalette } from './components/search/GlobalSearchPalette'
import { AppRoutes } from './routes'

function App() {
  return (
    <I18nextProvider i18n={i18n}>
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
    </I18nextProvider>
  )
}

export default App
