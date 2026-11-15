import { useSelector } from "@tanstack/react-store"
import { Zap, ZapOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { store, toggleAnimations } from "@/stores/real-talk"

/** Turns Real Talk's card animations on or off (remembered per browser). */
export function MotionToggle({
  showLabel = false,
  className,
}: {
  showLabel?: boolean
  className?: string
}) {
  const animationsEnabled = useSelector(store, (s) => s.animationsEnabled)
  const label = animationsEnabled ? "Turn animations off" : "Turn animations on"
  return (
    <Button
      onClick={toggleAnimations}
      variant="ghost"
      size={showLabel ? "sm" : "icon-sm"}
      title={label}
      aria-label={showLabel ? undefined : label}
      aria-pressed={animationsEnabled}
      className={className}
    >
      {animationsEnabled ? <Zap /> : <ZapOff />}
      {showLabel && (animationsEnabled ? "Animations on" : "Animations off")}
    </Button>
  )
}
