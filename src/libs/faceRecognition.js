// ──────────────────────────────────────────────────────────
// Reconocimiento facial con face-api.js (main thread)
//
// face-api.js depende internamente de APIs del DOM
// (document.createElement, HTMLCanvasElement, etc.)
// por lo que NO puede correr en un Web Worker.
//
// Se usa TinyFaceDetector (~190 KB) en lugar de SSD MobileNet
// (~5.6 MB), lo que reduce el tiempo de deteccion de ~200ms
// a ~20-50ms por frame. Con un lock de procesamiento y un
// intervalo de 1.5s, solo bloquea el main thread ~3% del tiempo.
// ──────────────────────────────────────────────────────────

import * as faceapi from 'face-api.js';

const DB_NAME = 'biojarvis_faces';
const STORE_NAME = 'descriptors';
const MAX_DESCRIPTORS = 25;
const MATCH_THRESHOLD = 0.55;
const MIN_SAMPLES = 3;

let modelsLoaded = false;

// Opciones reutilizables para TinyFaceDetector
const detectorOptions = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5
});

// ── Cargar modelos (una sola vez) ──
export async function loadModels() {
    if (modelsLoaded) return;
    const MODEL_URL = `${import.meta.env.BASE_URL}models`;
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('[FaceRecognition] Modelos cargados (TinyFaceDetector)');
}

export function isReady() {
    return modelsLoaded;
}

// ── Extraer descriptor facial ──
export async function getDescriptor(element) {
    if (!modelsLoaded) return null;
    try {
        const detection = await faceapi
            .detectSingleFace(element, detectorOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();
        return detection?.descriptor || null;
    } catch {
        return null;
    }
}

// ── Detectar rostro: devuelve caja + descriptor + match ──
export async function detectFace(element) {
    if (!modelsLoaded) return null;
    try {
        const detection = await faceapi
            .detectSingleFace(element, detectorOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();
        if (!detection) return null;

        const { x, y, width, height } = detection.detection.box;
        const { imageWidth, imageHeight } = detection.detection;

        const result = {
            box: {
                x: x / imageWidth,
                y: y / imageHeight,
                width: width / imageWidth,
                height: height / imageHeight
            },
            descriptor: detection.descriptor,
            match: null
        };

        const match = await findMatch(detection.descriptor);
        if (match) result.match = match;

        return result;
    } catch {
        return null;
    }
}

// ── IndexedDB helpers ──
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

// ── Guardar descriptor asociado a una cedula ──
export async function saveDescriptor(dni, descriptor) {
    if (!descriptor) return;
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const existing = await dbGet(store, dni);
        const descriptors = existing?.descriptors || [];

        descriptors.push(Array.from(descriptor));

        while (descriptors.length > MAX_DESCRIPTORS) descriptors.shift();

        store.put({ dni, descriptors });
        console.log(`[FaceRecognition] Descriptor guardado para ${dni} (total: ${descriptors.length})`);
    } catch (err) {
        console.error('[FaceRecognition] Error guardando descriptor:', err);
    }
}

// ── Buscar coincidencia facial ──
export async function findMatch(descriptor) {
    if (!descriptor) return null;
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
            console.log(`[FaceRecognition] Coincidencia: ${match.label} (distancia: ${match.distance.toFixed(3)})`);
            return { dni: match.label, confidence: 1 - match.distance };
        }

        return null;
    } catch (err) {
        console.error('[FaceRecognition] Error buscando coincidencia:', err);
        return null;
    }
}
