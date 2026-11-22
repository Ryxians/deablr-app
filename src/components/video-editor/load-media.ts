export interface MediaInfo {
  url: string
  duration: number
  width: number
  height: number
}

/**
 * Reads a file's duration (and size, for video) through a throwaway media
 * element. The returned object URL is kept for playback; revoke it when the
 * track is removed.
 */
export function loadMediaInfo(
  file: File,
  kind: "video" | "audio"
): Promise<MediaInfo> {
  const url = URL.createObjectURL(file)
  const el = document.createElement(kind)
  el.preload = "metadata"
  el.muted = true
  return new Promise((resolve, reject) => {
    const fail = (message: string) => {
      URL.revokeObjectURL(url)
      reject(new Error(message))
    }
    el.onloadedmetadata = () => {
      const video = kind === "video" ? (el as HTMLVideoElement) : null
      const info = {
        url,
        duration: el.duration,
        width: video?.videoWidth ?? 0,
        height: video?.videoHeight ?? 0,
      }
      el.removeAttribute("src")
      el.load()
      if (!Number.isFinite(info.duration) || info.duration <= 0) {
        fail(`Couldn't read how long “${file.name}” is.`)
      } else if (video && (!info.width || !info.height)) {
        fail(`“${file.name}” doesn't have a picture this browser can show.`)
      } else {
        resolve(info)
      }
    }
    el.onerror = () => fail(`This browser can't play “${file.name}”.`)
    el.src = url
  })
}
