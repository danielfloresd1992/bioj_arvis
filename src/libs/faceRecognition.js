// ──────────────────────────────────────────────────────────
// Wrapper liviano para el Web Worker de reconocimiento facial.
// El main thread SOLO captura frames y envía mensajes.
// Toda la inferencia ML corre en un hilo separado.
// ──────────────────────────────────────────────────────────

let worker = null;
let messageId = 0;
let ready = false;
const pending = new Map();

// ── Comunicación con el Worker ──
function sendMessage(type, payload, transfer = []) {
    return new Promise((resolve, reject) => {
        const id = messageId++;
        pending.set(id, { resolve, reject });
        worker.postMessage({ type, id, payload }, transfer);
    });
}

function handleWorkerMessage(e) {
    const { id, result, error } = e.data;
    const promise = pending.get(id);
    if (!promise) return;
    pending.delete(id);
    if (error) promise.reject(new Error(error));
    else promise.resolve(result);
}

// ── API pública (misma interfaz que antes) ──

export async function loadModels() {
    if (worker) return;

    worker = new Worker(
        new URL('./faceWorker.js', import.meta.url),
        { type: 'module' }
    );
    worker.onmessage = handleWorkerMessage;
    worker.onerror = (err) => console.error('[FaceRecognition] Worker error:', err);

    const modelPath = new URL(
        `${import.meta.env.BASE_URL}models`,
        window.location.origin
    ).href;

    await sendMessage('init', { modelPath });
    ready = true;
    console.log('[FaceRecognition] Modelos cargados en Web Worker');
}

export function isReady() {
    return ready;
}

/**
 * Detectar rostro + intentar reconocer.
 * Recibe un HTMLVideoElement, captura un frame como ImageBitmap
 * y lo transfiere al Worker (zero-copy).
 * Retorna { box, descriptor, match } o null.
 */
export async function detectFace(videoElement) {
    if (!ready) return null;
    try {
        const bitmap = await createImageBitmap(videoElement);
        return await sendMessage('detect', { imageBitmap: bitmap }, [bitmap]);
    } catch {
        return null;
    }
}

/**
 * Extraer descriptor facial de un video element.
 * Retorna Float32Array[128] o null.
 */
export async function getDescriptor(videoElement) {
    if (!ready) return null;
    try {
        const bitmap = await createImageBitmap(videoElement);
        const result = await sendMessage('getDescriptor', { imageBitmap: bitmap }, [bitmap]);
        return result ? new Float32Array(result) : null;
    } catch {
        return null;
    }
}

/**
 * Guardar descriptor facial asociado a una cédula (en IndexedDB del Worker).
 */
export async function saveDescriptor(dni, descriptor) {
    if (!ready || !descriptor) return;
    try {
        await sendMessage('save', {
            dni,
            descriptor: Array.from(descriptor)
        });
    } catch (err) {
        console.error('[FaceRecognition] Error guardando descriptor:', err);
    }
}
