import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  value: string
  size?: number
}

/** Renders a real QR code image (generated client-side, no external service) - shared by any
 * flow that needs to display a scannable code (currently: the QR device-pairing login flow). */
export function QRCodeImage({ value, size = 220 }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setDataUrl(null)
    QRCode.toDataURL(value, { width: size, margin: 1 }).then((url) => {
      if (!cancelled) setDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [value, size])

  if (!dataUrl) return <Skeleton style={{ width: size, height: size }} />

  return <img src={dataUrl} alt="QR code" width={size} height={size} className="rounded-lg border" />
}
