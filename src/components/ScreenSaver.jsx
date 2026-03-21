import { useState, useEffect, useMemo } from 'react';

const ANIMATIONS = ['matrix', 'orbits', 'breathe', 'waves'];

function MatrixRain() {
    const columns = useMemo(() => {
        return Array.from({ length: 18 }, (_, i) => ({
            id: i,
            left: `${(i / 18) * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${2 + Math.random() * 4}s`,
            chars: Array.from({ length: 8 + Math.floor(Math.random() * 12) }, () =>
                String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))
            ).join('\n'),
        }));
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden">
            {columns.map(col => (
                <div
                    key={col.id}
                    className="absolute top-0 text-emerald-500/50 text-xs font-mono whitespace-pre leading-5"
                    style={{
                        left: col.left,
                        animation: `matrix-fall ${col.duration} ${col.delay} linear infinite`,
                    }}
                >
                    {col.chars}
                </div>
            ))}
        </div>
    );
}

function OrbitAnimation() {
    const dots = useMemo(() =>
        Array.from({ length: 8 }, (_, i) => ({
            id: i,
            size: 6 + Math.random() * 10,
            duration: `${3 + i * 0.8}s`,
            delay: `${i * 0.4}s`,
            radius: 40 + i * 15,
            color: i % 2 === 0 ? 'bg-emerald-500/40' : 'bg-teal-400/30',
        }))
    , []);

    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-40 h-40">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-emerald-400/60" style={{ animation: 'breathe 3s ease-in-out infinite' }} />
                </div>
                {dots.map(dot => (
                    <div
                        key={dot.id}
                        className="absolute top-1/2 left-1/2"
                        style={{
                            width: dot.size,
                            height: dot.size,
                            marginLeft: -dot.size / 2,
                            marginTop: -dot.size / 2,
                            animation: `orbit ${dot.duration} ${dot.delay} linear infinite`,
                            '--tw-translate-x': `${dot.radius}px`,
                        }}
                    >
                        <div className={`w-full h-full rounded-full ${dot.color}`} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function BreatheAnimation() {
    const rings = useMemo(() =>
        Array.from({ length: 5 }, (_, i) => ({
            id: i,
            size: 60 + i * 50,
            delay: `${i * 0.6}s`,
        }))
    , []);

    return (
        <div className="absolute inset-0 flex items-center justify-center">
            {rings.map(ring => (
                <div
                    key={ring.id}
                    className="absolute rounded-full border border-emerald-500/20"
                    style={{
                        width: ring.size,
                        height: ring.size,
                        animation: `pulse-ring 3s ${ring.delay} ease-out infinite`,
                    }}
                />
            ))}
            <div className="flex flex-col items-center gap-2 z-10">
                <img src="/logojarvis.webp" alt="logo" className="w-12 h-12 object-contain opacity-40" style={{ animation: 'breathe 4s ease-in-out infinite' }} />
                <p className="text-emerald-600/50 text-xs font-medium tracking-widest uppercase">BioJarvis</p>
            </div>
        </div>
    );
}

function WaveAnimation() {
    const bars = useMemo(() =>
        Array.from({ length: 30 }, (_, i) => ({
            id: i,
            delay: `${i * 0.08}s`,
        }))
    , []);

    return (
        <div className="absolute inset-0 flex items-end justify-center gap-[3px] pb-8 px-4">
            {bars.map(bar => (
                <div
                    key={bar.id}
                    className="flex-1 bg-emerald-600/25 rounded-t-sm"
                    style={{
                        height: '30%',
                        animation: `breathe 2s ${bar.delay} ease-in-out infinite`,
                        transformOrigin: 'bottom',
                    }}
                />
            ))}
        </div>
    );
}

const ANIMATION_COMPONENTS = {
    matrix: MatrixRain,
    orbits: OrbitAnimation,
    breathe: BreatheAnimation,
    waves: WaveAnimation,
};

export default function ScreenSaver({ visible = false }) {
    const [animationType, setAnimationType] = useState(() =>
        ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)]
    );

    useEffect(() => {
        if (visible) {
            setAnimationType(ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)]);
        }
    }, [visible]);

    if (!visible) return null;

    const AnimComponent = ANIMATION_COMPONENTS[animationType];

    return (
        <div className="absolute inset-0 bg-[#0a0e13] rounded-2xl overflow-hidden flex items-center justify-center z-10">
            <AnimComponent />
        </div>
    );
}
