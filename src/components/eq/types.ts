export interface EQBand {
  id: string
  freq: number
  gain: number
  q: number
}

export const DEFAULT_BANDS: Array<EQBand> = [
  { id: "50", freq: 50, gain: 0, q: 0.8 },
  { id: "90", freq: 90, gain: 0, q: 0.8 },
  { id: "350", freq: 350, gain: 0, q: 0.8 },
  { id: "500", freq: 500, gain: 0, q: 0.8 },
  { id: "2000", freq: 2000, gain: 0, q: 0.8 },
  { id: "7000", freq: 7000, gain: 0, q: 0.8 },
]

export const DEFAULT_VOLUME = 1
