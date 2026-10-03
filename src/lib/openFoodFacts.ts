export interface OffProduct {
  barcode: string
  name: string
  calories: number // per 100g/ml, kcal
  proteinG: number
  carbsG: number
  fatG: number
  found: boolean
}

/**
 * Looks up a barcode against the free, keyless Open Food Facts API.
 * Indian packaged-food coverage can be partial — callers must always allow a
 * manual override when `found` is false or the numbers look off.
 */
export async function lookupBarcode(barcode: string): Promise<OffProduct> {
  const empty: OffProduct = { barcode, name: '', calories: 0, proteinG: 0, carbsG: 0, fatG: 0, found: false }
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`)
    if (!res.ok) return empty
    const data = await res.json()
    if (data.status !== 1 || !data.product) return empty

    const n = data.product.nutriments ?? {}
    return {
      barcode,
      name: data.product.product_name || data.product.generic_name || 'Unknown product',
      calories: Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
      proteinG: Math.round(n.proteins_100g ?? 0),
      carbsG: Math.round(n.carbohydrates_100g ?? 0),
      fatG: Math.round(n.fat_100g ?? 0),
      found: true,
    }
  } catch {
    return empty
  }
}
