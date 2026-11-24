<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useSesionStore } from '@/stores/sesion'
import { useCarritoStore } from '@/stores/carrito'

const sesion = useSesionStore()
const carrito = useCarritoStore()
const route = useRoute()
const router = useRouter()

const menuAbierto = ref(false)
const menu = ref<HTMLElement | null>(null)
const busqueda = ref('')

watch(
  () => route.fullPath,
  () => (menuAbierto.value = false),
)

function cerrarAlClicFuera(evento: MouseEvent) {
  if (menu.value && evento.target instanceof Node && !menu.value.contains(evento.target)) {
    menuAbierto.value = false
  }
}

function cerrarConEscape(evento: KeyboardEvent) {
  if (evento.key === 'Escape') menuAbierto.value = false
}

onMounted(() => {
  document.addEventListener('click', cerrarAlClicFuera)
  document.addEventListener('keydown', cerrarConEscape)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', cerrarAlClicFuera)
  document.removeEventListener('keydown', cerrarConEscape)
})

function salir() {
  sesion.logout()
  menuAbierto.value = false
  void router.push({ name: 'catalogo' })
}

function primerNombre(nombre: string) {
  return nombre.split(' ')[0] ?? nombre
}
</script>

<template>
  <div class="layout">
    <a href="#contenido" class="saltar">Saltar al contenido</a>

    <header class="encabezado">
      <div class="encabezado__fila contenedor">
        <RouterLink :to="{ name: 'catalogo' }" class="logo">Mercado Artesanal</RouterLink>

        <form class="buscador" role="search" @submit.prevent>
          <label for="buscador" class="solo-lectores">Buscar artesanías</label>
          <svg viewBox="0 0 24 24" aria-hidden="true" class="buscador__icono">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="buscador"
            v-model="busqueda"
            type="search"
            placeholder="Buscar barro negro, textiles, alebrijes…"
            autocomplete="off"
          />
        </form>

        <nav class="navegacion" aria-label="Principal">
          <RouterLink :to="{ name: 'catalogo' }" class="navegacion__enlace">Catálogo</RouterLink>

          <RouterLink
            :to="{ name: 'carrito' }"
            class="carrito"
            :aria-label="`Carrito, ${carrito.cantidadTotal} productos`"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" />
              <circle cx="9.5" cy="20" r="1.3" />
              <circle cx="17.5" cy="20" r="1.3" />
            </svg>
            <span v-if="carrito.cantidadTotal" class="carrito__contador">
              {{ carrito.cantidadTotal > 99 ? '99+' : carrito.cantidadTotal }}
            </span>
          </RouterLink>

          <RouterLink
            v-if="!sesion.estaAutenticado"
            :to="{ name: 'login' }"
            class="navegacion__entrar"
          >
            Entrar
          </RouterLink>

          <div v-else ref="menu" class="menu">
            <button
              type="button"
              class="menu__boton"
              :aria-expanded="menuAbierto"
              aria-haspopup="true"
              :aria-label="`Menú de ${sesion.usuario?.nombre ?? 'mi cuenta'}`"
              aria-controls="menu-sesion"
              @click="menuAbierto = !menuAbierto"
            >
              <span class="menu__inicial" aria-hidden="true">
                {{ sesion.usuario?.nombre.charAt(0).toUpperCase() ?? '?' }}
              </span>
              <span class="menu__nombre">{{
                primerNombre(sesion.usuario?.nombre ?? 'Mi cuenta')
              }}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" class="menu__flecha">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <ul v-show="menuAbierto" id="menu-sesion" class="menu__lista">
              <li class="menu__cabecera">
                <strong>{{ sesion.usuario?.nombre }}</strong>
                <span>{{ sesion.usuario?.email }}</span>
              </li>
              <li><RouterLink :to="{ name: 'pedidos' }">Mis compras</RouterLink></li>
              <li v-if="!sesion.esAdmin || sesion.tieneTaller">
                <RouterLink :to="{ name: 'mi-taller' }">
                  {{ sesion.tieneTaller ? 'Mi taller' : 'Abrir mi taller' }}
                </RouterLink>
              </li>
              <template v-if="sesion.esAdmin">
                <li><RouterLink :to="{ name: 'admin-talleres' }">Admin · Talleres</RouterLink></li>
                <li>
                  <RouterLink :to="{ name: 'admin-catalogos' }">Admin · Catálogos</RouterLink>
                </li>
              </template>
              <li><button type="button" @click="salir">Salir</button></li>
            </ul>
          </div>
        </nav>
      </div>
    </header>

    <main id="contenido" class="contenido">
      <slot />
    </main>

    <footer class="pie">
      <div class="contenedor">
        <p>Mercado Artesanal · Artesanía de comunidades de Oaxaca</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.saltar {
  position: absolute;
  top: -100px;
  left: var(--space-4);
  z-index: 20;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-control);
  background: var(--color-texto);
  color: var(--color-superficie);
}

.saltar:focus {
  top: var(--space-2);
}

.encabezado {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--color-linea);
  background: var(--color-fondo);
}

.encabezado__fila {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas: 'logo buscador navegacion';
  align-items: center;
  gap: var(--space-5);
  min-height: var(--alto-encabezado);
  padding-block: var(--space-2);
}

.logo {
  grid-area: logo;
  font-family: var(--font-titulos);
  font-size: var(--texto-xl);
  font-weight: 800;
  letter-spacing: -0.02em;
  text-decoration: none;
  white-space: nowrap;
}

.buscador {
  grid-area: buscador;
  position: relative;
  max-width: 32rem;
}

.buscador input {
  width: 100%;
  min-height: 2.75rem;
  padding: var(--space-2) var(--space-4) var(--space-2) 2.75rem;
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-pildora);
  background: var(--color-superficie);
}

.buscador input::placeholder {
  color: var(--color-texto-secundario);
}

.buscador__icono {
  position: absolute;
  top: 50%;
  left: var(--space-4);
  width: 1.1rem;
  height: 1.1rem;
  transform: translateY(-50%);
  fill: none;
  stroke: var(--color-texto-secundario);
  stroke-width: 2;
  stroke-linecap: round;
}

.navegacion {
  grid-area: navegacion;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.navegacion__enlace,
.navegacion__entrar {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-control);
  font-weight: 600;
  text-decoration: none;
}

.navegacion__enlace:hover {
  background: var(--color-suave);
}

.navegacion__enlace.router-link-exact-active {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.navegacion__entrar {
  border: 1.5px solid var(--color-texto);
}

.navegacion__entrar:hover {
  background: var(--color-suave);
}

.carrito {
  position: relative;
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-pildora);
}

.carrito:hover {
  background: var(--color-suave);
}

.carrito svg {
  width: 1.5rem;
  height: 1.5rem;
  fill: none;
  stroke: currentcolor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.carrito__contador {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 1.25rem;
  height: 1.25rem;
  padding-inline: var(--space-1);
  border-radius: var(--radius-pildora);
  background: var(--color-primario);
  color: var(--color-sobre-primario);
  font-size: var(--texto-xs);
  font-weight: 700;
  line-height: 1.25rem;
  text-align: center;
}

.menu {
  position: relative;
}

.menu__boton {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 2.75rem;
  padding: var(--space-1) var(--space-2) var(--space-1) var(--space-1);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-pildora);
  background: var(--color-superficie);
  cursor: pointer;
}

.menu__inicial {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-pildora);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-family: var(--font-titulos);
  font-weight: 700;
}

.menu__nombre {
  max-width: 9rem;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu__flecha {
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentcolor;
  stroke-width: 2;
}

.menu__lista {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  min-width: 14rem;
  margin: 0;
  padding: var(--space-2);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  box-shadow: var(--sombra-suave);
  list-style: none;
}

.menu__cabecera {
  display: flex;
  flex-direction: column;
  padding: var(--space-2) var(--space-3) var(--space-3);
  margin-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-linea);
}

.menu__cabecera span {
  overflow: hidden;
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
  text-overflow: ellipsis;
}

.menu__lista a,
.menu__lista button {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: calc(var(--radius-control) - 4px);
  background: none;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.menu__lista a:hover,
.menu__lista button:hover {
  background: var(--color-suave);
}

.contenido {
  flex: 1;
}

.pie {
  margin-top: var(--space-8);
  padding-block: var(--space-6);
  border-top: 1px solid var(--color-linea);
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}

.pie p {
  margin: 0;
}

@media (max-width: 720px) {
  .encabezado__fila {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'logo navegacion'
      'buscador buscador';
    gap: var(--space-2) var(--space-3);
  }

  .logo {
    font-size: var(--texto-lg);
  }

  .buscador {
    max-width: none;
  }

  .navegacion {
    gap: var(--space-1);
  }

  .navegacion__enlace,
  .menu__nombre,
  .menu__flecha {
    display: none;
  }

  .menu__boton {
    padding: var(--space-1);
  }
}
</style>
