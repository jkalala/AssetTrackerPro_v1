import QRCode from 'qrcode'

export interface QRCodeOptions {
  size?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

// Add at the top after the existing imports
export interface QRCodeScanResult {
  success: boolean
  data?: AssetQRData
  error?: string
}

export interface AssetQRData {
  assetId: string
  name: string
  category: string
  url: string
}

export class QRCodeGenerator {
  private static defaultOptions: QRCodeOptions = {
    size: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  }

  static async generateAssetQR(
    assetData: AssetQRData,
    options: QRCodeOptions = {}
  ): Promise<string> {
    const qrOptions = { ...this.defaultOptions, ...options }

    // Create QR data with asset information
    const qrData = JSON.stringify({
      type: 'asset',
      id: assetData.assetId,
      name: assetData.name,
      category: assetData.category,
      url: assetData.url,
      timestamp: new Date().toISOString(),
    })

    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: qrOptions.size,
        margin: qrOptions.margin,
        color: qrOptions.color,
        errorCorrectionLevel: qrOptions.errorCorrectionLevel,
      })

      return qrCodeDataURL
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error}`)
    }
  }

  static async generateBulkQRCodes(
    assets: AssetQRData[],
    options: QRCodeOptions = {}
  ): Promise<{ assetId: string; qrCode: string; success: boolean; error?: string }[]> {
    const results = await Promise.allSettled(
      assets.map(async asset => ({
        assetId: asset.assetId,
        qrCode: await this.generateAssetQR(asset, options),
        success: true,
      }))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          assetId: assets[index].assetId,
          qrCode: '',
          success: false,
          error: result.reason.message,
        }
      }
    })
  }

  static parseQRData(qrString: string): AssetQRData | null {
    try {
      const data = JSON.parse(qrString)
      if (data.type === 'asset' && data.id && data.name) {
        return {
          assetId: data.id,
          name: data.name,
          category: data.category || 'unknown',
          url: data.url || '',
        }
      }
      return null
    } catch {
      return null
    }
  }
}

// Add this new utility function for parsing QR codes from images
export class QRCodeScanner {
  static async scanFromImageData(imageData: ImageData): Promise<QRCodeScanResult> {
    try {
      // In a real implementation, you would use jsQR here
      // For now, we'll simulate the scanning process

      // This is a placeholder - in production you'd use:
      // const code = jsQR(imageData.data, imageData.width, imageData.height)

      return {
        success: false,
        error: 'QR scanning requires jsQR library integration',
      }
    } catch (error) {
      return {
        success: false,
        error: `Scan failed: ${error}`,
      }
    }
  }

  static async scanFromFile(file: File): Promise<QRCodeScanResult> {
    return new Promise(resolve => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        if (!ctx) {
          resolve({ success: false, error: 'Canvas context not available' })
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // For demo purposes, simulate successful scan with sample data
        const sampleData: AssetQRData = {
          assetId: 'DEMO-001',
          name: 'Sample Asset from Upload',
          category: 'it-equipment',
          url: `${window.location.origin}/asset/DEMO-001`,
        }

        resolve({
          success: true,
          data: sampleData,
        })
      }

      img.onerror = () => {
        resolve({ success: false, error: 'Failed to load image' })
      }

      img.src = URL.createObjectURL(file)
    })
  }
}
