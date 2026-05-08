import { useState, forwardRef, useImperativeHandle } from 'react';

const DIALOG_STYLES = {
    error: {
        bg: 'from-red-600 to-red-700',
        glow: 'shadow-red-900/30',
        icon: '/icons8-error-50.png'
    },
    warning: {
        bg: 'from-amber-500 to-amber-600',
        glow: 'shadow-amber-900/30',
        icon: '/icons8-búsqueda-50.png'
    },
    success: {
        bg: 'from-emerald-600 to-emerald-700',
        glow: 'shadow-emerald-900/30',
        icon: '/icons8-recibo-aprobado-50.png'
    }
};

export default forwardRef(function CustomDialog({ callback = () => {} }, ref) {

    const [loading, setLoading] = useState(false);
    const [state, setState] = useState({ open: false, title: '', description: null, typeMessage: 'error' });
    const [onCloseCallback, setOnCloseCallback] = useState(null);

    const closeDialog = () => {
        setState({ open: false, title: '', description: null, typeMessage: 'error' });
        if (onCloseCallback) {
            onCloseCallback();
            setOnCloseCallback(null);
            callback();
        } else {
            callback();
        }
    };

    const openDialog = (title = '', type = 'error', description = null, closeCallback = null) => {
        setLoading(false);
        setState({ open: true, title, typeMessage: type, description });
        setOnCloseCallback(() => closeCallback);
    };

    const openLoading = () => {
        setState({ open: false, title: '', description: null, typeMessage: 'error' });
        setLoading(true);
    };

    const closeLoading = () => setLoading(false);

    useImperativeHandle(ref, () => ({ closeDialog, openDialog, openLoading, closeLoading }));

    if (loading) return (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[90%] max-w-sm bg-[#151b28] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/40 flex flex-col items-center gap-6 px-8 py-10">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-700/50" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 animate-spin" />
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                    <p className="text-slate-100 text-base font-semibold">Procesando solicitud</p>
                    <p className="text-slate-400 text-sm">Esperando respuesta del servidor...</p>
                </div>
            </div>
        </div>
    );

    if (!state.open) return null;

    const style = DIALOG_STYLES[state.typeMessage] || DIALOG_STYLES.error;

    return (
        <div
            className="fixed inset-0 z-1000 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={closeDialog}
        >
            <div
                className={`w-[90%] max-w-md bg-[#151b28] rounded-2xl overflow-hidden shadow-2xl ${style.glow} border border-slate-700/40`}
                onClick={e => e.stopPropagation()}
            >
                <div className={`w-full h-14 bg-gradient-to-r ${style.bg} flex items-center justify-between px-5`}>
                    <h3 className="text-lg font-bold text-white">
                        {state.title}
                    </h3>
                    <img
                        className="w-7 h-7 brightness-0 invert"
                        src={style.icon}
                        alt="dialog-ico"
                    />
                </div>

                <div className="flex flex-col items-center justify-center p-8 min-h-[160px] text-slate-200">
                    {state.description}
                </div>

                <div className="px-5 pb-5">
                    <button
                        onClick={closeDialog}
                        className="w-full py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
});
