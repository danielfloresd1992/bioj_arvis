import { useEffect, useRef } from 'react';

const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const dayNames = [
    'domingo', 'lunes', 'martes', 'miércoles',
    'jueves', 'viernes', 'sábado'
];

export default function DateComponent() {
    const hourRef = useRef(null);
    const dateRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const dayName = dayNames[now.getDay()];
            const date = now.getDate();
            const month = months[now.getMonth()];
            const year = now.getFullYear();

            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            if (dateRef.current) {
                dateRef.current.textContent = `${dayName} ${date} de ${month} del ${year}`;
            }
            if (hourRef.current) {
                hourRef.current.textContent = `${hours}:${minutes}:${seconds}`;
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full shrink-0">
            <p
                ref={dateRef}
                className="text-center text-sm text-slate-400 capitalize"
            >
                ---
            </p>
            <p
                ref={hourRef}
                className="text-center text-3xl font-mono font-bold text-emerald-400 tracking-wider"
            >
                00:00:00
            </p>
        </div>
    );
}
