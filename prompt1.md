Revisa la navegación horizontal de categorías del menú público en /m.

Actualmente aparece una barra de desplazamiento nativa debajo de las categorías. Esa barra se ve poco estética y debe reemplazarse por una solución visual más limpia.

Objetivo:

- Mantener las categorías en una fila horizontal.
- Mantener el desplazamiento táctil en móvil.
- Ocultar completamente el scrollbar nativo.
- No bloquear el desplazamiento con swipe.
- No cambiar la información ni el orden de categorías.

Implementa una navegación horizontal elegante:

1. Usa overflow-x-auto y touch scrolling.
2. Oculta el scrollbar en Chrome, Safari, Edge y Firefox.
3. Agrega una máscara o degradado sutil en los extremos cuando existan más categorías.
4. Agrega botones de flecha izquierda y derecha solo cuando sean necesarios.
5. Las flechas deben tener botones táctiles de mínimo 44 px.
6. Desactiva la flecha izquierda al inicio y la derecha al final.
7. Cuando se seleccione una categoría, desplázala suavemente al centro o a una posición visible.
8. No uses una barra visual gruesa.
9. Mantén la navegación accesible con teclado.
10. Agrega aria-labels claros a las flechas.
11. Verifica que la navegación funcione desde 320 px hasta iPad y escritorio.
12. No alteres el layout general ni la identidad visual del menú.

Usa una clase equivalente a:

```css
.scrollbar-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}
```
