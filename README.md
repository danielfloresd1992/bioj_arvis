# BioJarvis - Sistema Biometrico de Control de Asistencia

Sistema de control de entrada y salida de personal con reconocimiento facial progresivo mediante aprendizaje automatico en el navegador. El procesamiento ML corre en un **Web Worker** (hilo separado) para mantener la interfaz fluida.

---

## Tabla de contenidos

- [Descripcion general](#descripcion-general)
- [Stack tecnologico](#stack-tecnologico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujo general de la aplicacion](#flujo-general-de-la-aplicacion)
- [Modulo de reconocimiento facial (ML)](#modulo-de-reconocimiento-facial-ml)
- [Arquitectura del Web Worker](#arquitectura-del-web-worker)
- [Overlay de deteccion facial](#overlay-de-deteccion-facial)
- [Endpoints de la API](#endpoints-de-la-api)
- [Instalacion y ejecucion](#instalacion-y-ejecucion)
- [Configuracion](#configuracion)
- [Despliegue movil](#despliegue-movil)

---

## Descripcion general

BioJarvis es una aplicacion frontend (SPA) que permite a los empleados registrar su asistencia (entrada/salida) mediante un terminal con camara. El usuario ingresa su numero de cedula en un teclado numerico, la camara captura una foto y los datos se envian a la API backend (JARVIS).

Adicionalmente, el sistema integra **reconocimiento facial progresivo**: cada vez que un usuario registra su asistencia exitosamente, el sistema aprende su rostro. Con el tiempo, la aplicacion es capaz de reconocer automaticamente a la persona frente a la camara, dibujar un cuadro sobre su rostro con su identidad, y sugerir su cedula sin necesidad de escribirla.

---

## Stack tecnologico

| Tecnologia | Uso |
|---|---|
| React 19 | Framework de UI |
| Vite 7 | Bundler y servidor de desarrollo |
| Tailwind CSS 4 | Estilos utilitarios |
| MUI Material 7 | Componentes UI complementarios |
| Axios | Cliente HTTP (web) |
| Capacitor | Empaquetado nativo Android/iOS |
| cordova-plugin-advanced-http | Peticiones HTTP nativas (evita CORS) |
| face-api.js | Reconocimiento facial basado en TensorFlow.js |
| Web Worker | Hilo separado para inferencia ML sin bloquear UI |
| IndexedDB | Almacenamiento local de descriptores faciales |

---

## Estructura del proyecto

```
src/
├── App.jsx                        # Componente raiz - orquesta todo el flujo
├── App.css                        # Estilos globales
├── index.css                      # Tailwind + animaciones CSS
│
├── components/
│   ├── Header.jsx                 # Barra superior con logo BioJarvis
│   ├── date.jsx                   # Reloj en tiempo real
│   ├── InputCustom.jsx            # Campo de entrada de cedula (solo lectura visual)
│   ├── keypad.jsx                 # Teclado numerico tactil (0-9, borrar, enter)
│   ├── cameraBox.jsx              # Captura de camara + overlay de deteccion facial
│   ├── Section_data_user.jsx      # Panel de datos del usuario registrado
│   ├── Dialog.jsx                 # Dialogos modales (exito, error, advertencia)
│   └── ScreenSaver.jsx            # Protector de pantalla animado (inactividad)
│
├── network/
│   ├── agent.index.js             # Agente HTTP multiplataforma (web/nativo)
│   ├── user.js                    # Llamadas a la API de asistencia
│   └── multimedia.js              # Subida de imagenes al servidor
│
├── libs/
│   ├── audio_content.js           # Efectos de sonido (click, exito)
│   ├── faceRecognition.js         # Wrapper liviano - comunica con el Web Worker
│   ├── faceWorker.js              # Web Worker - inferencia ML en hilo separado
│   └── file.js                    # Utilidad base64 (no utilizada actualmente)
│
public/
├── models/                        # Modelos pre-entrenados de face-api.js
│   ├── tiny_face_detector_model-* # Deteccion rapida de rostros (~190 KB)
│   ├── face_landmark_68_model-*   # Puntos de referencia faciales (~357 KB)
│   └── face_recognition_model-*   # Generacion de descriptores (~6.4 MB)
├── touch.ogg                      # Sonido de click
├── successful.ogg                 # Sonido de exito
└── *.png                          # Iconos de la interfaz
```

---

## Flujo general de la aplicacion

### Diagrama de estados

```
┌─────────────────────────────────────────────────────────────┐
│                    1. ESTADO INACTIVO                        │
│                                                             │
│   - Protector de pantalla activo (animacion aleatoria)      │
│   - Camara apagada                                          │
│   - Modelos de ML cargandose en Web Worker                  │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Usuario toca una tecla
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  2. ESTADO DE ENTRADA                        │
│                                                             │
│   - Protector de pantalla se oculta                         │
│   - Camara se enciende automaticamente                      │
│   - Timer de inactividad inicia (5 minutos)                 │
│   - Escaneo facial periodico activo (cada 1.5s)             │
│   - Cuadro de deteccion sobre el rostro en la camara        │
│   - Usuario escribe su cedula en el teclado numerico        │
│                                                             │
│   ┌─────────────────────────────────────────┐               │
│   │  Overlay en la camara:                  │               │
│   │  → Cuadro gris: "Rostro no reconocido"  │               │
│   │  → Cuadro verde: "CI: 24939156 (87%)"   │               │
│   │                                         │               │
│   │  Si el ML reconoce el rostro:           │               │
│   │  → Aparece boton verde con sugerencia   │               │
│   │  → Usuario puede aceptar o ignorar      │               │
│   └─────────────────────────────────────────┘               │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Usuario presiona Enter
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   3. CAPTURA Y ENVIO                         │
│                                                             │
│   a) Se captura frame del video → canvas (640x480 JPEG)    │
│   b) Imagen se convierte a base64 (preview) + File (envio) │
│   c) POST imagen → /api_jarvis/v1/multimedia                │
│   d) POST cedula + URL imagen → /user/attendance/machine/   │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┴────────────────┐
          ▼                             ▼
   ┌──────────────┐             ┌───────────────┐
   │   EXITO      │             │    ERROR       │
   │              │             │                │
   │ - Datos del  │             │ - 404: Usuario │
   │   usuario    │             │   no encontrado│
   │   mostrados  │             │ - 400: Datos   │
   │ - Foto de    │             │   invalidos    │
   │   camara y   │             │ - 409: Registro│
   │   foto de    │             │   duplicado    │
   │   usuario    │             │ - 5xx: Error   │
   │   visibles   │             │   del servidor │
   │ - Sonido de  │             │                │
   │   exito      │             │                │
   │ - Descriptor │             │                │
   │   facial     │             │                │
   │   guardado   │             │                │
   │   (ML)       │             │                │
   └──────┬───────┘             └───────┬────────┘
          │                             │
          ▼                             ▼
   ┌──────────────┐             ┌───────────────┐
   │ Al cerrar    │             │ Al cerrar     │
   │ dialogo:     │             │ dialogo:      │
   │ solo limpia  │             │ reset total   │
   │ cedula,      │             │ (cedula,      │
   │ datos y foto │             │  datos, foto) │
   │ persisten    │             │               │
   └──────┬───────┘             └───────┬───────┘
          │                             │
          └──────────┬──────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Datos visibles hasta │
          │ que el usuario       │
          │ escriba nueva cedula │
          │ o se active el idle  │
          │ timer (5 min)        │
          └──────────────────────┘
```

### Flujo detallado paso a paso

1. **Inicio de la app**: Se lanza un Web Worker que carga los modelos de reconocimiento facial (~7 MB total) en un hilo separado. La interfaz no se congela durante la carga. Muestra el protector de pantalla con animaciones aleatorias (matrix, orbitas, ondas, respiracion).

2. **Activacion**: Cuando el usuario toca cualquier tecla, el protector de pantalla desaparece, la camara frontal se enciende y comienza un timer de inactividad de 5 minutos.

3. **Ingreso de cedula**: El usuario escribe su numero de cedula usando el teclado numerico en pantalla (o un teclado fisico). Cada tecla reproduce un sonido de click.

4. **Deteccion facial en tiempo real**: Mientras la camara esta activa, cada 1.5 segundos el main thread captura un frame del video como `ImageBitmap` y lo transfiere al Web Worker (zero-copy). El Worker ejecuta la deteccion, extrae el descriptor y busca coincidencia en IndexedDB. Los resultados se devuelven al main thread, que dibuja un cuadro sobre el rostro en un canvas overlay:
   - **Cuadro gris** con etiqueta "Rostro no reconocido" si la persona aun no tiene suficientes muestras
   - **Cuadro verde** con etiqueta "CI: 24939156 (87%)" si el sistema la reconoce
   - Si el campo de cedula esta vacio y hay coincidencia, aparece un boton de sugerencia debajo del input

5. **Envio**: Al presionar Enter, se captura el frame actual de la camara, se sube la imagen al servidor multimedia y se envia la cedula junto con la URL de la imagen a la API de asistencia.

6. **Resultado**: Se muestra un dialogo con el resultado (exito, error o advertencia). En caso de exito:
   - Se muestran la foto capturada y los datos del usuario en el panel inferior
   - El sistema guarda el descriptor facial en el Worker para futuras detecciones
   - Al cerrar el dialogo, solo se limpia la cedula; la foto y datos **persisten** visibles
   - Los datos se limpian cuando el usuario empieza a escribir una nueva cedula o el idle timer se activa

7. **Reset en error**: Al cerrar un dialogo de error, se realiza un reset completo (cedula, datos y foto se limpian).

---

## Modulo de reconocimiento facial (ML)

### Pipeline de redes neuronales

El reconocimiento facial se ejecuta **completamente en el navegador** usando `face-api.js` (TensorFlow.js) dentro de un Web Worker. No requiere backend adicional ni conexion a internet para el procesamiento ML.

```
                    face-api.js (TensorFlow.js) — en Web Worker
                    ┌─────────────────────────────────────┐
                    │                                     │
  ImageBitmap ────→ │  1. TinyFaceDetector                │
  (del video)       │     Detecta rostros en la imagen     │
                    │     (190 KB, ~10x mas rapido que     │
                    │      SSD MobileNet)                  │
                    │                                     │
                    │  2. Face Landmark 68                 │
                    │     Identifica 68 puntos de          │
                    │     referencia del rostro             │
                    │                                     │
                    │  3. Face Recognition Net             │
                    │     Genera descriptor (vector         │──→ Float32Array[128]
                    │     de 128 numeros que                │    (huella facial unica)
                    │     representa el rostro)            │
                    │                                     │
                    └─────────────────────────────────────┘
```

### Almacenamiento: IndexedDB

Los descriptores faciales se almacenan en el navegador usando **IndexedDB**, una base de datos NoSQL integrada en todos los navegadores modernos. IndexedDB es accesible tanto desde el main thread como desde el Web Worker.

```
Base de datos: biojarvis_faces
└── Object Store: descriptors
    ├── { dni: "24939156", descriptors: [Float32[128], Float32[128], ...] }
    ├── { dni: "12345678", descriptors: [Float32[128], Float32[128], ...] }
    └── ...
```

Cada registro contiene:
- `dni`: la cedula del usuario (clave primaria)
- `descriptors`: un arreglo de hasta **25 descriptores faciales** (los mas recientes)

### Proceso de aprendizaje progresivo

```
  Dia 1 (1er registro)          Dia 2 (2do registro)         Dia 5+ (3er registro+)
  ─────────────────────        ─────────────────────        ──────────────────────
  Usuario marca asistencia     Usuario marca asistencia     Usuario marca asistencia
          │                            │                             │
          ▼                            ▼                             ▼
  Se guarda 1 descriptor      Se guardan 2 descriptores    Se guardan 3+ descriptores
          │                            │                             │
          ▼                            ▼                             ▼
  Cuadro GRIS en camara       Cuadro GRIS en camara        Cuadro VERDE en camara
  "Rostro no reconocido"      "Rostro no reconocido"       "CI: 24939156 (87%)"
  (necesita minimo 3)         (necesita minimo 3)                    │
                                                                     ▼
                                                           Aparece sugerencia:
                                                           "Rostro detectado:
                                                            24939156 (87%)"
```

**Regla de umbral**: El sistema necesita al menos **3 descriptores** almacenados de una persona antes de comenzar a reconocerla. Esto evita falsos positivos con pocas muestras.

**Maximo de muestras**: Se almacenan hasta **25 descriptores** por persona. Los mas antiguos se descartan cuando se alcanza el limite, manteniendo las muestras mas recientes y relevantes.

**Umbral de coincidencia**: La distancia euclidiana entre descriptores debe ser menor a **0.55** para considerarse una coincidencia (escala 0-1, donde 0 es identico).

---

## Arquitectura del Web Worker

El procesamiento ML se ejecuta en un hilo separado para no bloquear la interfaz de usuario.

```
    Main Thread (UI fluida)                    Web Worker (hilo separado)
    ───────────────────────                    ─────────────────────────

    ┌─────────────────────┐
    │ createImageBitmap() │ ← captura frame
    │   (microsegundos)   │   del video
    └─────────┬───────────┘
              │
              │  postMessage + transfer
              │  (zero-copy, sin clonar)
              │
              ▼                                ┌──────────────────────────┐
                                               │ Recibe ImageBitmap       │
                                               │         │                │
                                               │         ▼                │
                                               │ OffscreenCanvas          │
                                               │         │                │
                                               │         ▼                │
                                               │ TinyFaceDetector         │
                                               │   (deteccion de rostro)  │
                                               │         │                │
                                               │         ▼                │
                                               │ FaceLandmark68           │
                                               │   (puntos faciales)      │
                                               │         │                │
                                               │         ▼                │
                                               │ FaceRecognitionNet       │
                                               │   (descriptor 128D)      │
                                               │         │                │
                                               │         ▼                │
                                               │ IndexedDB                │
                                               │   (buscar coincidencia)  │
                                               └─────────┬────────────────┘
                                                         │
              ┌──────────────────────────────────────────┘
              │  postMessage
              │  { box, descriptor, match }
              ▼
    ┌─────────────────────┐
    │ setFaceDetection()  │ ← actualiza estado React
    │ drawOverlay()       │ ← dibuja cuadro en canvas
    │   (milisegundos)    │
    └─────────────────────┘
```

### Comunicacion main thread ↔ Worker

| Mensaje | Direccion | Datos | Descripcion |
|---|---|---|---|
| `init` | Main → Worker | `{ modelPath }` | Carga modelos de ML |
| `detect` | Main → Worker | `{ imageBitmap }` (transferable) | Detecta rostro + busca coincidencia |
| `getDescriptor` | Main → Worker | `{ imageBitmap }` (transferable) | Extrae descriptor sin buscar match |
| `save` | Main → Worker | `{ dni, descriptor }` | Guarda descriptor en IndexedDB |
| respuesta | Worker → Main | `{ id, result }` o `{ id, error }` | Resultado de la operacion |

### Polyfills en el Worker

face-api.js requiere APIs del DOM que no existen en Web Workers. El archivo `faceWorker.js` incluye polyfills minimos:

- `document.createElement('canvas')` → `OffscreenCanvas`
- `HTMLCanvasElement` → `OffscreenCanvas`
- `HTMLImageElement`, `HTMLVideoElement` → clases vacias
- `window` → `self`

### Lock de procesamiento

Un `isProcessingRef` en App.jsx evita que las detecciones se acumulen si el Worker tarda mas del intervalo de escaneo. El intervalo solo lanza una nueva deteccion si la anterior ya termino.

---

## Overlay de deteccion facial

El componente `CameraBox` incluye un canvas overlay transparente superpuesto al video que dibuja en tiempo real:

### Rostro no reconocido (cuadro gris)

```
    ┌─────────────────────────────┐
    │ Rostro no reconocido        │  ← etiqueta gris
    ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
    │┌─                         ─┐│
    ││                           ││
    ││       (rostro)            ││  ← cuadro gris con esquinas
    ││                           ││
    │└─                         ─┘│
    └─────────────────────────────┘
```

### Rostro reconocido (cuadro verde)

```
    ┌─────────────────────────────┐
    │ CI: 24939156  (87%)         │  ← etiqueta verde
    ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
    │┌─                         ─┐│
    ││                           ││
    ││       (rostro)            ││  ← cuadro verde con esquinas
    ││                           ││
    │└─                         ─┘│
    └─────────────────────────────┘
```

El overlay usa coordenadas normalizadas (0-1) que el Worker calcula relativas al tamano del frame. `CameraBox` las escala al tamano real del contenedor, por lo que el cuadro se posiciona correctamente sin importar el tamano de la ventana.

---

## Funciones del wrapper (faceRecognition.js)

El archivo `faceRecognition.js` es un wrapper liviano que expone una API asincrona y se comunica con el Worker internamente:

| Funcion | Descripcion |
|---|---|
| `loadModels()` | Crea el Web Worker y carga los 3 modelos de ML. Se ejecuta una vez al iniciar la app. |
| `isReady()` | Retorna `true` si el Worker esta listo y los modelos cargados. |
| `detectFace(videoElement)` | Captura frame, envia al Worker, retorna `{ box, descriptor, match }` o `null`. |
| `getDescriptor(videoElement)` | Captura frame, envia al Worker, retorna `Float32Array[128]` o `null`. |
| `saveDescriptor(dni, descriptor)` | Envia al Worker para guardar en IndexedDB. |

---

## Integracion con el flujo existente

La integracion del ML **no modifica** el flujo original de la aplicacion. Se agrega como una capa adicional:

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUJO ORIGINAL                             │
│                      (sin cambios)                              │
│                                                                 │
│   Cedula → Captura → Upload imagen → API asistencia → Resultado │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
        │                         │                        │
        │  CAPA ML                │  CAPA ML               │  CAPA ML
        │  (aditiva)              │  (aditiva)             │  (aditiva)
        ▼                         ▼                        ▼
  ┌──────────────┐      ┌────────────────┐      ┌────────────────┐
  │ Escaneo      │      │ Overlay        │      │ Aprendizaje    │
  │ periodico    │      │                │      │                │
  │              │      │ Dibuja cuadro  │      │ Si el registro │
  │ Cada 1.5s,   │      │ sobre el       │      │ fue exitoso:   │
  │ detecta el   │      │ rostro en el   │      │ guardar        │
  │ rostro y     │      │ video con      │      │ descriptor     │
  │ busca match  │      │ identidad o    │      │ facial en      │
  │ en Worker    │      │ "no reconocido"│      │ IndexedDB      │
  │ → sugerencia │      │                │      │ (via Worker)   │
  └──────────────┘      └────────────────┘      └────────────────┘
```

**Puntos de integracion en App.jsx:**

1. **useEffect loadModels** (linea 61): Crea el Web Worker y carga modelos. `modelsReady` se vuelve `true` al completarse.
2. **useEffect escaneo** (linea 68): Inicia intervalo de deteccion cuando `cameraActive && modelsReady`. Incluye lock para evitar acumulacion.
3. **submitData exitoso** (linea 188): Tras un registro exitoso, captura un frame y envia al Worker para guardar el descriptor.
4. **CameraBox faceDetection prop** (linea 278): Pasa `{ box, match }` al componente que dibuja el overlay.
5. **UI de sugerencia** (linea 251): Renderiza el boton de sugerencia cuando hay coincidencia facial y la cedula esta vacia.

---

## Endpoints de la API

### Base URL

```
Variable de entorno: VITE_API_URL
Desarrollo:  https://72.68.60.201:3006/api_jarvis/v1
Produccion:  https://amazona365.ddns.net/api_jarvis/v1
```

### POST /multimedia

Sube una imagen al servidor y retorna su URL publica.

```
URL:     https://amazona365.ddns.net/api_jarvis/v1/multimedia
Method:  POST
Body:    FormData { img: File }

Respuesta exitosa:
{
  "url": "https://amazona365.ddns.net/uploads/foto.jpg"
}
```

### POST /user/attendance/machine/:dni

Registra la asistencia de un usuario.

```
URL:     {VITE_API_URL}/user/attendance/machine/{dni}
Method:  POST
Body:    { "imageReference": "https://..." }

Respuestas:
├── 200-209  Exito: { data: { user: { name, dni, img }, message } }
├── 400      Datos invalidos
├── 404      Usuario no encontrado
└── 409      Registro duplicado (jornada ya cerrada)
```

---

## Instalacion y ejecucion

### Requisitos previos

- Node.js 18+
- npm 9+

### Instalacion

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd biometric

# Instalar dependencias
npm install
```

### Desarrollo

```bash
npm run dev
```

La app se abre en `https://localhost:5173` (HTTPS requerido para acceso a camara).

### Produccion

```bash
npm run build
npm run preview
```

Los archivos compilados se generan en la carpeta `dist/`:
- `index.html` — punto de entrada
- `assets/index-*.js` — app principal (~322 KB)
- `assets/faceWorker-*.js` — Web Worker con face-api.js (~665 KB, carga en hilo separado)
- `assets/index-*.css` — estilos (~33 KB)

---

## Configuracion

### Variables de entorno

Crear un archivo `.env` en la raiz del proyecto:

```env
VITE_API_URL=https://amazona365.ddns.net/api_jarvis/v1
```

### Configuracion de Vite (vite.config.js)

```js
export default defineConfig({
    plugins: [react(), basicSsl()],
    worker: {
        format: 'es'  // Requerido para Web Workers con imports ESM
    },
})
```

### Constantes configurables

En `App.jsx`:

| Constante | Valor por defecto | Descripcion |
|---|---|---|
| `IDLE_TIMEOUT` | 300000 (5 min) | Tiempo de inactividad antes de mostrar el screensaver |
| `FACE_SCAN_INTERVAL` | 1500 (1.5s) | Frecuencia de escaneo facial (el Worker permite intervalos cortos) |

En `faceWorker.js`:

| Constante | Valor por defecto | Descripcion |
|---|---|---|
| `MAX_DESCRIPTORS` | 25 | Maximo de muestras faciales por persona |
| `MATCH_THRESHOLD` | 0.55 | Umbral de coincidencia (0 = identico, 1 = diferente) |
| `MIN_SAMPLES` | 3 | Cantidad minima de registros antes de reconocer |
| `inputSize` | 320 | Resolucion de entrada del detector (128/160/224/320/416/512) |
| `scoreThreshold` | 0.5 | Confianza minima para considerar una deteccion de rostro |

---

## Despliegue movil

La app soporta empaquetado nativo mediante **Capacitor**.

```bash
# Compilar la app web
npm run build

# Sincronizar con el proyecto nativo
npx cap sync

# Abrir en Android Studio
npx cap open android
```

### Configuracion movil (capacitor.config.json)

```json
{
  "appId": "com.example.app",
  "appName": "biometric",
  "webDir": "dist"
}
```

En la version movil, las peticiones HTTP se realizan mediante el plugin nativo `cordova-plugin-advanced-http`, lo que evita restricciones CORS del navegador. El agente HTTP (`agent.index.js`) detecta automaticamente la plataforma y usa el canal apropiado.

---

## Descripcion de componentes

| Componente | Archivo | Funcion |
|---|---|---|
| **Header** | `Header.jsx` | Barra superior con branding BioJarvis e indicador de estado |
| **DateComponent** | `date.jsx` | Reloj digital en tiempo real |
| **CustomInputNumeric** | `InputCustom.jsx` | Campo de cedula (solo lectura visual, se alimenta del keypad) |
| **CustomNumerPad** | `keypad.jsx` | Teclado numerico tactil con sonido de click |
| **CameraBox** | `cameraBox.jsx` | Maneja el stream de video, captura de imagenes y overlay de deteccion facial |
| **ShowData** | `Section_data_user.jsx` | Muestra nombre, cedula y foto del usuario registrado |
| **CustomDialog** | `Dialog.jsx` | Dialogos modales con 3 variantes de color y callback por instancia |
| **ScreenSaver** | `ScreenSaver.jsx` | Animaciones de pantalla durante inactividad |

---

## Notas tecnicas

- **Seguridad HTTPS**: La app requiere HTTPS para acceder a la camara del dispositivo. En desarrollo se usa `@vitejs/plugin-basic-ssl` para generar un certificado autofirmado.
- **Almacenamiento facial local**: Los descriptores faciales se almacenan exclusivamente en el dispositivo mediante IndexedDB (accedida desde el Web Worker). No se envian al servidor. Si se limpia el almacenamiento del navegador, el aprendizaje facial se reinicia.
- **Rendimiento ML**: Toda la inferencia corre en un Web Worker, liberando el main thread. El modelo TinyFaceDetector es ~10x mas rapido que SSD MobileNet. Un lock de procesamiento evita que las detecciones se acumulen si el Worker tarda mas que el intervalo de escaneo.
- **Tamano del bundle**: El app principal pesa ~322 KB. face-api.js (~665 KB) carga en el Worker separado. Los modelos (~7 MB) se descargan bajo demanda y el navegador los cachea.
- **Compatibilidad Worker**: El Web Worker requiere soporte de `OffscreenCanvas`, `createImageBitmap` y `type: 'module'`. Compatible con Chrome 69+, Firefox 105+, Edge 79+ y Safari 16.4+.
- **Dialog con callbacks individuales**: El componente `CustomDialog` soporta un callback opcional por apertura (`openDialog(title, type, desc, closeCallback)`), permitiendo comportamiento diferente al cerrar dialogos de exito vs error.
