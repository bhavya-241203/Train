import { Capacitor } from '@capacitor/core'
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning'

/**
 * Scans a single barcode using the ready-to-use ML Kit scanner UI. Returns
 * null on web, when unsupported, when the user cancels, or on any error —
 * callers should fall back to manual entry in all of those cases.
 */
export async function scanOneBarcode(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null

  try {
    const { supported } = await BarcodeScanner.isSupported()
    if (!supported) return null

    if (Capacitor.getPlatform() === 'android') {
      const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()
      if (!available) {
        await BarcodeScanner.installGoogleBarcodeScannerModule()
      }
    }

    const { barcodes } = await BarcodeScanner.scan({
      formats: [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE, BarcodeFormat.Code128],
    })
    return barcodes[0]?.rawValue ?? null
  } catch {
    return null
  }
}
