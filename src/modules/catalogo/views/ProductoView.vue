<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { get, post } from '@/shared/api/cliente'
import type { ProductoDetalle } from '@/shared/api/tipos'
import BotonBase from '@/shared/components/BotonBase.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import EtiquetaVenta from '@/shared/components/EtiquetaVenta.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import { useCarritoStore } from '@/stores/carrito'
import { formatearPrecio } from '@/shared/utils/formato'

interface RespuestaConsulta {
  id: number
  producto_id: number
  origen: string
  canal: string
  created_at: string
  whatsapp_url: string
}

const props = defineProps<{ slug: string }>()
const route = useRoute()
const carrito = useCarritoStore()

const cargando = ref(true)
const error = ref<unknown>(null)
const producto = ref<ProductoDetalle | null>(null)

const imagenActivaIndex = ref(0)
const cantidad = ref(1)
const errorCarrito = ref<string | null>(null)
const mensajeExitoCarrito = ref<string | null>(null)
const enviandoConsulta = ref(false)

const imagenPrincipalUrl = computed(() => {
  if (!producto.value || !producto.value.imagenes.length) return null
  const seleccionada = producto.value.imagenes[imagenActivaIndex.value]
  if (seleccionada) return seleccionada.url
  const principal = producto.value.imagenes.find((i) => i.es_principal)
  return principal ? principal.url : producto.value.imagenes[0]?.url ?? null
})

const stockMaximo = computed(() => {
  if (!producto.value) return 1
  return producto.value.stock ?? 99
})

async function cargarProducto() {
  cargando.value = true
  error.value = null
  errorCarrito.value = null
  mensajeExitoCarrito.value = null
  imagenActivaIndex.value = 0
  cantidad.value = 1

  const slugActual = props.slug || (route.params.slug as string)
  try {
    const datos = await get<ProductoDetalle>(`/productos/${slugActual}`)
    producto.value = datos
  } catch (err) {
    error.value = err
  } finally {
    cargando.value = false
  }
}

function agregarAlCarrito() {
  if (!producto.value) return
  errorCarrito.value = null
  mensajeExitoCarrito.value = null

  const resultado = carrito.agregar(producto.value, cantidad.value)
  if (!resultado.ok) {
    errorCarrito.value = resultado.error
  } else {
    mensajeExitoCarrito.value = `Se agregaron ${cantidad.value} pieza(s) a tu carrito.`
    setTimeout(() => {
      mensajeExitoCarrito.value = null
    }, 4000)
  }
}

async function registrarYConsultarWhatsApp(origen: 'boton_tratar' | 'link_dudas') {
  if (!producto.value) return
  enviandoConsulta.value = true

  try {
    const respuesta = await post<RespuestaConsulta>('/consultas', {
      producto_id: producto.value.id,
      origen,
      canal: 'web',
    })

    if (respuesta?.whatsapp_url) {
      window.open(respuesta.whatsapp_url, '_blank', 'noopener,noreferrer')
    } else if (producto.value.productor.whatsapp) {
      const urlDirecta = `https://wa.me/${producto.value.productor.whatsapp}`
      window.open(urlDirecta, '_blank', 'noopener,noreferrer')
    }
  } catch {
    // Si falla el endpoint de métricas, abrimos contacto directo como respaldo
    if (producto.value.productor.whatsapp) {
      const urlDirecta = `https://wa.me/${producto.value.productor.whatsapp}`
      window.open(urlDirecta, '_blank', 'noopener,noreferrer')
    }
  } finally {
    enviandoConsulta.value = false
  }
}

function cambiarCantidad(delta: number) {
  const nuevo = cantidad.value + delta
  if (nuevo >= 1 && nuevo <= stockMaximo.value) {
    cantidad.value = nuevo
  }
}

watch(
  () => props.slug,
  () => {
    void cargarProducto()
  },
)

onMounted(() => {
  void cargarProducto()
})
</script>

<template>
  <div class="producto-vista contenedor">
    <!-- Navegación de retorno -->
    <nav class="producto-vista__volver" aria-label="Miga de pan">
      <RouterLink :to="{ name: 'catalogo' }" class="producto-vista__enlace-volver">
        ← Volver al catálogo
      </RouterLink>
    </nav>

    <!-- Estados -->
    <EstadoCarga v-if="cargando" texto="Cargando información de la pieza…" />

    <MensajeError
      v-else-if="error"
      :error="error"
      reintentable
      @reintentar="cargarProducto"
    />

    <article v-else-if="producto" class="producto-vista__contenido">
      <!-- Columna izquierda: Galería de imágenes -->
      <section class="galeria" aria-label="Fotografías de la pieza">
        <div class="galeria__principal">
          <img
            v-if="imagenPrincipalUrl"
            :src="imagenPrincipalUrl"
            :alt="producto.nombre"
            class="galeria__imagen-grande"
          />
          <div v-else class="galeria__sin-foto">Foto no disponible</div>
          <EtiquetaVenta :modo="producto.modo_venta" class="galeria__etiqueta" />
        </div>

        <!-- Miniaturas si hay más de una foto -->
        <div v-if="producto.imagenes.length > 1" class="galeria__tiras">
          <button
            v-for="(img, idx) in producto.imagenes"
            :key="img.id"
            type="button"
            class="galeria__miniatura"
            :class="{ 'galeria__miniatura--activa': idx === imagenActivaIndex }"
            :aria-label="`Ver fotografía ${idx + 1}`"
            @click="imagenActivaIndex = idx"
          >
            <img :src="img.url" :alt="`Foto ${idx + 1} de ${producto.nombre}`" />
          </button>
        </div>
      </section>

      <!-- Columna derecha: Detalles comerciales y compra -->
      <section class="detalle-info" aria-label="Detalles y compra de la pieza">
        <!-- Encabezado del producto -->
        <div class="detalle-info__cabecera">
          <div class="detalle-info__origen-taller">
            <RouterLink
              :to="{ name: 'taller', params: { id: producto.productor.id } }"
              class="detalle-info__taller-enlace"
            >
              {{ producto.productor.nombre_taller }}
            </RouterLink>
            <span class="detalle-info__separador">·</span>
            <span class="detalle-info__comunidad">
              {{ producto.comunidad.nombre }}, {{ producto.comunidad.region }}
            </span>
          </div>

          <h1 class="detalle-info__titulo">{{ producto.nombre }}</h1>

          <div class="detalle-info__precio-bloque">
            <p class="detalle-info__precio">
              <span v-if="producto.modo_venta === 'tratar'" class="detalle-info__precio-desde">
                Desde
              </span>
              {{ formatearPrecio(producto.precio) }}
            </p>
            <p v-if="producto.modo_venta === 'fijo'" class="detalle-info__stock">
              <template v-if="producto.stock && producto.stock > 0">
                {{ producto.stock }} disponible(s) en taller
              </template>
              <template v-else>
                Agotado temporalmente
              </template>
            </p>
          </div>
        </div>

        <!-- Acciones comerciales (Regla estricta: un solo botón principal) -->
        <div class="detalle-info__acciones">
          <!-- CASO 1: PRECIO FIJO -->
          <template v-if="producto.modo_venta === 'fijo'">
            <div class="selector-cantidad" aria-label="Cantidad de piezas">
              <button
                type="button"
                class="selector-cantidad__btn"
                :disabled="cantidad <= 1"
                aria-label="Disminuir cantidad"
                @click="cambiarCantidad(-1)"
              >
                −
              </button>
              <span class="selector-cantidad__valor" aria-live="polite">{{ cantidad }}</span>
              <button
                type="button"
                class="selector-cantidad__btn"
                :disabled="cantidad >= stockMaximo"
                aria-label="Aumentar cantidad"
                @click="cambiarCantidad(1)"
              >
                +
              </button>
            </div>

            <!-- Botón rojo exclusivo para comprar/agregar -->
            <BotonBase
              variante="comprar"
              grande
              :disabled="producto.stock === 0"
              @click="agregarAlCarrito"
            >
              Agregar al carrito
            </BotonBase>

            <!-- Mensaje de error devuelto por el carrito -->
            <div v-if="errorCarrito" class="alerta-carrito alerta-carrito--error" role="alert">
              {{ errorCarrito }}
            </div>

            <!-- Mensaje de confirmación -->
            <div
              v-if="mensajeExitoCarrito"
              class="alerta-carrito alerta-carrito--exito"
              role="status"
            >
              {{ mensajeExitoCarrito }}
            </div>

            <!-- Link chico para dudas por WhatsApp -->
            <div class="detalle-info__dudas">
              <button
                type="button"
                class="detalle-info__link-dudas"
                :disabled="enviandoConsulta"
                @click="registrarYConsultarWhatsApp('link_dudas')"
              >
                ¿Dudas? Pregúntale a {{ producto.productor.artesano }} por WhatsApp
              </button>
            </div>
          </template>

          <!-- CASO 2: PRECIO A TRATAR -->
          <template v-else>
            <!-- Botón verde exclusivo para WhatsApp -->
            <BotonBase
              variante="whatsapp"
              grande
              :cargando="enviandoConsulta"
              @click="registrarYConsultarWhatsApp('boton_tratar')"
            >
              Consultar por WhatsApp
            </BotonBase>

            <p class="detalle-info__nota-tratar">
              Esta pieza se elabora por encargo o a la medida. Contacta directamente al
              taller para acordar acabados, tiempo y precio.
            </p>
          </template>
        </div>

        <!-- Descripción de la pieza -->
        <div v-if="producto.descripcion" class="detalle-info__seccion">
          <h2 class="detalle-info__subtitulo">Sobre esta pieza</h2>
          <p class="detalle-info__descripcion">{{ producto.descripcion }}</p>
        </div>

        <!-- Ficha técnica -->
        <div class="detalle-info__seccion">
          <h2 class="detalle-info__subtitulo">Ficha técnica</h2>
          <dl class="ficha-tecnica">
            <div v-if="producto.categoria?.nombre" class="ficha-tecnica__fila">
              <dt class="ficha-tecnica__termino">Rama artesanal</dt>
              <dd class="ficha-tecnica__definicion">{{ producto.categoria.nombre }}</dd>
            </div>

            <div v-if="producto.material" class="ficha-tecnica__fila">
              <dt class="ficha-tecnica__termino">Materiales</dt>
              <dd class="ficha-tecnica__definicion">{{ producto.material }}</dd>
            </div>

            <div v-if="producto.tecnica" class="ficha-tecnica__fila">
              <dt class="ficha-tecnica__termino">Técnica</dt>
              <dd class="ficha-tecnica__definicion">{{ producto.tecnica }}</dd>
            </div>

            <div
              v-if="producto.medidas_cm && (producto.medidas_cm.alto || producto.medidas_cm.ancho || producto.medidas_cm.largo)"
              class="ficha-tecnica__fila"
            >
              <dt class="ficha-tecnica__termino">Dimensiones</dt>
              <dd class="ficha-tecnica__definicion">
                {{ producto.medidas_cm.alto ?? '—' }} × {{ producto.medidas_cm.ancho ?? '—' }} ×
                {{ producto.medidas_cm.largo ?? '—' }} cm
              </dd>
            </div>

            <div v-if="producto.peso_g" class="ficha-tecnica__fila">
              <dt class="ficha-tecnica__termino">Peso estimado</dt>
              <dd class="ficha-tecnica__definicion">{{ producto.peso_g }} g</dd>
            </div>
          </dl>
        </div>

        <!-- Perfil resumen del taller -->
        <div class="detalle-info__taller-tarjeta">
          <div class="detalle-info__taller-avatar">
            <img
              v-if="producto.productor.foto_url"
              :src="producto.productor.foto_url"
              :alt="producto.productor.artesano"
            />
            <span v-else class="detalle-info__taller-inicial">
              {{ producto.productor.artesano.charAt(0) }}
            </span>
          </div>

          <div class="detalle-info__taller-cuerpo">
            <h3 class="detalle-info__taller-nombre">{{ producto.productor.nombre_taller }}</h3>
            <p class="detalle-info__taller-artesano">
              Maestro(a): {{ producto.productor.artesano }}
            </p>
            <p v-if="producto.productor.biografia" class="detalle-info__taller-bio">
              {{ producto.productor.biografia }}
            </p>
            <RouterLink
              :to="{ name: 'taller', params: { id: producto.productor.id } }"
              class="detalle-info__taller-link"
            >
              Conoce la historia del taller →
            </RouterLink>
          </div>
        </div>
      </section>
    </article>
  </div>
</template>

<style scoped>
.producto-vista {
  padding-block: var(--space-5) var(--space-7);
}

.producto-vista__volver {
  margin-bottom: var(--space-5);
}

.producto-vista__enlace-volver {
  display: inline-flex;
  align-items: center;
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  text-decoration: none;
  font-weight: 500;
}

.producto-vista__enlace-volver:hover {
  color: var(--color-primario);
}

.producto-vista__contenido {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-7);
  align-items: start;
}

/* Galería */
.galeria {
  position: sticky;
  top: calc(var(--alto-control) + var(--space-6));
}

.galeria__principal {
  position: relative;
  aspect-ratio: 1 / 1;
  background: var(--color-suave);
  border-radius: var(--radius-foto);
  overflow: hidden;
  border: 1px solid var(--color-linea);
}

.galeria__imagen-grande {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.galeria__sin-foto {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}

.galeria__etiqueta {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  z-index: 2;
}

.galeria__tiras {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  overflow-x: auto;
  padding-bottom: var(--space-1);
}

.galeria__miniatura {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: var(--radius-control);
  overflow: hidden;
  border: 2px solid transparent;
  padding: 0;
  background: var(--color-suave);
  cursor: pointer;
}

.galeria__miniatura--activa {
  border-color: var(--color-primario);
}

.galeria__miniatura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Detalle Info */
.detalle-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.detalle-info__origen-taller {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--texto-sm);
  margin-bottom: var(--space-2);
  flex-wrap: wrap;
}

.detalle-info__taller-enlace {
  color: var(--color-primario);
  font-weight: 600;
  text-decoration: none;
}

.detalle-info__taller-enlace:hover {
  text-decoration: underline;
}

.detalle-info__separador {
  color: var(--color-linea);
}

.detalle-info__comunidad {
  color: var(--color-texto-secundario);
}

.detalle-info__titulo {
  font-size: var(--texto-3xl);
  line-height: 1.12;
  color: var(--color-texto);
  margin-bottom: var(--space-3);
}

.detalle-info__precio-bloque {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.detalle-info__precio {
  font-family: var(--font-titulos);
  font-size: var(--texto-2xl);
  font-weight: 700;
  color: var(--color-texto);
}

.detalle-info__precio-desde {
  font-size: var(--texto-base);
  font-weight: 500;
  color: var(--color-texto-secundario);
}

.detalle-info__stock {
  font-size: var(--texto-xs);
  color: var(--color-texto-secundario);
  font-weight: 500;
}

/* Acciones comerciales */
.detalle-info__acciones {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-superficie);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
}

.selector-cantidad {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-pildora);
  background: var(--color-fondo);
  padding: var(--space-1);
}

.selector-cantidad__btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  font-size: var(--texto-lg);
  color: var(--color-texto);
  cursor: pointer;
  border-radius: var(--radius-pildora);
}

.selector-cantidad__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.selector-cantidad__btn:not(:disabled):hover {
  background: var(--color-suave);
}

.selector-cantidad__valor {
  min-width: 40px;
  text-align: center;
  font-weight: 600;
  font-size: var(--texto-sm);
}

.alerta-carrito {
  padding: var(--space-3);
  border-radius: var(--radius-control);
  font-size: var(--texto-sm);
  font-weight: 500;
}

.alerta-carrito--error {
  background: var(--color-error-fondo);
  color: var(--color-error);
  border: 1px solid var(--color-error);
}

.alerta-carrito--exito {
  background: var(--color-suave);
  color: var(--color-whatsapp);
  border: 1px solid var(--color-whatsapp);
}

.detalle-info__dudas {
  margin-top: var(--space-1);
}

.detalle-info__link-dudas {
  background: transparent;
  border: none;
  padding: 0;
  font-size: var(--texto-xs);
  color: var(--color-texto-secundario);
  text-decoration: underline;
  cursor: pointer;
}

.detalle-info__link-dudas:hover {
  color: var(--color-whatsapp);
}

.detalle-info__nota-tratar {
  font-size: var(--texto-xs);
  color: var(--color-texto-secundario);
  line-height: 1.4;
}

/* Secciones informativas */
.detalle-info__seccion {
  border-top: 1px solid var(--color-linea);
  padding-top: var(--space-4);
}

.detalle-info__subtitulo {
  font-size: var(--texto-base);
  margin-bottom: var(--space-2);
  color: var(--color-texto);
}

.detalle-info__descripcion {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  line-height: 1.6;
}

/* Ficha técnica */
.ficha-tecnica {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ficha-tecnica__fila {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  font-size: var(--texto-sm);
  padding-block: var(--space-1);
  border-bottom: 1px dashed var(--color-linea);
}

.ficha-tecnica__termino {
  color: var(--color-texto-secundario);
}

.ficha-tecnica__definicion {
  font-weight: 600;
  color: var(--color-texto);
  text-align: right;
}

/* Tarjeta del taller */
.detalle-info__taller-tarjeta {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-control);
  background: var(--color-suave);
  border: 1px solid var(--color-linea);
  align-items: flex-start;
}

.detalle-info__taller-avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-pildora);
  overflow: hidden;
  background: var(--color-etiqueta-fondo);
  flex-shrink: 0;
  display: grid;
  place-items: center;
}

.detalle-info__taller-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detalle-info__taller-inicial {
  font-family: var(--font-titulos);
  font-size: var(--texto-xl);
  font-weight: 700;
  color: var(--color-etiqueta-texto);
}

.detalle-info__taller-cuerpo {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.detalle-info__taller-nombre {
  font-size: var(--texto-base);
  color: var(--color-texto);
}

.detalle-info__taller-artesano {
  font-size: var(--texto-xs);
  color: var(--color-texto-secundario);
}

.detalle-info__taller-bio {
  font-size: var(--texto-xs);
  color: var(--color-texto);
  line-height: 1.4;
  margin-top: var(--space-1);
}

.detalle-info__taller-link {
  font-size: var(--texto-xs);
  font-weight: 600;
  color: var(--color-primario);
  text-decoration: none;
  margin-top: var(--space-2);
  align-self: flex-start;
}

.detalle-info__taller-link:hover {
  text-decoration: underline;
}

@media (max-width: 50rem) {
  .producto-vista__contenido {
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }

  .galeria {
    position: static;
  }

  .detalle-info__titulo {
    font-size: var(--texto-2xl);
  }
}
</style>
