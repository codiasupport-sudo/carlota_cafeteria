# CODIA — Auditoría funcional y técnica de Cafetería Carlota

Actúa como arquitecto de software, analista de procesos, desarrollador senior Next.js/TypeScript y especialista en QA.

## Objetivo

Revisar íntegramente el repositorio `codiasupport-sudo/carlota_cafeteria` y determinar si la implementación actual corresponde al flujo operativo aprobado para Cafetería Carlota.

**Primera etapa: exclusivamente auditoría. No modificar archivos, dependencias, base de datos, ramas ni configuraciones.**

## Contexto aprobado

- Sistema web para iPad y celular.
- Roles: Administrador, Caja y Mesero.
- Cocina y barra no utilizan pantallas ni inician sesión.
- Los pedidos generan comandas impresas para preparación.
- Los pedidos pueden modificarse; identificar reglas pendientes.
- Estados operativos propuestos: Pendiente, Preparando, Listo y Entregado.
- Los estados de pago deben ser independientes de los estados de preparación.
- Métodos de pago: efectivo, tarjeta y transferencia.
- Al cobrar, se generan dos comprobantes: original para cafetería y copia para cliente.
- La integración física de impresoras todavía está pendiente.
- El sistema no debe exigir información personal del cliente para una venta ordinaria.
- El inventario debe contemplar ventas y consumo interno, según reglas por definir.
- Las integraciones externas de delivery no están aprobadas todavía.

## Actividades

### 1. Auditoría del repositorio
Inspeccionar `package.json`, `README.md`, rutas, componentes, tipos, mocks, permisos, módulos y cualquier integración existente.

Distinguir funcionalidades reales de interfaces simuladas.

### 2. Auditoría funcional
Reconstruir los flujos actuales de creación de pedidos, preparación, modificación, cancelación, cobro e impresión.

Identificar qué módulos y pantallas contradicen los requerimientos.

### 3. Análisis de roles
Revisar permisos de Administrador, Caja y Mesero. Identificar dónde existe acceso de Cocina y proponer su desactivación sin eliminar código prematuramente.

### 4. Análisis de impresión
Evaluar la arquitectura para generar comanda, original y copia desde una aplicación Next.js utilizada en Safari/iPad.

No asumir que hay impresoras adquiridas, API externa disponible o integración física funcional.

### 5. Matriz de trazabilidad
Construir una tabla con:

Requerimiento → Proceso → Rol → Archivo/componente → Estado actual → Diferencia detectada → Cambio propuesto → Prioridad.

### 6. Plan de implementación
Definir sprints ordenados por dependencias técnicas y operativas, con criterios de aceptación y pruebas.

## Entregables

1. Diagnóstico general del repositorio.
2. Inventario de módulos y componentes.
3. Tabla de contradicciones respecto a las cinco fases.
4. Matriz de trazabilidad.
5. Riesgos y decisiones pendientes.
6. Propuesta de arquitectura.
7. Backlog priorizado.
8. Recomendación del siguiente sprint.

## Restricciones

- No modificar código durante esta primera etapa.
- No realizar commits ni despliegues.
- No instalar dependencias.
- No eliminar componentes sin aprobación.
- No introducir integraciones o características no aprobadas.
- No afirmar que una funcionalidad está terminada solo porque existe su pantalla.

**Al finalizar, presentar el informe y esperar aprobación antes de implementar cualquier cambio.**