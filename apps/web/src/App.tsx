import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="glass-card rounded-xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">FitPulse Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Workspace scaffold verified.</p>
        <Button className="mt-4">It works</Button>
      </div>
    </div>
  )
}

export default App
