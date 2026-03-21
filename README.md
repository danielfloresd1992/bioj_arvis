# BioJarvis - Sistema Biometrico de Control de Asistencia

Sistema de control de entrada y salida de personal con reconocimiento facial progresivo mediante aprendizaje automatico en el navegador.

---

## Tabla de contenidos

- [Descripcion general](#descripcion-general)
- [Stack tecnologico](#stack-tecnologico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujo general de la aplicacion](#flujo-general-de-la-aplicacion)
- [Modulo de reconocimiento facial (ML)](#modulo-de-reconocimiento-facial-ml)
- [Endpoints de la API](#endpoints-de-la-api)
- [Instalacion y ejecucion](#instalacion-y-ejecucion)
- [Configuracion](#configuracion)
- [Despliegue movil](#despliegue-movil)

---

## Descripcion general

BioJarvis es una aplicacion frontend (SPA) que permite a los empleados registrar su asistencia (entrada/salida) mediante un terminal con camara. El usuario ingresa su numero de cedula en un teclado numerico, la camara captura una foto y los datos se envian a la API backend (JARVIS).

Adicionalmente, el sistema integra **reconocimiento facial progresivo**: cada vez que un usuario registra su asistencia exitosamente, el sistema aprende su rostro. Con el tiempo, la aplicacion es capaz de reconocer automaticamente a la persona frente a la camara y sugerir su cedula sin necesidad de escribirla.

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
│   ├── cameraBox.jsx              # Captura de camara (video + canvas)
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
│   ├── faceRecognition.js         # Servicio de reconocimiento facial (ML)
│   └── file.js                    # Utilidad base64 (no utilizada actualmente)
│
public/
├── models/                        # Modelos pre-entrenados de face-api.js
│   ├── ssd_mobilenetv1_model-*    # Deteccion de rostros (~5.6 MB)
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
│   - Escaneo facial periodico activo (cada 2s)               │
│   - Usuario escribe su cedula en el teclado numerico        │
│                                                             │
│   ┌─────────────────────────────────────────┐               │
│   │  Si el ML reconoce el rostro:           │               │
│   │  → Aparece boton verde con sugerencia   │               │
│   │  → "Rostro detectado: 24939156 (87%)"   │               │
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
   │ - Sonido de  │             │   invalidos    │
   │   exito      │             │ - 409: Registro│
   │ - Descriptor │             │   duplicado    │
   │   facial     │             │ - 5xx: Error   │
   │   guardado   │             │   del servidor │
   │   (ML)       │             │                │
   └──────┬───────┘             └───────┬────────┘
          │                             │
          └──────────┬──────────────────┘
                     │
                     │ Usuario cierra el dialogo
                     ▼
          ┌──────────────────────┐
          │ RESET → ESTADO       │
          │ INACTIVO             │
          │ (limpia cedula,      │
          │  datos, preview)     │
          └──────────────────────┘
```

### Flujo detallado paso a paso

1. **Inicio de la app**: Se cargan los modelos de reconocimiento facial (~12 MB) en segundo plano. La interfaz muestra el protector de pantalla con animaciones aleatorias (matrix, orbitas, ondas, respiracion).

2. **Activacion**: Cuando el usuario toca cualquier tecla, el protector de pantalla desaparece, la camara frontal se enciende y comienza un timer de inactividad de 5 minutos.

3. **Ingreso de cedula**: El usuario escribe su numero de cedula usando el teclado numerico en pantalla (o un teclado fisico). Cada tecla reproduce un sonido de click.

4. **Reconocimiento facial en paralelo**: Mientras el usuario escribe, el sistema escanea el rostro visible cada 2 segundos y lo compara contra los descriptores faciales almacenados localmente. Si encuentra coincidencia y el campo de cedula esta vacio, muestra un boton de sugerencia.

5. **Envio**: Al presionar Enter, se captura el frame actual de la camara, se sube la imagen al servidor multimedia y se envia la cedula junto con la URL de la imagen a la API de asistencia.

6. **Resultado**: Se muestra un dialogo con el resultado (exito, error o advertencia). En caso de exito, se muestra la foto capturada y los datos del usuario. El sistema tambien guarda el descriptor facial de forma silenciosa para futuras detecciones.

7. **Reset**: Al cerrar el dialogo, se limpian todos los campos y la app vuelve al estado inactivo tras 5 minutos sin actividad.

---

## Modulo de reconocimiento facial (ML)

### Arquitectura

El reconocimiento facial se ejecuta **completamente en el navegador** usando `face-api.js`, una libreria construida sobre TensorFlow.js. No requiere backend adicional ni conexion a internet para el procesamiento ML.

```
                    face-api.js (TensorFlow.js)
                    ┌─────────────────────────────────────┐
                    │                                     │
  Video en vivo ──→ │  1. SSD MobileNet v1                │
                    │     Detecta rostros en la imagen     │
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

```
  Dia 1 (1er registro)          Dia 2 (2do registro)         Dia 5+ (3er registro+)
  ─────────────────────        ─────────────────────        ──────────────────────
  Usuario marca asistencia     Usuario marca asistencia     Usuario marca asistencia
          │                            │                             │
          ▼                            ▼                             ▼
  Se guarda 1 descriptor      Se guardan 2 descriptores    Se guardan 3+ descriptores
          │                            │                             │
          ▼                            ▼                             ▼
  Sistema aun NO reconoce     Sistema aun NO reconoce      Sistema RECONOCE al
  (necesita minimo 3)         (necesita minimo 3)          usuario automaticamente
                                                                     │
                                                                     ▼
                                                           Aparece sugerencia:
                                                           "Rostro detectado:
                                                            24939156 (87%)"
```

**Regla de umbral**: El sistema necesita al menos **3 descriptores** almacenados de una persona antes de comenzar a reconocerla. Esto evita falsos positivos con pocas muestras.

**Maximo de muestras**: Se almacenan hasta **25 descriptores** por persona. Los mas antiguos se descartan cuando se alcanza el limite, manteniendo las muestras mas recientes y relevantes.

**Umbral de coincidencia**: La distancia euclidiana entre descriptores debe ser menor a **0.55** para considerarse una coincidencia (escala 0-1, donde 0 es identico).

### Funciones del servicio (faceRecognition.js)

| Funcion | Descripcion |
|---|---|
| `loadModels()` | Carga los 3 modelos de red neuronal. Se ejecuta una vez al iniciar la app. |
| `isReady()` | Retorna `true` si los modelos estan cargados y listos para usar. |
| `getDescriptor(element)` | Recibe un elemento HTML (video/canvas/img) y retorna un `Float32Array[128]` que representa el rostro detectado. Retorna `null` si no detecta rostro. |
| `saveDescriptor(dni, descriptor)` | Guarda un descriptor facial asociado a una cedula en IndexedDB. |
| `findMatch(descriptor)` | Compara un descriptor contra todos los registrados y retorna `{ dni, confidence }` si hay coincidencia, o `null`. |
| `getStats()` | Retorna estadisticas: total de personas registradas y cantidad de muestras por cada una. |

### Integracion con el flujo existente

La integracion del ML **no modifica** el flujo original de la aplicacion. Se agrega como una capa adicional:

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUJO ORIGINAL                             │
│                      (sin cambios)                              │
│                                                                 │
│   Cedula → Captura → Upload imagen → API asistencia → Resultado │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
        │                                                  │
        │  CAPA ML (aditiva)                               │  CAPA ML (aditiva)
        │                                                  │
        ▼                                                  ▼
  ┌──────────────┐                                ┌────────────────┐
  │ Escaneo      │                                │ Aprendizaje    │
  │ periodico    │                                │                │
  │              │                                │ Si el registro │
  │ Cada 2s,     │                                │ fue exitoso:   │
  │ detecta el   │                                │ guardar        │
  │ rostro y     │                                │ descriptor     │
  │ busca match  │                                │ facial en      │
  │ → sugerencia │                                │ IndexedDB      │
  └──────────────┘                                └────────────────┘
```

**Puntos de integracion en App.jsx:**

1. **useEffect inicial** (linea 54): Carga los modelos de ML al montar el componente.
2. **useEffect de escaneo** (linea 59): Inicia/detiene el intervalo de deteccion facial segun el estado de la camara.
3. **submitData exitoso** (linea 158): Tras un registro exitoso, extrae y guarda el descriptor facial.
4. **UI de sugerencia** (linea 224): Renderiza el boton de sugerencia cuando hay coincidencia facial.

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
| `FACE_SCAN_INTERVAL` | 2000 (2s) | Frecuencia de escaneo facial |

En `faceRecognition.js`:

| Constante | Valor por defecto | Descripcion |
|---|---|---|
| `MAX_DESCRIPTORS` | 25 | Maximo de muestras faciales por persona |
| `MATCH_THRESHOLD` | 0.55 | Umbral de coincidencia (0 = identico, 1 = diferente) |
| Minimo de muestras | 3 | Cantidad minima de registros antes de reconocer |

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
| **CameraBox** | `cameraBox.jsx` | Maneja el stream de video y la captura de imagenes |
| **ShowData** | `Section_data_user.jsx` | Muestra nombre, cedula y foto del usuario registrado |
| **CustomDialog** | `Dialog.jsx` | Dialogos modales con 3 variantes de color (exito/error/advertencia) |
| **ScreenSaver** | `ScreenSaver.jsx` | Animaciones de pantalla durante inactividad |

---

## Notas tecnicas

- **Seguridad HTTPS**: La app requiere HTTPS para acceder a la camara del dispositivo. En desarrollo se usa `@vitejs/plugin-basic-ssl` para generar un certificado autofirmado.
- **Almacenamiento facial local**: Los descriptores faciales se almacenan exclusivamente en el dispositivo mediante IndexedDB. No se envian al servidor. Si se limpia el almacenamiento del navegador, el aprendizaje facial se reinicia.
- **Rendimiento ML**: La deteccion facial consume recursos de CPU/GPU. El intervalo de 2 segundos balancea precision con rendimiento. En dispositivos de gama baja, se puede aumentar `FACE_SCAN_INTERVAL`.
- **Tamano del bundle**: face-api.js agrega ~960 KB al bundle. Los modelos (~12 MB) se cargan bajo demanda y el navegador los cachea.
