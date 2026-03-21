# BioJarvis - Sistema Biometrico de Control de Asistencia

Sistema de control de entrada y salida de personal con reconocimiento facial progresivo mediante aprendizaje automatico en el navegador.

---

## Tabla de contenidos

- [Descripcion general](#descripcion-general)
- [Stack tecnologico](#stack-tecnologico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujo general de la aplicacion](#flujo-general-de-la-aplicacion)
- [Modulo de reconocimiento facial (ML)](#modulo-de-reconocimiento-facial-ml)
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
| TinyFaceDetector | Detector de rostros rapido (~20-50ms por frame) |
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
│   ├── faceRecognition.js         # Servicio de reconocimiento facial (face-api.js + IndexedDB)
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
│   - Modelos de ML cargandose en segundo plano               │
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

1. **Inicio de la app**: Se cargan los modelos de reconocimiento facial (~7 MB total) de forma asincrona. La interfaz muestra el protector de pantalla con animaciones aleatorias (matrix, orbitas, ondas, respiracion). El estado `modelsReady` se activa cuando la carga termina.

2. **Activacion**: Cuando el usuario toca cualquier tecla, el protector de pantalla desaparece, la camara frontal se enciende y comienza un timer de inactividad de 5 minutos.

3. **Ingreso de cedula**: El usuario escribe su numero de cedula usando el teclado numerico en pantalla (o un teclado fisico). Cada tecla reproduce un sonido de click.

4. **Deteccion facial en tiempo real**: Mientras la camara esta activa y los modelos estan cargados, cada 1.5 segundos se ejecuta `detectFace(video)` que:
   - Detecta el rostro con **TinyFaceDetector** (~20-50ms, no bloquea la UI perceptiblemente)
   - Extrae 68 puntos de referencia facial (landmarks)
   - Genera un descriptor de 128 dimensiones (huella facial unica)
   - Busca coincidencia en IndexedDB contra los descriptores almacenados
   - Un **lock de procesamiento** (`isProcessingRef`) evita que las detecciones se acumulen
   - Los resultados se pasan al componente `CameraBox` que dibuja un **cuadro sobre el rostro**:
     - **Cuadro gris** con etiqueta "Rostro no reconocido" si la persona aun no tiene suficientes muestras
     - **Cuadro verde** con etiqueta "CI: 24939156 (87%)" si el sistema la reconoce
   - Si el campo de cedula esta vacio y hay coincidencia, aparece un **boton de sugerencia** debajo del input

5. **Envio**: Al presionar Enter, se captura el frame actual de la camara, se sube la imagen al servidor multimedia y se envia la cedula junto con la URL de la imagen a la API de asistencia.

6. **Resultado exitoso**: Se muestra un dialogo de exito. El sistema guarda el descriptor facial para futuras detecciones. Al cerrar el dialogo, la foto y datos **persisten** visibles. Se limpian cuando el usuario empieza a escribir una nueva cedula o el idle timer se activa.

7. **Resultado error**: Al cerrar un dialogo de error, se realiza un reset completo.

---

## Modulo de reconocimiento facial (ML)

### Libreria: face-api.js

Se usa **face-api.js**, una libreria construida sobre **TensorFlow.js** que permite ejecutar reconocimiento facial completamente en el navegador, sin necesidad de backend ML ni conexion a internet para el procesamiento.

> **Nota sobre Web Workers**: face-api.js depende internamente de APIs del DOM (`document.createElement`, `HTMLCanvasElement`, `getContext('2d')`, etc.) y de TensorFlow.js que requiere acceso al canvas del navegador. Por esta razon, **no puede ejecutarse de manera confiable en un Web Worker**. En su lugar, se usa **TinyFaceDetector** que es suficientemente rapido (~20-50ms por frame) para correr en el main thread sin afectar la fluidez de la interfaz.

### Pipeline de redes neuronales

```
                    face-api.js (TensorFlow.js)
                    ┌─────────────────────────────────────┐
                    │                                     │
  Video element ──→ │  1. TinyFaceDetector                │
                    │     Detecta rostros en la imagen     │
                    │     (190 KB, ~20-50ms por frame)     │
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

Los descriptores faciales se almacenan en el navegador usando **IndexedDB**, una base de datos NoSQL integrada en todos los navegadores modernos.

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

Asi es como el sistema aprende a reconocer a una persona con el tiempo:

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

1. **Registro 1-2**: El usuario marca su asistencia con su cedula. Al exito, se captura el descriptor facial y se guarda en IndexedDB. El cuadro sobre su rostro aparece **gris** porque necesita minimo 3 muestras.

2. **Registro 3+**: Con 3 o mas descriptores almacenados, el sistema comienza a reconocer a la persona. El cuadro cambia a **verde** mostrando su cedula y porcentaje de confianza. Un boton de sugerencia aparece para auto-rellenar la cedula.

3. **Registros sucesivos**: Cada registro exitoso agrega un nuevo descriptor, mejorando la precision (diferentes angulos, iluminacion). Se almacenan hasta 25 descriptores por persona.

**Regla de umbral**: Minimo **3 descriptores** antes de reconocer (evita falsos positivos).

**Umbral de coincidencia**: Distancia euclidiana menor a **0.55** (escala 0-1, donde 0 es identico).

### Funciones del servicio (faceRecognition.js)

| Funcion | Descripcion |
|---|---|
| `loadModels()` | Carga los 3 modelos de red neuronal (TinyFaceDetector + Landmark + Recognition). Se ejecuta una vez al iniciar la app. |
| `isReady()` | Retorna `true` si los modelos estan cargados y listos para usar. |
| `detectFace(videoElement)` | Detecta el rostro, genera descriptor, busca coincidencia en IndexedDB. Retorna `{ box, descriptor, match }` o `null`. |
| `getDescriptor(videoElement)` | Extrae solo el descriptor facial. Retorna `Float32Array[128]` o `null`. |
| `saveDescriptor(dni, descriptor)` | Guarda un descriptor facial asociado a una cedula en IndexedDB. |
| `findMatch(descriptor)` | Compara un descriptor contra todos los registrados. Retorna `{ dni, confidence }` o `null`. |

### Optimizaciones de rendimiento

| Tecnica | Descripcion |
|---|---|
| **TinyFaceDetector** | Modelo de deteccion de ~190 KB que corre en ~20-50ms (vs SSD MobileNet ~200ms y ~5.6 MB) |
| **Lock de procesamiento** | `isProcessingRef` evita que las detecciones se acumulen si una tarda mas del intervalo |
| **Intervalo de 1.5s** | Balancea frecuencia de deteccion con uso de CPU (~3% del main thread) |
| **inputSize: 320** | Resolucion de entrada del detector optimizada (no procesa la imagen completa) |
| **Opciones reutilizables** | Las opciones de TinyFaceDetector se crean una vez y se reutilizan en cada deteccion |

---

## Overlay de deteccion facial

El componente `CameraBox` incluye un canvas overlay (`overlayRef`) transparente superpuesto al video que dibuja en tiempo real los resultados de la deteccion:

### Rostro no reconocido (cuadro gris)

```
    ┌─────────────────────────────┐
    │ Rostro no reconocido        │  ← etiqueta fondo gris oscuro
    ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
    │┌─                         ─┐│
    ││                           ││
    ││       (rostro)            ││  ← cuadro gris (#64748b) con esquinas decorativas
    ││                           ││
    │└─                         ─┘│
    └─────────────────────────────┘
```

### Rostro reconocido (cuadro verde)

```
    ┌─────────────────────────────┐
    │ CI: 24939156  (87%)         │  ← etiqueta fondo verde
    ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
    │┌─                         ─┐│
    ││                           ││
    ││       (rostro)            ││  ← cuadro verde (#10b981) con esquinas decorativas
    ││                           ││
    │└─                         ─┘│
    └─────────────────────────────┘
```

El overlay usa **coordenadas normalizadas (0-1)** calculadas en `detectFace()` relativas al tamano del frame original. `CameraBox` las escala al tamano real del contenedor en `drawOverlay()`, por lo que el cuadro se posiciona correctamente sin importar el tamano de la ventana. Se redibuja automaticamente al redimensionar.

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
  │ → sugerencia │      │ "no reconocido"│      │ IndexedDB      │
  └──────────────┘      └────────────────┘      └────────────────┘
```

**Puntos de integracion en App.jsx:**

1. **useEffect loadModels**: Carga modelos al montar. `modelsReady` se vuelve `true` al completarse.
2. **useEffect escaneo**: Inicia intervalo cuando `cameraActive && modelsReady`. Incluye lock para evitar acumulacion.
3. **submitData exitoso**: Extrae descriptor del video y lo guarda en IndexedDB para aprendizaje futuro.
4. **CameraBox faceDetection prop**: Pasa `{ box, match }` al componente que dibuja el overlay en canvas.
5. **UI de sugerencia**: Boton verde debajo del input de cedula cuando hay coincidencia facial.

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

Los archivos compilados se generan en la carpeta `dist/`.

---

## Configuracion

### Variables de entorno

Crear un archivo `.env` en la raiz del proyecto:

```env
VITE_API_URL=https://amazona365.ddns.net/api_jarvis/v1
```

### Constantes configurables

En `App.jsx`:

| Constante | Valor por defecto | Descripcion |
|---|---|---|
| `IDLE_TIMEOUT` | 300000 (5 min) | Tiempo de inactividad antes de mostrar el screensaver |
| `FACE_SCAN_INTERVAL` | 1500 (1.5s) | Frecuencia de escaneo facial |

En `faceRecognition.js`:

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
- **Almacenamiento facial local**: Los descriptores faciales se almacenan exclusivamente en el dispositivo mediante IndexedDB. No se envian al servidor. Si se limpia el almacenamiento del navegador, el aprendizaje facial se reinicia.
- **face-api.js y Web Workers**: face-api.js depende de APIs del DOM (`document.createElement('canvas')`, `HTMLCanvasElement`, etc.) y de TensorFlow.js que requiere acceso al canvas del navegador. Por esta razon no puede ejecutarse de manera confiable en un Web Worker. Se usa TinyFaceDetector en el main thread con un lock de procesamiento, lo que resulta en ~3% de uso del main thread (20-50ms cada 1.5s).
- **Rendimiento**: TinyFaceDetector es ~10x mas rapido que SSD MobileNet v1 (190 KB vs 5.6 MB, 20-50ms vs 200ms). El lock `isProcessingRef` evita que las detecciones se acumulen.
- **Tamano del bundle**: ~964 KB (incluye face-api.js con TensorFlow.js). Los modelos (~7 MB) se cargan bajo demanda y el navegador los cachea.
- **Dialog con callbacks individuales**: El componente `CustomDialog` soporta un callback opcional por apertura (`openDialog(title, type, desc, closeCallback)`), permitiendo comportamiento diferente al cerrar dialogos de exito vs error.
