import { useState, useRef, useCallback } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import Button from "@mui/material/Button";


//COMPONENTS 
import CustonHeader from './components/Header';
import CustomDialog from './components/Dialog';
import CustomNumerPad from './components/keypad';
import {CustomInputNumeric} from './components/InputCustom'
import DateComponent from './components/date';
import CameraBox from './components/cameraBox';

function App() {


    const [dnsState, setDniState] = useState('');
    const cameraRef = useRef(null);

    const imageCameraRef = useRef(null);


    const handdlerGetDni = value => {
        let currentValue = dnsState;
        if(value === '') return
        else if(value === '⌫') {
            const dniArr = dnsState.split('')
            dniArr.pop()
            currentValue = dniArr.join('')
        }
        else if(value === '⏎') submitData();
        else currentValue = currentValue  + value
        setDniState(currentValue);
    };



    const submitData = useCallback(() => {
        cameraRef.current.getImage((image) => {
       
            imageCameraRef.current.src = image.base64;
        });
        
    }, [cameraRef.current]);



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
                    <DateComponent />
                    <CustomInputNumeric labelText='CI: ' value={dnsState} placeholder='Cédula de usuario' />
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

                    <img 
                        style={{
                            width: '50%',
                            height: '50%'
                        }} 
                        src='' 
                        alt='camera-result' 
                        ref={imageCameraRef} 
                    />
                </div>
            </div>
            
        </div>
    )
}

export default App
