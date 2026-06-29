import type { EQBand } from "./types"
import { Button } from "@/components/ui/button"

interface EQControlsProps {
  bands: Array<EQBand>
  onChange: (bands: Array<EQBand>) => void
  onReset: () => void
}

export function EQControls({ bands, onChange, onReset }: EQControlsProps) {
  const updateBand = (index: number, patch: Partial<EQBand>) => {
    const next = bands.map((band, i) =>
      i === index ? { ...band, ...patch } : band,
    )
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm">Custom EQ</h3>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {bands.map((band, index) => (
          <div
            key={band.id}
            className="flex flex-col items-center gap-2 rounded-lg border bg-muted/30 p-3 select-none"
            style={{ touchAction: "none" }}
          >
            <span className="text-xs font-medium tabular-nums">
              {band.gain.toFixed(1)} dB
            </span>
            <input
              type="range"
              min={-12}
              max={12}
              step={0.1}
              value={band.gain}
              onChange={(e) =>
                updateBand(index, { gain: Number.parseFloat(e.target.value) })
              }
              onTouchStart={(e) => e.preventDefault()}
              onTouchMove={(e) => e.preventDefault()}
              className="h-32 w-2 cursor-pointer appearance-none rounded bg-border accent-primary sm:h-40"
              style={{
                writingMode: "vertical-lr",
                direction: "rtl",
                touchAction: "none",
                userSelect: "none",
              }}
            />
            <div className="text-center">
              <div className="text-xs font-semibold">{band.freq} Hz</div>
              <div className="text-[10px] text-muted-foreground">
                Q={band.q}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
