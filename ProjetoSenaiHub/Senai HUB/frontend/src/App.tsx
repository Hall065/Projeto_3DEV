import { BrowserRouter } from 'react-router-dom'
import { AppearanceProvider } from './contexts/AppearanceContext'
import { AuthProvider } from './contexts/AuthContext'
import { AppRoutes } from './routes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppearanceProvider>
          <AppRoutes />
        </AppearanceProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
