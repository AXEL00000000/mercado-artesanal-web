const pesos = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

export function formatearPrecio(valor: number): string {
  return pesos.format(valor)
}
