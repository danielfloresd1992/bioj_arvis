import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import Button from "@mui/material/Button";


//COMPONENTS 
import CustonHeader from './components/Header';
import CustomDialog from './components/Dialog';
import CustomNumerPad from './components/keypad';
import {CustomInputNumeric} from './components/InputCustom'



function App() {


    const [dnsState, setDniState] = useState('')


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



    const submitData = () => {
        alert('envio de data')
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
                    backgroundColor: '#00000000'
                }}
            >   
                <div
                    style={{
                        width: '40%',
                        height: '100%',
                        padding: '.5rem',
                        display: 'flex',
                        gap: '1rem',
                        flexDirection: 'column'
                    }}
                >
                    <CustomInputNumeric value={dnsState} />
                    <CustomNumerPad callbackEvent={handdlerGetDni} />
                </div>
            </div>
            {/*
                <CustomDialog title='Hola Enrique 🚀' />

            */}


        </div>
    )
}

export default App
