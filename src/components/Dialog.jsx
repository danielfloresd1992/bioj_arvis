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
        setState({ open: true, title, typeMessage: type, description });
        setOnCloseCallback(() => closeCallback);
    };

    useImperativeHandle(ref, () => ({ closeDialog, openDialog }));

    if (!state.open) return null;

    const style = DIALOG_STYLES[state.typeMessage] || DIALOG_STYLES.error;

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
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
