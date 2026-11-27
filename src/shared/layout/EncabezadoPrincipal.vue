<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useSesionStore } from '@/stores/sesion'
import { useCarritoStore } from '@/stores/carrito'
import {
  ENLACES_PRINCIPALES,
  estaActivo,
  opcionesDeCuenta,
  tipoDeUsuario,
} from '@/shared/utils/navegacion'

const sesion = useSesionStore()
const carrito = useCarritoStore()
const route = useRoute()
const router = useRouter()

const tipo = computed(() => tipoDeUsuario(sesion.usuario))
const opciones = computed(() => opcionesDeCuenta(tipo.value))
const conCarrito = computed(() => tipo.value !== 'admin')
const inicial = computed(() => sesion.usuario?.nombre.trim().charAt(0).toUpperCase() || '?')
const primerNombre = computed(() => sesion.usuario?.nombre.trim().split(/\s+/)[0] ?? 'Mi cuenta')
const textoCarrito = computed(() => {
  const n = carrito.cantidadTotal
  return n === 0 ? 'Carrito vacío' : `Carrito, ${n} ${n === 1 ? 'producto' : 'productos'}`
})

const cuentaAbierta = ref(false)
const movilAbierto = ref(false)
const cuenta = ref<HTMLElement | null>(null)
const botonCuenta = ref<HTMLButtonElement | null>(null)
const botonMovil = ref<HTMLButtonElement | null>(null)
const menuMovil = ref<HTMLElement | null>(null)

watch(
  () => route.fullPath,
  () => {
    cuentaAbierta.value = false
    movilAbierto.value = false
  },
)

watch(movilAbierto, async (abierto) => {
  if (!abierto) return
  await nextTick()
  menuMovil.value?.querySelector<HTMLElement>('a, button')?.focus()
})

function alternarCuenta() {
  cuentaAbierta.value = !cuentaAbierta.value
}

function alClicFuera(evento: MouseEvent) {
  const objetivo = evento.target
  if (!(objetivo instanceof Node)) return
  if (cuentaAbierta.value && cuenta.value && !cuenta.value.contains(objetivo)) {
    cuentaAbierta.value = false
  }
}

function alTeclear(evento: KeyboardEvent) {
  if (evento.key !== 'Escape') return
  if (cuentaAbierta.value) {
    cuentaAbierta.value = false
    botonCuenta.value?.focus()
  }
  if (movilAbierto.value) {
    movilAbierto.value = false
    botonMovil.value?.focus()
  }
}

const escritorio = window.matchMedia('(min-width: 45.0625rem)')
function alCambiarTamano() {
  if (escritorio.matches) movilAbierto.value = false
  else cuentaAbierta.value = false
}

onMounted(() => {
  document.addEventListener('click', alClicFuera)
  document.addEventListener('keydown', alTeclear)
  escritorio.addEventListener('change', alCambiarTamano)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', alClicFuera)
  document.removeEventListener('keydown', alTeclear)
  escritorio.removeEventListener('change', alCambiarTamano)
})

function salir() {
  cuentaAbierta.value = false
  movilAbierto.value = false
  sesion.logout()
  void router.push('/')
}
</script>

<template>
  <header class="encabezado">
    <div class="encabezado__fila contenedor">
      <button
        ref="botonMovil"
        type="button"
        class="boton-icono encabezado__menu-movil"
        :aria-expanded="movilAbierto"
        aria-controls="menu-movil"
        :aria-label="movilAbierto ? 'Cerrar menú' : 'Abrir menú'"
        @click="movilAbierto = !movilAbierto"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path v-if="movilAbierto" d="M6 6l12 12M18 6 6 18" />
          <path v-else d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <RouterLink to="/" class="marca">
        <img src="/logo-mercado-artesanal.svg" alt="Mercado Artesanal" class="marca__logo" />
      </RouterLink>

      <nav class="navegacion" aria-label="Principal">
        <ul class="navegacion__lista">
          <li v-for="enlace in ENLACES_PRINCIPALES" :key="enlace.etiqueta">
            <RouterLink
              :to="enlace.ruta"
              class="navegacion__enlace"
              :class="{ 'navegacion__enlace--activo': estaActivo(enlace, route.path) }"
              :aria-current="estaActivo(enlace, route.path) ? 'page' : undefined"
            >
              {{ enlace.etiqueta }}
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="encabezado__derecha">
        <RouterLink
          v-if="conCarrito"
          to="/carrito"
          class="boton-icono carrito"
          :class="{ 'carrito--activo': route.path === '/carrito' }"
          :aria-label="textoCarrito"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" />
            <circle cx="9.5" cy="20" r="1.3" />
            <circle cx="17.5" cy="20" r="1.3" />
          </svg>
          <span v-if="carrito.cantidadTotal" class="carrito__contador" aria-hidden="true">
            {{ carrito.cantidadTotal > 99 ? '99+' : carrito.cantidadTotal }}
          </span>
        </RouterLink>

        <RouterLink
          v-if="!sesion.estaAutenticado"
          :to="{ name: 'login' }"
          class="entrar solo-escritorio"
        >
          Entrar
        </RouterLink>

        <div v-else ref="cuenta" class="cuenta solo-escritorio">
          <button
            ref="botonCuenta"
            type="button"
            class="cuenta__boton"
            :aria-expanded="cuentaAbierta"
            aria-controls="menu-cuenta"
            :aria-label="`Cuenta de ${sesion.usuario?.nombre ?? 'usuario'}`"
            @click="alternarCuenta"
          >
            <span class="avatar" aria-hidden="true">{{ inicial }}</span>
            <span class="cuenta__nombre" aria-hidden="true">{{ primerNombre }}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" class="cuenta__flecha">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <div v-show="cuentaAbierta" id="menu-cuenta" class="cuenta__menu">
            <p class="cuenta__datos">
              <strong>{{ sesion.usuario?.nombre }}</strong>
              <span>{{ sesion.usuario?.email }}</span>
            </p>
            <ul class="cuenta__opciones">
              <li v-for="opcion in opciones" :key="opcion.etiqueta">
                <RouterLink
                  :to="opcion.ruta"
                  class="cuenta__opcion"
                  :class="{ 'cuenta__opcion--activa': estaActivo(opcion, route.path) }"
                  :aria-current="estaActivo(opcion, route.path) ? 'page' : undefined"
                >
                  {{ opcion.etiqueta }}
                </RouterLink>
              </li>
              <li>
                <button type="button" class="cuenta__opcion cuenta__salir" @click="salir">
                  Salir
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-show="movilAbierto" id="menu-movil" ref="menuMovil" class="menu-movil">
      <div class="contenedor">
        <nav aria-label="Principal (móvil)">
          <ul class="menu-movil__lista">
            <li v-for="enlace in ENLACES_PRINCIPALES" :key="enlace.etiqueta">
              <RouterLink
                :to="enlace.ruta"
                class="menu-movil__enlace"
                :class="{ 'menu-movil__enlace--activo': estaActivo(enlace, route.path) }"
                :aria-current="estaActivo(enlace, route.path) ? 'page' : undefined"
              >
                {{ enlace.etiqueta }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <RouterLink
          v-if="!sesion.estaAutenticado"
          :to="{ name: 'login' }"
          class="entrar menu-movil__accion"
        >
          Entrar
        </RouterLink>

        <div v-else class="menu-movil__cuenta">
          <p class="menu-movil__usuario">
            <span class="avatar" aria-hidden="true">{{ inicial }}</span>
            <span>
              <strong>{{ sesion.usuario?.nombre }}</strong>
              <span>{{ sesion.usuario?.email }}</span>
            </span>
          </p>
          <ul class="menu-movil__lista" aria-label="Tu cuenta">
            <li v-for="opcion in opciones" :key="opcion.etiqueta">
              <RouterLink
                :to="opcion.ruta"
                class="menu-movil__enlace"
                :class="{ 'menu-movil__enlace--activo': estaActivo(opcion, route.path) }"
                :aria-current="estaActivo(opcion, route.path) ? 'page' : undefined"
              >
                {{ opcion.etiqueta }}
              </RouterLink>
            </li>
          </ul>
          <button type="button" class="entrar menu-movil__accion" @click="salir">Salir</button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.encabezado {
  position: relative;
  z-index: var(--z-encabezado);
  border-bottom: var(--borde-fino) solid var(--color-linea);
  background: var(--color-superficie);
}

.encabezado__fila {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding-block: var(--space-3);
}

.marca {
  display: inline-flex;
  flex: none;
  border-radius: var(--radius-control);
}

.marca__logo {
  width: auto;
  height: var(--alto-logo);
}

.navegacion {
  margin-left: auto;
}

.navegacion__lista {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.navegacion__enlace {
  display: inline-flex;
  align-items: center;
  min-height: var(--alto-control);
  padding: 0 var(--space-3);
  border-radius: var(--radius-pildora);
  font-size: var(--texto-sm);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

.navegacion__enlace:hover {
  background: var(--color-suave);
  color: var(--color-texto);
}

.navegacion__enlace--activo {
  background: var(--color-suave);
}

.encabezado__derecha {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.boton-icono {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  width: var(--alto-control);
  height: var(--alto-control);
  padding: 0;
  border: 0;
  border-radius: var(--radius-pildora);
  background: none;
  cursor: pointer;
}

.boton-icono:hover {
  background: var(--color-suave);
  color: var(--color-texto);
}

.boton-icono svg {
  width: var(--tamano-icono);
  height: var(--tamano-icono);
  fill: none;
  stroke: currentcolor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.carrito--activo {
  background: var(--color-suave);
}

.carrito__contador {
  position: absolute;
  top: var(--borde-grueso);
  right: 0;
  min-width: var(--tamano-contador);
  height: var(--tamano-contador);
  padding-inline: var(--space-1);
  border-radius: var(--radius-pildora);
  background: var(--color-primario);
  color: var(--color-sobre-primario);
  font-size: var(--texto-xs);
  font-weight: 600;
  line-height: var(--tamano-contador);
  text-align: center;
}

.entrar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--alto-control);
  padding: 0 var(--space-5);
  border: var(--borde-fino) solid var(--color-texto);
  border-radius: var(--radius-pildora);
  background: var(--color-fondo);
  font-size: var(--texto-sm);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.entrar:hover {
  background: var(--color-suave);
  color: var(--color-texto);
}

.cuenta {
  position: relative;
}

.cuenta__boton {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--alto-control);
  padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-pildora);
  background: var(--color-fondo);
  font-size: var(--texto-sm);
  font-weight: 600;
  cursor: pointer;
}

.cuenta__boton:hover,
.cuenta__boton[aria-expanded='true'] {
  background: var(--color-suave);
}

.avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--tamano-avatar);
  height: var(--tamano-avatar);
  border-radius: var(--radius-pildora);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-family: var(--font-titulos);
  font-weight: 700;
}

.cuenta__nombre {
  max-width: 9em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cuenta__flecha {
  width: var(--tamano-icono-sm);
  height: var(--tamano-icono-sm);
  fill: none;
  stroke: currentcolor;
  stroke-width: 2;
}

.cuenta__menu {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  z-index: var(--z-menu);
  min-width: var(--ancho-menu);
  padding: var(--space-2);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  box-shadow: var(--sombra-suave);
}

.cuenta__datos {
  display: flex;
  flex-direction: column;
  padding: var(--space-2) var(--space-3) var(--space-3);
  border-bottom: var(--borde-fino) solid var(--color-linea);
}

.cuenta__datos span,
.menu-movil__usuario span span {
  overflow: hidden;
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
  text-overflow: ellipsis;
}

.cuenta__opciones {
  margin: var(--space-1) 0 0;
  padding: 0;
  list-style: none;
}

.cuenta__opcion {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--alto-control);
  padding: 0 var(--space-4);
  border: 0;
  border-radius: var(--radius-pildora);
  background: none;
  font-size: var(--texto-sm);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.cuenta__opcion:hover {
  background: var(--color-suave);
  color: var(--color-texto);
}

.cuenta__opcion--activa {
  background: var(--color-suave);
  font-weight: 600;
}

.cuenta__opciones li:last-child {
  margin-top: var(--space-1);
  padding-top: var(--space-1);
  border-top: var(--borde-fino) solid var(--color-linea);
}

.encabezado__menu-movil,
.menu-movil {
  display: none;
}

@media (max-width: 45rem) {
  .encabezado__fila {
    gap: var(--space-2);
    padding-block: var(--space-2);
  }

  .encabezado__menu-movil {
    display: grid;
    margin-left: calc(-1 * var(--space-2));
  }

  .marca__logo {
    height: var(--alto-logo-sm);
  }

  .navegacion,
  .solo-escritorio {
    display: none;
  }

  .encabezado__derecha {
    margin-left: auto;
  }

  .menu-movil {
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    display: block;
    padding-block: var(--space-2) var(--space-5);
    border-bottom: var(--borde-fino) solid var(--color-linea);
    background: var(--color-superficie);
    box-shadow: var(--sombra-capa);
  }

  .menu-movil__cuenta {
    border-top: var(--borde-fino) solid var(--color-linea);
  }

  .menu-movil__usuario {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) 0 var(--space-1);
  }

  .menu-movil__usuario > span:last-child {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .menu-movil__lista {
    margin: 0;
    padding: var(--space-2) 0;
    list-style: none;
  }

  .menu-movil__enlace {
    display: flex;
    align-items: center;
    min-height: var(--alto-control);
    padding: 0 var(--space-4);
    border-radius: var(--radius-pildora);
    font-weight: 600;
    text-decoration: none;
  }

  .menu-movil__enlace:hover {
    background: var(--color-suave);
    color: var(--color-texto);
  }

  .menu-movil__enlace--activo {
    background: var(--color-suave);
  }

  .menu-movil__accion {
    width: 100%;
    margin-top: var(--space-2);
  }
}
</style>
