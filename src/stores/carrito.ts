import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ProductoDetalle, ProductoTarjeta } from '@/shared/api/tipos'

const CLAVE_CARRITO = 'ma.carrito'

export interface ItemCarrito {
  producto_id: number
  nombre: string
  precio: number
  cantidad: number
  imagen: string | null
  productor_id: number
  nombre_taller: string
  /** null si el producto no tenía stock al agregarse (no debería pasar con modo 'fijo'). */
  stock: number | null
}

export type ResultadoCarrito = { ok: true } | { ok: false; error: string }

type ProductoParaCarrito = ProductoTarjeta | ProductoDetalle

function imagenDe(producto: ProductoParaCarrito): string | null {
  if ('imagenes' in producto) {
    const principal = producto.imagenes.find((i) => i.es_principal) ?? producto.imagenes[0]
    return principal?.url ?? null
  }
  return producto.imagen
}

function leerGuardado(): ItemCarrito[] {
  try {
    const datos: unknown = JSON.parse(localStorage.getItem(CLAVE_CARRITO) ?? '[]')
    return Array.isArray(datos) ? (datos as ItemCarrito[]) : []
  } catch {
    return []
  }
}

export const useCarritoStore = defineStore('carrito', () => {
  const items = ref<ItemCarrito[]>(leerGuardado())

  watch(items, (valor) => localStorage.setItem(CLAVE_CARRITO, JSON.stringify(valor)), {
    deep: true,
  })

  const total = computed(() => items.value.reduce((suma, i) => suma + i.precio * i.cantidad, 0))
  const cantidadTotal = computed(() => items.value.reduce((suma, i) => suma + i.cantidad, 0))
  const taller = computed(() => {
    const primero = items.value[0]
    return primero ? { id: primero.productor_id, nombre_taller: primero.nombre_taller } : null
  })

  function buscar(productoId: number) {
    return items.value.find((i) => i.producto_id === productoId)
  }

  function agregar(producto: ProductoParaCarrito, cantidad = 1): ResultadoCarrito {
    if (producto.modo_venta !== 'fijo') {
      return { ok: false, error: 'Este producto es de precio a tratar: consúltalo por WhatsApp.' }
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      return { ok: false, error: 'La cantidad debe ser al menos 1.' }
    }
    if (taller.value && taller.value.id !== producto.productor.id) {
      return {
        ok: false,
        error: `Tu carrito tiene productos de "${taller.value.nombre_taller}". Cada compra es con un solo taller: termina esa compra o vacía el carrito para agregar productos de "${producto.productor.nombre_taller}".`,
      }
    }

    const existente = buscar(producto.id)
    const nuevaCantidad = (existente?.cantidad ?? 0) + cantidad
    if (producto.stock !== null && nuevaCantidad > producto.stock) {
      return { ok: false, error: `Solo hay ${producto.stock} disponibles de este producto.` }
    }

    if (existente) {
      existente.cantidad = nuevaCantidad
      existente.precio = producto.precio
      existente.stock = producto.stock
    } else {
      items.value.push({
        producto_id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad,
        imagen: imagenDe(producto),
        productor_id: producto.productor.id,
        nombre_taller: producto.productor.nombre_taller,
        stock: producto.stock,
      })
    }
    return { ok: true }
  }

  function quitar(productoId: number) {
    items.value = items.value.filter((i) => i.producto_id !== productoId)
  }

  function cambiarCantidad(productoId: number, cantidad: number): ResultadoCarrito {
    const item = buscar(productoId)
    if (!item) return { ok: false, error: 'El producto no está en el carrito.' }
    if (!Number.isInteger(cantidad)) return { ok: false, error: 'La cantidad no es válida.' }
    if (cantidad < 1) {
      quitar(productoId)
      return { ok: true }
    }
    if (item.stock !== null && cantidad > item.stock) {
      return { ok: false, error: `Solo hay ${item.stock} disponibles de este producto.` }
    }
    item.cantidad = cantidad
    return { ok: true }
  }

  function vaciar() {
    items.value = []
  }

  return { items, total, cantidadTotal, taller, agregar, quitar, cambiarCantidad, vaciar }
})
