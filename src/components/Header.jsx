export default function CustonHeader() {
    return (
        <header className="w-full h-[72px] bg-gradient-to-r from-[#0d1117] via-[#111827] to-[#0d1117] border-b border-emerald-900/40 px-6 flex items-center justify-between shrink-0 " style={{padding: '0 1rem'}}> 
            <div className="flex items-center gap-3">
                <img
                    src="/image.webp"
                    alt="company-logo"
                    className="h-11 object-contain"
                />
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 bg-emerald-950/50 border border-emerald-800/30 rounded-lg" style={{padding: '.5rem'}}>
                    <img
                        className="w-8 h-8 object-contain"
                        src="/logojarvis.webp"
                        alt="logo-jarvis"
                    />
                    <div>
                        <p className="text-lg font-semibold text-emerald-400 leading-tight tracking-wide">
                            BioJarvis
                        </p>
                        <p className="text-[11px] text-slate-400 leading-tight">
                            Control de entrada y salida
                        </p>
                    </div>
                </div>

                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
        </header>
    );
}
