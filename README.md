# Carlota Cafetería

Sitio web de Carlota Cafetería — café de especialidad, repostería artesanal y brunch.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack, Cache Components)
- [React 19](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- TypeScript

## Desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Scripts

| Comando         | Descripción                    |
| --------------- | ------------------------------ |
| `npm run dev`   | Servidor de desarrollo         |
| `npm run build` | Build de producción            |
| `npm start`     | Servidor de producción         |
| `npm run lint`  | ESLint                         |

## Registro de implementaciones

Cada implementación o cambio se anota aquí con fecha/hora, modelo de IA y resumen.

| Fecha y hora       | Modelo de IA        | Resumen                                                                 |
| ------------------ | ------------------- | ----------------------------------------------------------------------- |
| 2026-10-12 15:21 CST | Devin — SWE-2 High | Scaffold inicial (Next.js + Tailwind) y landing page: navbar, hero, menú, nosotros, horarios/contacto y footer. Commit inicial y remote a GitHub. |
| 2026-10-12 15:23 CST | Devin — SWE-2 High | README reescrito en español con descripción del proyecto, stack y scripts. Se agrega la sección "Registro de implementaciones" y la regla correspondiente en `AGENTS.md`. |
| 2026-10-12 16:19 CST | Devin — SWE-2 High | Redirección del proyecto a sistema interno tipo POS (prototipo mockeado, sin BD). Paleta vino/crema según logo "La Carlota". Login por rol (cookie mock: admin, caja, mesero, cocina), shell `/app` con sidebar filtrado por rol, y módulos: panel, pedidos, cocina (kanban), caja (cobro + ticket original/copia), delivery (registro manual Rappi/DiDi), menú (categorías y costo de elaboración), inventario y reportes. |
| 2026-10-12 16:42 CST | Devin — SWE-2 High | Login con código PIN de 4 dígitos por rol (validación mock). Los códigos de prueba se muestran en la pantalla de inicio de sesión. Definidos en `src/lib/roles.ts`. |
| 2026-10-12 18:27 CST | Devin — SWE-2 High | Mejoras de UI inspiradas en diseños de 21st.dev (sin consumir cuota): PIN segmentado de 4 cajas con auto-avance/backspace/pegar (`pin-input.tsx`), kanban de cocina con drag & drop entre columnas, búsqueda + filtro por app en tabla de delivery, buscador en tabla de menú. |
| 2026-10-17 08:30 CST | Gemini 3.8 Flash | FASE 1: Corrección funcional de arquitectura, roles y navegación. Consolidación de tres perfiles operativos (admin, caja, mesero) y desactivación de Cocina de login/navegación (/app/cocina redirige; lógica preservada en kitchen-board.tsx). Navegación táctil responsiva para iPad y móviles con drawer off-canvas. Protección de rutas en servidor por rol, redirección de mesero directo a pedidos, dashboard diferenciado para Admin vs Caja y permisos de consulta en Menú. |
| 2026-10-17 08:45 CST | Gemini 3.8 Flash | FASE 1 (Correcciones finales): Corrección de comprobantes con destino explícito: ORIGINAL (Cafetería), COPIA (Cliente) y COMANDA (Preparación - Barra/Cocina sin precios ni totales). Documentación y desacoplamiento proyectado de estados operativos vs financieros para Fase 2. Clarificación de etiquetas de estado para evitar confusión entre entrega y cobro. Inclusión de vista de comanda en OrdersBoard y ampliación de pedidos pendientes en CashierPanel. |
| 2026-10-17 08:55 CST | Gemini 3.8 Flash | Rediseño UI/UX Mobile-First para Mesero: Barra de navegación inferior móvil fija (Pedidos, + Nuevo pedido elevado, Menú) con safe-area insets para iOS. Rediseño integral de OrdersBoard para celular con lista en una columna, tarjetas compactas (folio, mesa, hora, responsable, resumen de productos), alerta visual de pedidos listos para servir, y botón táctil contextual (≥ 44px) de confirmación de entrega tras aviso físico. Flujo táctil guiado para nuevo pedido (mesa/llevar rápida, buscador, catálogo, selector de cantidades, modal de notas rápidas) sin requerir datos personales. Vistas modales responsivas para detalle de pedido y comanda sin precios. Optimizado para pantallas desde 320px hasta iPad y escritorio. |
| 2026-10-17 21:51 CST | Gemini 3.8 Flash | FASE 2: Integración del catálogo oficial `data/catalogo.json` mediante adaptador TypeScript reutilizable (`catalog-adapter.ts`). Reestructuración funcional del POS con modelo de Cuentas abiertas y Comandas (una cuenta, múltiples comandas, un saldo acumulado). Configuración de mesas 1 a 5 con detección de cuentas activas. Carrito móvil del mesero con selección obligatoria de variantes/tamaños y captura de precios de venta históricos. Simulación de impresión de comanda (éxito vs error sin duplicar comandas). Confirmaciones operativas exclusivas de Caja (Listo para entrega y Entregado al cliente). Solicitud y autorización de modificaciones en comanda. Cobro en Caja con validación estricta (bloqueo si hay comandas pendientes de entrega) y emisión de los 3 comprobantes (Comanda sin precios, Original cafetería, Copia cliente) con datos reales. Sincronización de estado compartido en memoria y localStorage. Corrección de moneda a formato MXN (`es-MX`). |
| 2026-10-21 23:10 CST | Gemini 3.8 Flash | Conexión con Menú Digital externo (`la-carlota-menu-digital.vercel.app/m`). Creación de constante centralizada `DIGITAL_MENU_URL` (`src/lib/config.ts`) y `.env.example`. Transformación de `/app/menu` en pantalla de acceso con acciones "Abrir menú digital" en pestaña nueva y "Copiar enlace", nota de publicación independiente y tarjeta de vista previa. Inclusión de accesos directos en sidebar de escritorio, drawer móvil y cabecera de pedidos de Mesero (`orders-board.tsx`) sin alterar pedidos activos ni requerir dependencias o tablas adicionales. Compilación `next build` exitosa. |
| 2026-10-24 13:10 CST | Gemini 3.8 Flash | ETAPA 1: Integración del catálogo y menú digital público (`/m`) dentro de `carlota_cafeteria`. Incorporación del módulo `src/modules/menu` (arquitectura hexagonal: domain, ports, application, infrastructure, ui) con fallback a `datos/menu-inicial.json` en modo demo sin variables de entorno. Creación de ruta pública `/m` con sub-layout aislado (`Pacifico` y `Poppins`) y endpoint anónimo `/api/menu/visits`. Adaptación a Next.js 16 (Cache Components) y Tailwind CSS v4 (`@theme` con tokens oficiales `carlota-*`). Precios verificados en pesos mexicanos (`MXN`, `es-MX`). Preservación total del flujo operativo interno del POS (`/login`, `/app`, `/app/pedidos`, `/app/caja`, `/app/menu`). Compilación exitosa con 0 errores y ESLint limpio. |


