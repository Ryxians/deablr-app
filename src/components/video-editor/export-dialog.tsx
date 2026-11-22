import { Download, Share } from "lucide-react"
import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement("a")
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
}

function canShare(file: File) {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  )
}

type ShareResult = "shared" | "unsupported" | "failed"

export async function tryShareFile(file: File): Promise<ShareResult> {
  if (!canShare(file)) return "unsupported"
  try {
    await navigator.share({ files: [file] })
    return "shared"
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "shared"
    }
    if (error instanceof TypeError) return "unsupported"
    return "failed"
  }
}

export function ExportDialog({
  file,
  onClose,
}: {
  file: File
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const share = () => {
    if (!canShare(file)) {
      downloadFile(file)
      onClose()
      return
    }
    navigator
      .share({ files: [file] })
      .catch((err) => {
        // If the share sheet still won't open, fall back to downloading.
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          downloadFile(file)
        }
      })
      .finally(onClose)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[oklch(0.15_0.05_265/0.75)] p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="text-center">
            <h3 id="share-title" className="text-lg font-bold">
              Export ready
            </h3>
            <p className="text-sm text-muted-foreground">
              Your edited video is ready to share.
            </p>
          </div>
          <div className="grid gap-2">
            <Button type="button" onClick={share} autoFocus>
              <Share />
              Share
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                downloadFile(file)
                onClose()
              }}
            >
              <Download />
              Download
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
