import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

const ENFOCABLES = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// Capas abiertas, la última es la de encima: solo ella responde a Escape y Tab
const pila: symbol[] = []
let bloqueos = 0
let overflowOriginal = ''

function bloquearScroll() {
  if (bloqueos++ === 0) {
    overflowOriginal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}

function liberarScroll() {
  if (bloqueos > 0 && --bloqueos === 0) document.body.style.overflow = overflowOriginal
}

function enfocables(contenedor: HTMLElement): HTMLElement[] {
  return [...contenedor.querySelectorAll<HTMLElement>(ENFOCABLES)].filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  )
}

interface OpcionesCapa {
  contenedor: Ref<HTMLElement | null>
  alCerrar: () => void
  enfoqueInicial?: Ref<HTMLElement | null>
}

/** Comportamiento de ventana modal: foco atrapado, Escape, scroll bloqueado y foco devuelto. */
export function useCapa(abierto: Ref<boolean>, opciones: OpcionesCapa) {
  const id = Symbol('capa')
  let enfocadoAntes: HTMLElement | null = null
  let activa = false

  function alTeclear(evento: KeyboardEvent) {
    if (pila[pila.length - 1] !== id) return
    if (evento.key === 'Escape') {
      evento.preventDefault()
      opciones.alCerrar()
      return
    }
    const contenedor = opciones.contenedor.value
    if (evento.key !== 'Tab' || !contenedor) return
    const lista = enfocables(contenedor)
    const primero = lista[0]
    const ultimo = lista[lista.length - 1]
    if (!primero || !ultimo) {
      evento.preventDefault()
      contenedor.focus()
    } else if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault()
      primero.focus()
    }
  }

  async function abrir() {
    if (activa) return
    activa = true
    enfocadoAntes = document.activeElement instanceof HTMLElement ? document.activeElement : null
    pila.push(id)
    bloquearScroll()
    document.addEventListener('keydown', alTeclear)
    await nextTick()
    const contenedor = opciones.contenedor.value
    const destino =
      opciones.enfoqueInicial?.value ?? (contenedor ? enfocables(contenedor)[0] : undefined)
    ;(destino ?? contenedor)?.focus()
  }

  function cerrar() {
    if (!activa) return
    activa = false
    const indice = pila.indexOf(id)
    if (indice >= 0) pila.splice(indice, 1)
    liberarScroll()
    document.removeEventListener('keydown', alTeclear)
    if (enfocadoAntes?.isConnected) enfocadoAntes.focus()
    enfocadoAntes = null
  }

  watch(abierto, (valor) => (valor ? void abrir() : cerrar()), { immediate: true })
  onBeforeUnmount(cerrar)
}
