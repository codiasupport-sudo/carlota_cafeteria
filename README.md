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
