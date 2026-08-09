import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { router } from '@/router'
import { authStore } from '@/store/authStore'
import { Toaster } from '@/components/ui/sonner'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

const App = observer(function App() {
  useEffect(() => {
    authStore.hydrate()
  }, [])

  if (authStore.isHydrating) {
    return <div className="min-h-screen bg-background" />
  }

  const content = (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )

  // Unset in local/dev by default (see .env.example) - the Google button just doesn't render
  // rather than the app crashing on a missing client ID.
  if (!GOOGLE_CLIENT_ID) return content
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>
})

export default App
