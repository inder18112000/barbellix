import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import type { LoginPairingToken } from '@barbellix/shared'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { QRCodeImage } from '@/components/common/QRCodeImage'

interface Props {
  target: { id: string; name: string } | null
  onClose: () => void
  onGenerate: (id: string) => Promise<LoginPairingToken>
}

/** Shared by MembersPage and TrainersPage - same QR device-pairing flow for either account type,
 * just pointed at a different generate-token endpoint (see onGenerate). Generates as soon as the
 * dialog opens (clicking "Generate sign-in QR" already expressed that intent - an extra button
 * to confirm the same intent again was pure friction), with a manual refresh for when the code
 * expires before it gets scanned. */
export function LoginPairingDialog({ target, onClose, onGenerate }: Props) {
  const mutation = useMutation({
    mutationFn: (id: string) => onGenerate(id),
    onError: (err: Error) => toast.error(err.message),
  })

  useEffect(() => {
    if (target) mutation.mutate(target.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id])

  const handleClose = (open: boolean) => {
    if (open) return
    mutation.reset()
    onClose()
  }

  return (
    <Dialog open={!!target} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign-in QR code</DialogTitle>
          <DialogDescription>
            {target?.name} scans this once in the mobile app to sign in instantly - no password needed. Expires in 10 minutes and works
            only once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          {mutation.data ? (
            <>
              <QRCodeImage value={mutation.data.token} />
              <p className="text-xs text-muted-foreground">
                Expires at {new Date(mutation.data.expiresAt).toLocaleTimeString()}
              </p>
              <Button variant="outline" size="sm" disabled={mutation.isPending} onClick={() => target && mutation.mutate(target.id)}>
                <RefreshCw className="size-3.5" />
                Generate new code
              </Button>
            </>
          ) : (
            <Skeleton className="size-[220px] rounded-lg" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
