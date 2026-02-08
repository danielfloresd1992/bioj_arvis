import { useState, useEffect, useRef } from 'react';

const mounths = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'
];


const dayWeek = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado'
];



export default function DateComponent(){


    const hourRef = useRef(null);
    const dateRef = useRef(null);


    useEffect(() => {



        const interval = setInterval(() => {
            const datenow = new Date();
            let day = datenow.getDay(); // devuelve número de 0 a 6 
            const date = datenow.getDate();
            const mount = datenow.getMonth();
            const year = datenow.getFullYear ()

            let seconds = `0${datenow.getSeconds()}`
            let minutes =`0${datenow.getMinutes()}`;
            let hours = `0${datenow.getHours()}`;
            if(date.length > 2) date.slice(1);
            if(hours.length > 2) hours = hours.slice(1); 
            if(minutes.length > 2) minutes = minutes.slice(1); 
            if(seconds.length > 2) seconds = seconds.slice(1); 
       
            if(dateRef.current) dateRef.current.textContent =`${dayWeek[day]} ${date} de ${mounths[mount]} del ${year}`;
            if(hourRef.current) hourRef.current.textContent = `${hours}:${minutes}:${seconds}`;

        }, 1000);

        () => {
            clearImmediate(interval);
        }
    }, []);


    return(
        <div style={{
            width: '100%'
        }}>
            <div ref={dateRef}
                style={{
                    fontSize: '1.2rem',
                    color: '#333333'
                }}
            >Nov Thurs 2011</div>
            <div ref={hourRef}
                style={{
                    fontSize: '1.7rem',
                    color: '#4f4f4f',
                    fontWeight: 500,
                }}
            >00:00:00</div>
        </div>
    )
}