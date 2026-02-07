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
                        width: '30%',
                        padding: '.5rem',
                        display: 'flex',
                        gap: '1rem',
                        flexDirection: 'column'
                    }}
                >
                    <CustomInputNumeric />
                    <CustomNumerPad />
                </div>
            </div>
            {/*
                <CustomDialog title='Hola Enrique 🚀' />

            */}


        </div>
    )
}

export default App
