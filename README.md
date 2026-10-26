# Tabla Periódica Interactiva

Aplicación educativa de escritorio (Electron + React + TypeScript + Vite) para aprender la ubicación de los elementos químicos. El usuario completa una tabla periódica vacía arrastrando fichas desde un mostrador animado; cada ficha se puede estudiar en una tarjeta que se voltea y muestra la estructura atómica del elemento.

- **88 elementos jugables**: se excluyen por completo los lantánidos (57–71) y los actínidos (89–103).
- Tabla de **18 grupos × 7 períodos** con la distribución real; las posiciones del grupo 3 en los períodos 6 y 7 (reservadas a las series f) quedan vacías.
- Interfaz completamente en español. Las fichas del mostrador, las casillas ya colocadas y la cara frontal de la tarjeta muestran el símbolo químico y el nombre.

Las decisiones científicas (isótopos de referencia, reparto de electrones, distribución) y la tabla completa de datos están en [docs/DATOS-CIENTIFICOS.md](docs/DATOS-CIENTIFICOS.md).

## Cómo se juega

1. Las fichas avanzan de derecha a izquierda por el mostrador inferior. Se puede detener y reanudar con el botón **Detener / Reanudar** del propio carrusel (o con el de la barra superior), y desplazar con las flechas ‹ › o con la rueda del ratón. **Mantener pulsado** el mostrador (con el ratón o el dedo) lo detiene; **arrastrando en horizontal** se mueve a voluntad, y al soltar sigue avanzando.
2. **Buscador** (barra superior): escribe el nombre o el símbolo (sin importar tildes ni mayúsculas, p. ej. `oxigeno` o `Fe`) y elige el resultado con un clic o con `↑` `↓` e `Intro`. El elemento sale del carrusel y queda en el soporte de selección, listo para arrastrarlo a su casilla o colocarlo con **Colocar**. Los ya colocados aparecen como «Colocado» y no se pueden elegir.
3. Al hacer clic en una ficha, esta sale del mostrador (queda en el soporte de la izquierda) y se abre su tarjeta. **Voltear tarjeta** muestra el núcleo (protones y neutrones), los electrones por niveles de energía y los recuentos de protones, neutrones y electrones.
4. Al cerrar la tarjeta (botón **Cerrar** o **Escape**), la ficha sigue seleccionada. Se puede:
   - arrastrarla hasta una casilla (ratón, pantalla táctil o lápiz), o
   - (también directamente desde el mostrador, sin seleccionarla antes: el gesto debe empezar **hacia arriba**; un gesto horizontal mueve el mostrador), o
   - hacer clic en una casilla, o
   - pulsar **Colocar** y elegir la casilla con las flechas e **Intro**.
5. Acierto: la ficha se coloca, muestra su símbolo y su nombre y desaparece del mostrador. Error: la ficha vuelve al mostrador sin revelar la casilla correcta. Las casillas ocupadas rechazan nuevas fichas.
6. Al colocar los 88 elementos, el mostrador se detiene y aparece la pantalla de felicitación.

El progreso se guarda automáticamente; al abrir la aplicación se ofrece **Continuar partida**. **Reiniciar** pide confirmación antes de borrar el progreso.

### Teclado y accesibilidad

| Contexto | Teclas |
| --- | --- |
| Mostrador | `Tab` para entrar, `←` `→` para recorrer fichas (la cinta se detiene mientras una ficha tiene el foco del teclado), `Intro` para abrir la tarjeta |
| Tarjeta | `Tab` recorre los botones (el foco queda atrapado dentro), `Escape` cierra y devuelve el foco a la ficha seleccionada |
| Modo de colocación | `←` `↑` `→` `↓` entre casillas (salta huecos), `Inicio`/`Fin`, `Intro` coloca, `Escape` cancela |

Con la preferencia del sistema de **movimiento reducido**, el mostrador empieza en pausa y se suprimen las animaciones de volteo, órbitas y transiciones. Los mensajes de acierto o error se anuncian a los lectores de pantalla.

## Requisitos

- Node.js 20.19 o superior (probado con Node 24.22 y npm 11.19).
- Windows, macOS o Linux.

## Comandos

| Acción | Comando |
| --- | --- |
| Instalar dependencias | `npm install` |
| Desarrollo (Vite + ventana de Electron con recarga en caliente) | `npm run dev` |
| Solo la interfaz en el servidor de Vite (navegador, sin Electron) | `npm run dev:web` |
| Compilar React y TypeScript (renderer en `dist/`, Electron en `dist-electron/`) | `npm run build` |
| Compilar y abrir la aplicación de escritorio | `npm start` |
| Abrir la aplicación ya compilada | `npm run electron` |
| Comprobación de tipos | `npm run typecheck` |
| Pruebas unitarias e interfaz (Vitest) | `npm test` |
| Pruebas de extremo a extremo sobre Electron (Playwright) | `npm run test:e2e` |
| Todas las pruebas | `npm run test:all` |
| Empaquetar sin instalador (carpeta `release/<plataforma>-unpacked`) | `npm run pack` |
| Instaladores para la plataforma actual | `npm run dist` |
| Instaladores de Windows (NSIS + portable) | `npm run dist:win` |
| Instalador de macOS (DMG) | `npm run dist:mac` |
| Instaladores de Linux (AppImage + deb) | `npm run dist:linux` |
| Regenerar el icono provisional `build/icon.png` | `npm run icons` |

> **Nota:** algunos terminales (p. ej. el integrado de VS Code) definen `ELECTRON_RUN_AS_NODE=1`, lo que haría arrancar Electron como Node. Los scripts usan `scripts/run-electron.mjs`, que elimina esa variable antes de lanzar Electron.

### Nombre del producto

El nombre visible se define en un solo lugar: el campo **`productName`** de `package.json`. Lo usan electron-builder (nombre del ejecutable e instaladores), el proceso principal (`app.getName()`) y el título de la ventana (inyectado en el renderer por Vite como `__PRODUCT_NAME__`).

## Versión web (GitHub Pages)

El juego también funciona en el navegador: **https://luis25xo.github.io/tabla-periodica/**

- Cada `push` a la rama `main` ejecuta el workflow [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml): comprueba los tipos, pasa las pruebas unitarias, compila la web (`npm run build:renderer`) y la publica en GitHub Pages. También se puede lanzar a mano desde la pestaña *Actions*.
- Para probar la versión web en local: `npm run build:renderer` y `npx vite preview` (http://localhost:4173). No se puede abrir `dist/index.html` con doble clic, porque los navegadores bloquean los módulos JavaScript cargados desde archivos locales.
- En el navegador el progreso se guarda en el `localStorage` del sitio, separado del de la aplicación de escritorio.

## Instaladores

Los instaladores se generan en `release/`. electron-builder necesita conexión a Internet **durante la compilación** para descargar Electron y las herramientas de empaquetado; la aplicación instalada funciona sin conexión.

| Plataforma | Comando | Dónde compilar | Estado en este proyecto |
| --- | --- | --- | --- |
| Windows | `npm run dist:win` | Windows (o Linux/macOS con Wine) | **Generado y verificado** en Windows 10: `Tabla Periódica Interactiva-Setup-1.0.0.exe` (NSIS) y `-Portable-1.0.0.exe`. La versión desempaquetada se arrancó y probó desde `app.asar`. |
| macOS | `npm run dist:mac` | macOS (necesario para DMG y firma) | Configurado, **no compilado ni verificado** (no se disponía de macOS). |
| Linux | `npm run dist:linux` | Linux (o Docker `electronuserland/builder`) | Configurado, **no compilado ni verificado**. |

Los ejecutables no están firmados. Para distribuirlos sin advertencias del sistema hay que configurar un certificado (variables `CSC_LINK`/`CSC_KEY_PASSWORD` en Windows y macOS, y notarización en macOS). El icono `build/icon.png` (512×512) es provisional y se genera con `npm run icons`; electron-builder lo convierte a `.ico`/`.icns`.

## Arquitectura

```
electron/
  main.ts            Proceso principal: ventana, seguridad, IPC validado
  preload.ts         API mínima expuesta con contextBridge (window.desktop)
src/
  main.tsx           Punto de entrada de React
  App.tsx            Composición de la interfaz y conexión con el estado
  components/        PeriodicTable, ElementCell, ElementConveyor, ElementCard,
                     AtomVisualization, GameControls, ProgressIndicator,
                     CompletionScreen, SelectedTileHolder, StartScreen,
                     ConfirmDialog, Dialog, DragGhost, FeedbackToast
  data/              elements.ts (88 elementos) y types.ts
  hooks/             useGame (estado + persistencia), useDragAndDrop (Pointer Events),
                     useFocusTrap, useReducedMotion
  state/             gameReducer.ts: reductor puro con todo el estado de la partida
  utils/             periodicTable (cuadrícula y coordenadas), validation, conveyorModel
                     (simulación del mostrador), electronConfiguration, atomLayout,
                     nameLayout, persistence, shuffle
  styles/            global, table, conveyor, card y dialogs
tests/
  unit/              Vitest + Testing Library (jsdom)
  e2e/               Playwright sobre la aplicación Electron real
scripts/             generate-icon.mjs, run-electron.mjs
docs/                DATOS-CIENTIFICOS.md
```

### Decisiones técnicas

- **Estado centralizado**: `gameReducer` es una función pura que registra el orden de las fichas, las colocadas (registro de aciertos), la seleccionada, la que se arrastra, la tarjeta, el modo de colocación, los errores, la pausa y la fase. Las fichas disponibles, las casillas ocupadas y el progreso se derivan, por lo que no pueden quedar incoherentes ni duplicarse.
- **Mostrador**: `ConveyorModel` simula una cinta circular en la que cada ficha existe una sola vez. Un bucle `requestAnimationFrame` actualiza solo `transform: translate3d(...)` de cada ficha, sin volver a renderizar los componentes de React (las 88 fichas están memorizadas). Las fichas que salen por la izquierda reaparecen por la derecha fuera de la vista; al retirar una ficha, el hueco se cierra suavemente.
- **Pulsar y mover el mostrador**: al pulsar sobre la cinta se detiene; si el movimiento inicial es claramente horizontal (|dx| > 1,5·|dy|), la cinta sigue al puntero (`ConveyorModel.dragBy`) y el clic final no abre ninguna tarjeta; en caso contrario la ficha sale hacia la tabla.
- **Arrastrar y soltar**: implementado con Pointer Events (ratón, táctil y lápiz). La ficha arrastrada sale del movimiento de la cinta y la sigue un "fantasma"; el destino se detecta con `elementFromPoint` y se valida con la misma función que el clic y el teclado.
- **Seguridad de Electron**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, sin `webview`; navegación y ventanas nuevas bloqueadas; todos los permisos denegados; peticiones de red externas canceladas; CSP estricta en la versión compilada; un único canal IPC (`app:get-info`) que valida el remitente; DevTools solo en desarrollo.
- **Sin conexión**: todo (incluida la fuente Inter) se empaqueta localmente.

## Pruebas

- `npm test`: 68 pruebas (datos, cuadrícula, validación, reductor, mostrador, persistencia, modelo atómico, ajuste de nombres e interfaz completa con Testing Library, incluida una partida completa de 88 elementos).
- `npm run test:e2e`: 10 pruebas con Playwright sobre Electron: buscador y botón de detener del carrusel, fichas con símbolo y nombre, detener y mover el mostrador manteniéndolo pulsado, arranque en producción y en desarrollo, ausencia de errores de consola, seguridad (sandbox, sin `require`/`process`, API mínima), recursos y fuentes, funcionamiento sin red, movimiento de derecha a izquierda, pausas repetidas, orden aleatorio, tarjeta 3D, arrastre real con ratón (acierto, error, ocupada), partida completa por teclado y continuación de una partida guardada.
