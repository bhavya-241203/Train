export interface PhotoEstimate {
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

/**
 * Calls a small serverless function (see /serverless/photo-estimate) that
 * holds the vision-model API key server-side and returns a calorie/macro
 * estimate for a plate photo. Returns null when no endpoint is configured
 * or the call fails — callers must fall back to manual entry in that case,
 * never block the user on this.
 */
export async function estimateMealFromPhoto(photo: Blob): Promise<PhotoEstimate | null> {
  const endpoint = import.meta.env.VITE_PHOTO_ESTIMATE_URL as string | undefined
  if (!endpoint) return null

  try {
    const form = new FormData()
    form.append('photo', photo, 'meal.jpg')
    const res = await fetch(endpoint, { method: 'POST', body: form })
    if (!res.ok) return null
    const data = await res.json()
    if (typeof data.calories !== 'number') return null
    return {
      name: data.name ?? 'Photo meal',
      calories: Math.round(data.calories),
      proteinG: Math.round(data.proteinG ?? 0),
      carbsG: Math.round(data.carbsG ?? 0),
      fatG: Math.round(data.fatG ?? 0),
    }
  } catch {
    return null
  }
}

export function isPhotoEstimationConfigured(): boolean {
  return Boolean(import.meta.env.VITE_PHOTO_ESTIMATE_URL)
}
