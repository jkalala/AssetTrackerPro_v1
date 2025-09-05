import React from 'react'

interface QRLabelProps {
  asset: any
  templateConfig: any
  qrCodeUrl?: string // Optional: for batch PDF, pass the QR code image URL
}

export default function QRLabel({ asset, templateConfig, qrCodeUrl }: QRLabelProps) {
  const { logoUrl, fields, fontSize, labelPosition, qrSize } = templateConfig || {}
  const labelText = fields
    ?.map((f: string) => asset[f])
    .filter(Boolean)
    .join(' | ')

  return (
    <div
      style={{
        border: '1px solid #eee',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: qrSize + 40,
        background: '#fff',
      }}
    >
      {labelPosition === 'above' && <div style={{ fontSize, marginBottom: 8 }}>{labelText}</div>}
      {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: 32, marginBottom: 8 }} />}
      <div
        style={{
          width: qrSize,
          height: qrSize,
          background: '#f3f3f3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: labelPosition === 'below' ? 8 : 0,
        }}
      >
        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="QR" style={{ width: qrSize, height: qrSize }} />
        ) : (
          <span style={{ color: '#bbb' }}>QR</span>
        )}
      </div>
      {labelPosition === 'below' && <div style={{ fontSize, marginTop: 8 }}>{labelText}</div>}
    </div>
  )
}
