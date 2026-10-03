/** Interpolates red -> yellow -> green for a 0-100 score, used by the heatmap and rings. */
export function scoreToSolidColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score))
  const stops: [number, [number, number, number]][] = [
    [0, [248, 113, 113]], // red
    [50, [251, 191, 36]], // yellow
    [100, [52, 211, 153]], // green
  ]
  let lo = stops[0]
  let hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i][0] && clamped <= stops[i + 1][0]) {
      lo = stops[i]
      hi = stops[i + 1]
      break
    }
  }
  const t = hi[0] === lo[0] ? 0 : (clamped - lo[0]) / (hi[0] - lo[0])
  const rgb = lo[1].map((c, i) => Math.round(c + (hi[1][i] - c) * t))
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}
