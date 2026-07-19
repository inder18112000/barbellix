import { TriangleAlert } from 'lucide-react'

interface Props {
  message?: string
}

export function ErrorState({ message = 'Something went wrong loading this data.' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" />
      </div>
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}
