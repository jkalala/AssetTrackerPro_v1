export async function fetchQRTemplates() {
  const res = await fetch('/api/qr-templates')
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.templates || []
}

export async function fetchDefaultQRTemplate() {
  const templates = await fetchQRTemplates()
  return templates.find((tpl: any) => tpl.is_default) || templates[0] || null
}
