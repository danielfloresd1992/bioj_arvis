import { useState, useEffect, useRef } from 'react';



export default function DateComponent(){


    const hourRef = ref(null);
    


    useEffect(() => {


        const interval = setInterval(() => {
            const date = new Date();

        }, 1000);

        () => {
            clearImmediate(interval);
        }
    }, []);


    return(
        <div style={{
            width: '100%',

        }}>
            <div></div>
            <div></div>
        </div>
    )
}