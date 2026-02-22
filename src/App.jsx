import { useState, useRef, useCallback, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import Button from "@mui/material/Button";



//COMPONENTS 
import CustonHeader from './components/Header';
import CustomDialog from './components/Dialog';
import CustomNumerPad from './components/keypad';
import { CustomInputNumeric } from './components/InputCustom'
import DateComponent from './components/date';
import CameraBox from './components/cameraBox';
import ShowData from './components/Section_data_user';



//RESOURCE NETWORK
import { userIsExistAttendance } from './network/user';
import { sendImage } from './network/multimedia';

//UI EXPERIENCES
import { sucessAudio } from './libs/audio_content';



function App() {


    const [dniState, setDniState] = useState('');
    const [userResultState, setResultUserState] = useState(null);
    const cameraRef = useRef(null);
    const dialogRef = useRef(null);
    const imageCameraRef = useRef(null);





    const handdlerGetDni = value => {
        let currentValue = dniState;
        if (value === '') return
        else if (value === '⌫' || value === 'Backspace') {
            const dniArr = dniState.split('')
            dniArr.pop()
            currentValue = dniArr.join('')
        }
        else if (value === '⏎' || value === 'Enter') submitData();
        else if (value.length > 1) { }
        else currentValue = currentValue + value
        setDniState(currentValue);
    };



    const submitData = useCallback(async () => {
        if (dniState === '') return null;


        cameraRef.current.getImage(async (image) => {

            imageCameraRef.current.src = image.base64;
            imageCameraRef.current.style.display = 'block';

            const responseMultimedia = await sendImage(image.file);

            
            userIsExistAttendance(dniState, responseMultimedia.url, (error, response) => {
                
                
                
                
                if (error) {
                    if (error?.status === 404) {
                        dialogRef.current.openDialog('Error en la busqueda', 'error', returnNotFound())
                    }
                    
                    
                }
                else {
                    console.log(response);
                    if (response?.status === 404) {
                        dialogRef.current.openDialog('Error en la busqueda', 'error', returnNotFound())
                    }
                    else {
                        setResultUserState(response.data.user);

                        dialogRef.current.openDialog('Usuario registrado', 'Autenticado', returnUsersuccessful(response.data.message));
                        sucessAudio();
                        
                    }

                }
            });
        });

    }, [cameraRef.current]);



    const returnNotFound = () => {

        return (
            <div
                style={{

                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    gap: '.5rem'
                }}
            >
                <img style={{
                    width: '80px'
                }}
                    src='/icons8-usuario-no-encontrado-50.png' alt='user not found-ico'
                />
                <p style={{ fontSize: '1.5rem' }}>Usuario no encontrado o CI inválida</p>
            </div>
        );
    };




    const returnUsersuccessful = (text) => {
        return (
            <div
                style={{

                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    gap: '.5rem'
                }}
            >
                <img
                    style={{
                        width: '80px'
                    }}
                    src='/icons8-evento-96.png'
                    alt='user not found-ico'
                />
                <p style={{ fontSize: '1.5rem' }}>{text}</p>
            </div>
        );
    };



    const resetLogin = () => {
        setDniState('');
        setResultUserState(null);
        imageCameraRef.current.src = '';
        imageCameraRef.current.style.display = 'none';

    };


    return (
        <div
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'

            }}
        >
            <CustonHeader />
            <div
                style={{
                    width: '100%',
                    height: 'calc(100% - 100px)',
                    backgroundColor: '#00000000',
                    padding: '.8rem',
                    display: 'flex',
                    gap: '.5rem'
                }}
            >
                <div
                    style={{
                        width: '40%',
                        height: '100%',
                        display: 'flex',
                        gap: '.5rem',
                        flexDirection: 'column'
                    }}
                >
                    <DateComponent user={userResultState} />
                    <CustomInputNumeric labelText='CI: ' value={dniState} placeholder='Cédula de usuario' changeEvent={handdlerGetDni} />
                    <CustomNumerPad callbackEvent={handdlerGetDni} />
                </div>

                <div style={{
                    width: '60%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    <CameraBox ref={cameraRef} />

                    <div style={{
                        width: '100%',
                        height: '50%',
                        display: 'flex',
                        gap: '.5rem',
                        border: '1px solid #000'
                    }}>
                        <div style={{
                            width: '50%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'row',
                        }}>
                            <img
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'none'
                                }}
                                src='/white_bg.png'
                                alt='camera-result'
                                ref={imageCameraRef}

                            />
                        </div>

                        <div style={{
                            width: '50%',
                            height: '100%'
                        }} >
                            <ShowData user={userResultState} />
                        </div>
                    </div>
                </div>
            </div>
            <CustomDialog ref={dialogRef} callback={resetLogin} />
        </div>
    );
}


export default App
