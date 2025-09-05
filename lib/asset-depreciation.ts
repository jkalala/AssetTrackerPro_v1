export function calculateBookValue({
  purchase_value,
  purchase_date,
  depreciation_method = 'straight_line',
  depreciation_period_years,
  salvage_value = 0,
}: {
  purchase_value: number
  purchase_date: string
  depreciation_method?: string
  depreciation_period_years: number
  salvage_value?: number
}): number {
  if (!purchase_value || !purchase_date || !depreciation_period_years) return 0
  const now = new Date()
  const start = new Date(purchase_date)
  const yearsElapsed = Math.max(
    0,
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  )
  if (depreciation_method === 'straight_line') {
    const annualDep = (purchase_value - (salvage_value || 0)) / depreciation_period_years
    const depreciated = annualDep * yearsElapsed
    const bookValue = Math.max(salvage_value || 0, purchase_value - depreciated)
    return Math.round(bookValue * 100) / 100
  }
  // Add other methods as needed
  return purchase_value
}
