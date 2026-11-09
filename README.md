# Cortinas roller a medida · Dilan Home

Cotizador online para clientes finales: cargan la medida de su ventana, eligen la tela y ven al instante el precio de su cortina roller, con una vista previa de cómo queda.

- Sitio estático (HTML + CSS + JS), sin servidor. Se publica con GitHub Pages.
- Precio al cliente: **costo del proveedor × 1,70** (efectivo / transferencia). **Precio de lista (cuotas)** = efectivo × 1,20. Ambos se redondean a $100. Los multiplicadores están en `config.js`.
- El pedido llega por WhatsApp (número en `config.js`).

## Archivos

| Archivo | Qué es |
| --- | --- |
| `index.html`, `style.css`, `app.js` | La web |
| `config.js` | Multiplicadores, WhatsApp, límites de medida |
| `data/telas.js` | Líneas y telas del proveedor (nombre, foto, ancho máximo, `k` = posición de precio de cada tela) |
| `data/precios.js` | Tabla de precios de costo por medida (relevada del cotizador del proveedor) |
| `img/t/` | Miniaturas de las telas (las que se ven en la lista) |
| `img/f/` | Texturas de las telas (las que se pintan sobre la cortina de la vista previa) |

## Cómo se calcula el costo

`costo = P0(ancho, alto) + k × D(ancho, alto)`

- `P0` es el costo de la tela más económica del proveedor (línea «Blackout vinílico premium», tela base) para esa medida.
- `D` es la diferencia de costo entre las dos telas de referencia (crece con el área de tela).
- `k` es la posición de precio de cada tela entre esas dos referencias (se midió con el cotizador del proveedor a 1 × 1 m).

Cuando el proveedor cambie su lista hay que volver a relevar `data/precios.js` y `k` en `data/telas.js`.

## Probar en la PC

```bash
python -m http.server 8000
```

y abrir http://localhost:8000
