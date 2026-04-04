import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from "react-router-dom"
import { GoogleOAuthProvider } from "@react-oauth/google"
import './index.css'
import router from './router/Router'
import { AuthProvider } from './context/AuthContext'
import { ConfirmationProvider } from './context/ConfirmationContext'

const savedTheme = localStorage.getItem('ui.theme')
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
} else if (savedTheme === 'light') {
  document.documentElement.classList.remove('dark')
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ""

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <ConfirmationProvider>
          <RouterProvider router={router} />
        </ConfirmationProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
)
