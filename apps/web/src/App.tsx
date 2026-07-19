import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { router } from '@/router'
import { authStore } from '@/store/authStore'
import { Toaster } from '@/components/ui/sonner'

const App = observer(function App() {
  useEffect(() => {
    authStore.hydrate()
  }, [])

  if (authStore.isHydrating) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
})

export default App
