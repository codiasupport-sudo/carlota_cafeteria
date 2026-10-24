Parte 2: Implementar Etapa 2

Después de guardar la Etapa 1, transforma /app/menu en un panel administrativo del catálogo.

El panel debe permitir al usuario autorizado:

Ver categorías.

Crear categorías.

Editar categorías.

Ordenar categorías.

Ocultar categorías.

Ver productos.

Crear productos.

Editar productos.

Archivar productos.

Asignar categorías.

Crear precios únicos.

Crear precios por tamaño.

Editar precios.

Marcar productos disponibles o agotados.

Mostrar u ocultar productos del menú público.

Permisos

owner y admin: pueden administrar el catálogo.

cashier: puede consultar catálogo y disponibilidad.

waiter: solo consulta catálogo.

Cliente público: solo lectura de /m.

Cocina y Barra: sin login.

Respeta el sistema de roles existente y no reemplaces el login actual sin autorización.

Datos

Durante esta etapa:

Mantén el fallback JSON funcionando.

No borres datos/menu-inicial.json.

No borres los mocks del POS.

No conectes todavía ventas ni caja al catálogo.

No ejecutes migraciones productivas de Supabase sin mostrar primero el SQL y pedir aprobación.

Si Supabase no está configurado, el panel debe mostrar claramente que está en modo demo o impedir escrituras persistentes, pero no fingir que guardó datos en producción.

Precios

Todos los precios deben utilizar:

MXN
es-MX
numeric(10,2)

Mostrar ejemplos como:

$85.00
$1,250.50

No convertir precios mediante tipo de cambio.

Seguridad

No permitir que el cliente público escriba.

No exponer SUPABASE_SERVICE_ROLE_KEY.

No borrar físicamente productos con historial.

Usar archivado mediante archived_at.

Registrar cambios de precio.

Validar permisos en servidor.

Pruebas

Ejecuta:

npm run lint
npm run build

Prueba:

Crear categoría.

Editar categoría.

Crear producto.

Editar producto.

Cambiar precio.

Marcar producto agotado.

Ocultar producto.

Verificar actualización del menú público.

Confirmar que Mesero no edita.

Confirmar que el cliente solo consulta.

Confirmar funcionamiento móvil.

Al finalizar, entrega:

Archivos modificados.

Cambios implementados.

Pruebas realizadas.

Problemas encontrados.

Estado de persistencia.

SQL pendiente, si aplica.

No hagas un segundo commit ni push de la Etapa 2 hasta mostrar el resultado y recibir aprobación.
