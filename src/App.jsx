import { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';

// COMPONENTS
import CustonHeader from './components/Header';
import CustomDialog from './components/Dialog';
import CustomNumerPad from './components/keypad';
import { CustomInputNumeric } from './components/InputCustom';
import DateComponent from './components/date';
import CameraBox from './components/cameraBox';
import ShowData from './components/Section_data_user';
import ScreenSaver from './components/ScreenSaver';

// NETWORK
import { userIsExistAttendance } from './network/user';
import { sendImage } from './network/multimedia';

// UI
import { sucessAudio } from './libs/audio_content';

// FACE RECOGNITION
import { loadModels, isReady, getDescriptor, saveDescriptor, detectFace } from './libs/faceRecognition';

const IDLE_TIMEOUT = 2 * 60 * 1000; // 5 minutes
const FACE_SCAN_INTERVAL = 1500; // escanear rostro cada 1.5s (TinyFaceDetector ~20-50ms por frame)

function App() {


    const [dniState, setDniState] = useState('');
    const [userResultState, setResultUserState] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [showScreenSaver, setShowScreenSaver] = useState(true);

    const [faceSuggestion, setFaceSuggestion] = useState(null); // { dni, confidence }
    const [faceDetection, setFaceDetection] = useState(null); // { box, match }
    const [cameraImageSrc, setCameraImageSrc] = useState('');

    const [modelsReady, setModelsReady] = useState(false);

    const cameraRef = useRef(null);
    const dialogRef = useRef(null);
    const idleTimerRef = useRef(null);
    const faceScanRef = useRef(null);
    const isProcessingRef = useRef(false);



    const resetIdleTimer = useCallback(() => {
        setShowScreenSaver(false);
        setCameraActive(true);

        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            setCameraActive(false);
            setShowScreenSaver(true);
            setResultUserState(null);
            setCameraImageSrc('');
            setDniState('');
            if (cameraRef.current) cameraRef.current.stopCamera();
        }, IDLE_TIMEOUT);
    }, []);


    // Cargar modelos de reconocimiento facial al inicio
    useEffect(() => {
        loadModels()
            .then(() => setModelsReady(true))
            .catch(err => console.error('[FaceRecognition] Error cargando modelos:', err));
    }, []);



    // Escaneo periódico de rostro mientras la cámara esté activa
    useEffect(() => {
        if (cameraActive && modelsReady) {
            faceScanRef.current = setInterval(async () => {
                // Lock: evitar que detecciones se acumulen
                if (isProcessingRef.current) return;
                const video = cameraRef.current?.getVideoElement();
                if (!video || video.readyState < 2) return;

                isProcessingRef.current = true;
                try {
                    const result = await detectFace(video);

                    if (result) {
                        setFaceDetection({ box: result.box, match: result.match });

                        if (result.match && dniState === '') {
                            setFaceSuggestion(result.match);
                        } else if (!result.match) {
                            setFaceSuggestion(null);
                        }
                    } else {
                        setFaceDetection(null);
                        setFaceSuggestion(null);
                    }
                } finally {
                    isProcessingRef.current = false;
                }
            }, FACE_SCAN_INTERVAL);
        }

        return () => {
            if (faceScanRef.current) {
                clearInterval(faceScanRef.current);
                faceScanRef.current = null;
            }
            setFaceSuggestion(null);
            setFaceDetection(null);
        };
    }, [cameraActive, modelsReady, dniState]);



    useEffect(() => {
        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, []);


    const handdlerGetDni = useCallback((value) => {
        resetIdleTimer();

        // Limpiar datos del registro anterior al empezar a escribir
        if (userResultState) {
            setResultUserState(null);
            setCameraImageSrc('');
        }

        let currentValue = dniState;
        if (value === '') return;
        else if (value === '⌫' || value === 'Backspace') {
            const dniArr = dniState.split('');
            dniArr.pop();
            currentValue = dniArr.join('');
        }
        else if (value === '⏎' || value === 'Enter' || value === 'Entrar') submitData();
        else if (value.length > 1) { }
        else currentValue = currentValue + value;
        setDniState(currentValue);
    }, [dniState]);

    const submitData = useCallback(async () => {
        if (dniState === '') return null;

        if (!cameraRef.current) return;

        cameraRef.current.getImage(async (image) => {
            setCameraImageSrc(image.base64);

            const responseMultimedia = await sendImage(image.file);

            userIsExistAttendance(dniState, responseMultimedia.url, (error, response) => {
                if (error) {
                    if (error?.status === 404) {
                        dialogRef.current.openDialog('Usuario no encontrado', 'error', returnNotFound());
                    } else if (error?.status === 400) {
                        dialogRef.current.openDialog(
                            'Solicitud inválida', 'warning',
                            returnApiMessage(error?.data?.message || 'Los datos enviados no son válidos.')
                        );
                    } else if (error?.status === 409) {
                        dialogRef.current.openDialog(
                            'Registro duplicado', 'warning',
                            returnAttendanceConflict(error?.data?.message || 'La jornada de hoy ya fue cerrada previamente para este usuario.')
                        );
                    } else {
                        dialogRef.current.openDialog(
                            'Error inesperado', 'error',
                            returnApiMessage(error?.data?.message || 'Ocurrió un error inesperado en el servidor.')
                        );
                    }
                } else {
                    if (response?.status === 404) {
                        dialogRef.current.openDialog('Usuario no encontrado', 'error', returnNotFound());
                    } else if (response?.status === 400) {
                        dialogRef.current.openDialog(
                            'Solicitud inválida', 'warning',
                            returnApiMessage(response?.data?.message || 'Los datos enviados no son válidos.')
                        );
                    } else if (response?.status === 409) {
                        dialogRef.current.openDialog(
                            'Registro duplicado', 'warning',
                            returnAttendanceConflict(response?.data?.message || 'La jornada de hoy ya fue cerrada previamente para este usuario.')
                        );
                    } else {
                        setResultUserState(response.data.user);
                        dialogRef.current.openDialog(
                            'Usuario registrado', 'success',
                            returnUsersuccessful(response.data.message),
                            () => setDniState('')
                        );
                        sucessAudio();

                        // Aprendizaje facial: guardar descriptor asociado a esta cédula
                        if (isReady()) {
                            const video = cameraRef.current?.getVideoElement();
                            if (video) {
                                getDescriptor(video).then(desc => {
                                    if (desc) saveDescriptor(dniState, desc);
                                });
                            }
                        }
                    }
                }
            });
        });
    }, [dniState]);



    const returnNotFound = () => (
        <div className="flex flex-col items-center gap-3">
            <img className="w-16" src="/icons8-usuario-no-encontrado-50.png" alt="not-found" />
            <p className="text-lg text-slate-300 text-center">Usuario no encontrado o CI inválida</p>
        </div>
    );



    const returnUsersuccessful = (text) => (
        <div className="flex flex-col items-center gap-3">
            <img className="w-16" src="/icons8-evento-96.png" alt="success" />
            <p className="text-lg text-emerald-300 text-center">{text}</p>
        </div>
    );



    const returnAttendanceConflict = (text) => (
        <div className="flex flex-col items-center gap-3">
            <img className="w-16" src="/icons8-evento-96.png" alt="conflict" />
            <p className="text-lg text-amber-300 text-center">{text}</p>
        </div>
    );



    const returnApiMessage = (text, iconSrc = '/icons8-error-50.png') => (
        <div className="flex flex-col items-center gap-3">
            <img className="w-16" src={iconSrc} alt="message" />
            <p className="text-lg text-slate-300 text-center">{text}</p>
        </div>
    );



    const resetLogin = () => {
        setDniState('');
        setResultUserState(null);
        setCameraActive(false);
        setShowScreenSaver(true);
    };



    return (
        <div className="w-full h-full flex flex-col bg-[#0b0f14]">
            <CustonHeader />

            <div className="flex-1 min-h-0 flex gap-3 p-3" style={{ padding: '.5rem .5rem .5rem .5rem' }}>
                {/* Left Panel - Controls */}
                <div className="w-[38%] h-full flex flex-col gap-3 shrink-0">
                    <DateComponent />
                    <CustomInputNumeric
                        labelText="CI:"
                        value={dniState}
                        placeholder="Cédula de usuario"
                        changeEvent={handdlerGetDni}
                    />
                    {faceSuggestion && dniState === '' && (
                        <button
                            onClick={() => {
                                setDniState(faceSuggestion.dni);
                                setFaceSuggestion(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl
                                       bg-emerald-900/30 border border-emerald-500/40
                                       text-emerald-300 text-sm
                                       hover:bg-emerald-900/50 transition-colors cursor-pointer"
                        >
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                            </svg>
                            <span>
                                Rostro detectado: <strong>{faceSuggestion.dni}</strong>
                                <span className="ml-1 opacity-60">({Math.round(faceSuggestion.confidence * 100)}%)</span>
                            </span>
                        </button>
                    )}
                    <CustomNumerPad callbackEvent={handdlerGetDni} />
                </div>

                {/* Right Panel - Camera & Result */}
                <div className="flex-1 h-full flex flex-col gap-3 min-w-0">
                    {/* Camera area with screensaver overlay */}
                    <div className="relative flex-1 min-h-0">
                        <CameraBox ref={cameraRef} isActive={cameraActive} faceDetection={faceDetection} />
                        <ScreenSaver visible={showScreenSaver} />
                    </div>

                    {/* Result area */}
                    <div className="h-[45%] shrink-0 flex gap-3 bg-[#111827] rounded-2xl border border-slate-800/50 overflow-hidden">
                        <div className="w-1/2 h-full flex items-center justify-center bg-[#0d1117] p-2">
                            {userResultState ? (
                                <img
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                    src={cameraImageSrc}
                                    alt="camera-result"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-slate-600">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                    </svg>
                                    <p className="text-xs">Captura pendiente</p>
                                </div>
                            )}
                        </div>

                        <div className="w-1/2 h-full">
                            <ShowData user={userResultState} />
                        </div>
                    </div>
                </div>
            </div>

            <CustomDialog ref={dialogRef} callback={resetLogin} />
        </div>
    );
}

export default App;
