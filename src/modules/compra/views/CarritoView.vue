<script setup lang="ts">
import { ref } from 'vue'
import { useCarritoStore } from '@/stores/carrito'
import { formatearPrecio } from '@/shared/utils/formato'
import BotonBase from '@/shared/components/BotonBase.vue'

const carrito = useCarritoStore()
const errorMensaje = ref('')

function cambiar(productoId: number, cantidad: number) {
  const resultado = carrito.cambiarCantidad(productoId, cantidad)
  if (!resultado.ok) {
    errorMensaje.value = resultado.error
    setTimeout(() => (errorMensaje.value = ''), 3000)
  }
}

function vaciar() {
  carrito.vaciar()
}
</script>

<template>
  <section class="carrito">
    <h1 class="carrito__titulo">Carrito</h1>

    <!-- Vacío -->
    <div v-if="carrito.items.length === 0" class="carrito__vacio">
      <p>Tu carrito está vacío.</p>
      <BotonBase :to="{ name: 'catalogo' }">Ver productos</BotonBase>
    </div>

    <!-- Con productos -->
    <template v-else>
      <p class="carrito__taller">
        Taller: <strong>{{ carrito.taller?.nombre_taller }}</strong>
      </p>

      <div
        v-if="errorMensaje"
        class="carrito__aviso"
        role="alert"
      >
        {{ errorMensaje }}
      </div>

      <ul class="carrito__lista">
        <li
          v-for="item in carrito.items"
          :key="item.producto_id"
          class="item"
        >
          <div class="item__imagen-contenedor">
            <img
              v-if="item.imagen"
              :src="item.imagen"
              :alt="item.nombre"
              class="item__imagen"
            />
            <div v-else class="item__sin-imagen">Sin foto</div>
          </div>

          <div class="item__info">
            <span class="item__nombre">{{ item.nombre }}</span>
            <span class="item__precio">{{ formatearPrecio(item.precio) }}</span>
          </div>

          <div class="item__controles">
            <button
              class="item__btn-cantidad"
              :disabled="item.cantidad <= 1"
              aria-label="Reducir cantidad"
              @click="cambiar(item.producto_id, item.cantidad - 1)"
            >
              &minus;
            </button>
            <span class="item__cantidad">{{ item.cantidad }}</span>
            <button
              class="item__btn-cantidad"
              :disabled="item.stock !== null && item.cantidad >= item.stock"
              aria-label="Aumentar cantidad"
              @click="cambiar(item.producto_id, item.cantidad + 1)"
            >
              +
            </button>
          </div>

          <span class="item__subtotal">
            {{ formatearPrecio(item.precio * item.cantidad) }}
          </span>

          <button
            class="item__quitar"
            aria-label="Quitar del carrito"
            @click="carrito.quitar(item.producto_id)"
          >
            &times;
          </button>
        </li>
      </ul>

      <div class="carrito__resumen">
        <div class="carrito__total">
          <span>Total</span>
          <strong>{{ formatearPrecio(carrito.total) }}</strong>
        </div>

        <div class="carrito__acciones">
          <BotonBase variante="secundario" @click="vaciar">
            Vaciar carrito
          </BotonBase>
          <BotonBase variante="comprar" grande :to="{ name: 'checkout' }">
            Ir a pagar ({{ carrito.cantidadTotal }}
            {{ carrito.cantidadTotal === 1 ? 'producto' : 'productos' }})
          </BotonBase>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.carrito {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-5) var(--margen-lateral);
}

.carrito__titulo {
  font-family: var(--font-titulos);
  font-size: var(--texto-xl);
  margin: 0 0 var(--space-4);
}

.carrito__taller {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  margin: 0 0 var(--space-4);
}

.carrito__aviso {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-control);
  background: var(--color-error-fondo);
  color: var(--color-error);
  font-size: var(--texto-sm);
  font-weight: 600;
  margin-bottom: var(--space-4);
}

/* Estado vacío */
.carrito__vacio {
  text-align: center;
  padding: var(--space-7) 0;
  color: var(--color-texto-secundario);
}

.carrito__vacio p {
  font-size: var(--texto-lg);
  margin: 0 0 var(--space-5);
}

/* Lista de items */
.carrito__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.item {
  display: grid;
  grid-template-columns: 64px 1fr auto auto auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-superficie);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
}

.item__imagen-contenedor {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-foto);
  overflow: hidden;
  flex-shrink: 0;
}

.item__imagen {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item__sin-imagen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-suave);
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
}

.item__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.item__nombre {
  font-family: var(--font-titulos);
  font-size: var(--texto-base);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item__precio {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
}

/* Controles de cantidad */
.item__controles {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.item__btn-cantidad {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-pildora);
  background: var(--color-superficie);
  color: var(--color-texto);
  font-size: var(--texto-lg);
  cursor: pointer;
  transition: background-color 0.15s;
}

.item__btn-cantidad:hover:not(:disabled) {
  background: var(--color-suave);
}

.item__btn-cantidad:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.item__cantidad {
  min-width: 24px;
  text-align: center;
  font-weight: 600;
  font-size: var(--texto-base);
}

.item__subtotal {
  font-family: var(--font-titulos);
  font-weight: 700;
  font-size: var(--texto-base);
  white-space: nowrap;
}

.item__quitar {
  background: none;
  border: none;
  color: var(--color-texto-secundario);
  font-size: var(--texto-xl);
  cursor: pointer;
  padding: var(--space-1);
  line-height: 1;
  transition: color 0.15s;
}

.item__quitar:hover {
  color: var(--color-error);
}

/* Resumen */
.carrito__resumen {
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-linea);
}

.carrito__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--texto-lg);
  margin-bottom: var(--space-5);
}

.carrito__total strong {
  font-family: var(--font-titulos);
  font-size: var(--texto-xl);
}

.carrito__acciones {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

/* Responsive */
@media (max-width: 40rem) {
  .item {
    grid-template-columns: 56px 1fr auto;
    grid-template-rows: auto auto;
  }

  .item__imagen-contenedor {
    width: 56px;
    height: 56px;
    grid-row: 1 / 3;
  }

  .item__info {
    grid-column: 2 / 3;
  }

  .item__quitar {
    grid-row: 1;
    grid-column: 3;
    justify-self: end;
  }

  .item__controles {
    grid-column: 2;
    grid-row: 2;
  }

  .item__subtotal {
    grid-column: 3;
    grid-row: 2;
    justify-self: end;
  }
}
</style>
