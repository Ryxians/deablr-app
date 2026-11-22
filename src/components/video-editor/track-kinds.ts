import { Layers, Music } from "lucide-react"
import type { Track } from "./types"

/** How each kind of track is named and drawn, shared by timeline and inspector. */
export const TRACK_KINDS: Record<
  Track["kind"],
  { label: string; icon: typeof Layers }
> = {
  video: { label: "Video layer", icon: Layers },
  audio: { label: "Audio track", icon: Music },
}
