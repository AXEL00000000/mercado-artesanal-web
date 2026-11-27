import type { RouteLocationRaw } from 'vue-router'

export interface PestanaPanel {
  etiqueta: string
  to: RouteLocationRaw
  /** Número pendiente que se muestra junto a la etiqueta (p. ej. ventas nuevas). */
  contador?: number
}
