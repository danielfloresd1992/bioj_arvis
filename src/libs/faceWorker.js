// ──────────────────────────────────────────────────────────
// Web Worker para reconocimiento facial
// Todo el procesamiento pesado de face-api.js corre aquí,
// liberando el main thread para UI fluida.
// ──────────────────────────────────────────────────────────

// ── Polyfills DOM para face-api.js (requiere canvas/document) ──
self.document = {
    createElement(tag) {
        if (tag === 'canvas') return new OffscreenCanvas(1, 1);
        return {};
    },
    createElementNS(_ns, tag) {
        if (tag === 'canvas') return new OffscreenCanvas(1, 1);
        return {};
    }
};
self.HTMLCanvasElement = OffscreenCanvas;
self.HTMLImageElement = class HTMLImageElement {};
self.HTMLVideoElement = class HTMLVideoElement {};
self.window = self;
self.screen = { width: 1920, height: 1080 };
self.requestAnimationFrame = (cb) => setTimeout(cb, 16);

// ── Constantes ──
const DB_NAME = 'biojarvis_faces';
const STORE_NAME = 'descriptors';
const MAX_DESCRIPTORS = 25;
const MATCH_THRESHOLD = 0.55;
const MIN_SAMPLES = 3;

let faceapi = null;
let modelsLoaded = false;

// ── IndexedDB (disponible nativamente en Web Workers) ──
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            req.result.createObjectStore(STORE_NAME, { keyPath: 'dni' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function dbGet(store, key) {
    return new Promise((resolve) => {
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });
}

function dbGetAll(store) {
    return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
    });
}

// ── Buscar coincidencia facial ──
async function findMatchInternal(descriptor) {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const allRecords = await dbGetAll(store);

        if (allRecords.length === 0) return null;

        const ready = allRecords.filter(r => r.descriptors.length >= MIN_SAMPLES);
        if (ready.length === 0) return null;

        const labeledDescriptors = ready.map(record =>
            new faceapi.LabeledFaceDescriptors(
                record.dni,
                record.descriptors.map(d => new Float32Array(d))
            )
        );

        const matcher = new faceapi.FaceMatcher(labeledDescriptors, MATCH_THRESHOLD);
        const match = matcher.findBestMatch(descriptor);

        if (match.label !== 'unknown') {
            return { dni: match.label, confidence: 1 - match.distance };
        }
        return null;
    } catch {
        return null;
    }
}

// ── Guardar descriptor ──
async function saveDescriptorInternal(dni, descriptorArray) {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const existing = await dbGet(store, dni);
        const descriptors = existing?.descriptors || [];

        descriptors.push(descriptorArray);
        while (descriptors.length > MAX_DESCRIPTORS) descriptors.shift();

        store.put({ dni, descriptors });
    } catch (err) {
        console.error('[FaceWorker] Error guardando descriptor:', err);
    }
}

// ── Convertir ImageBitmap a OffscreenCanvas para face-api.js ──
function bitmapToCanvas(imageBitmap) {
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0);
    imageBitmap.close();
    return canvas;
}

// ── Handler de mensajes ──
self.onmessage = async (e) => {
    const { type, id, payload } = e.data;

    try {
        switch (type) {

            case 'init': {
                faceapi = await import('face-api.js');

                const modelUrl = payload.modelPath;
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
                    faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
                    faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
                ]);
                modelsLoaded = true;
                self.postMessage({ id, result: true });
                break;
            }

            case 'detect': {
                if (!modelsLoaded) {
                    self.postMessage({ id, result: null });
                    break;
                }

                const canvas = bitmapToCanvas(payload.imageBitmap);

                const detection = await faceapi
                    .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({
                        inputSize: 320,
                        scoreThreshold: 0.5
                    }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!detection) {
                    self.postMessage({ id, result: null });
                    break;
                }

                const { x, y, width, height } = detection.detection.box;
                const { imageWidth, imageHeight } = detection.detection;

                const match = await findMatchInternal(detection.descriptor);

                self.postMessage({
                    id,
                    result: {
                        box: {
                            x: x / imageWidth,
                            y: y / imageHeight,
                            width: width / imageWidth,
                            height: height / imageHeight
                        },
                        descriptor: Array.from(detection.descriptor),
                        match
                    }
                });
                break;
            }

            case 'getDescriptor': {
                if (!modelsLoaded) {
                    self.postMessage({ id, result: null });
                    break;
                }

                const canvas2 = bitmapToCanvas(payload.imageBitmap);

                const det = await faceapi
                    .detectSingleFace(canvas2, new faceapi.TinyFaceDetectorOptions({
                        inputSize: 320,
                        scoreThreshold: 0.5
                    }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                self.postMessage({
                    id,
                    result: det ? Array.from(det.descriptor) : null
                });
                break;
            }

            case 'save': {
                await saveDescriptorInternal(payload.dni, payload.descriptor);
                self.postMessage({ id, result: true });
                break;
            }

            default:
                self.postMessage({ id, error: `Tipo desconocido: ${type}` });
        }
    } catch (err) {
        self.postMessage({ id, error: err.message });
    }
};
