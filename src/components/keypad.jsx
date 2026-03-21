import { clickSount } from '../libs/audio_content';

export default function NumericKeypad({ callbackEvent = null }) {

    const keys = [7, 8, 9, 4, 5, 6, 1, 2, 3, '⌫', 0, '⏎'];

    const handdlerTouch = (value) => {
        if (typeof callbackEvent === 'function') callbackEvent(String(value));
        clickSount();
    };

    const getKeyStyle = (value) => {
        if (value === '⏎') {
            return 'bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-900/40 active:scale-95 border border-emerald-500/30';
        }
        if (value === '⌫') {
            return 'bg-gradient-to-br from-red-900/60 to-red-950/80 hover:from-red-800/70 hover:to-red-900/80 text-red-300 active:scale-95 border border-red-800/30';
        }
        return 'bg-gradient-to-br from-[#1e2433] to-[#161b26] hover:from-[#252d3f] hover:to-[#1e2433] text-slate-200 active:scale-95 border border-slate-700/40';
    };

    const getLabel = (value) => {
        if (value === '⏎') return 'Entrar';
        if (value === '⌫') return '⌫';
        return value;
    };

    return (
        <div className="flex-1 grid grid-cols-3 gap-2 p-1">
            {keys.map((value, i) => (
                <button
                    key={i}
                    type="button"
                    className={`
                        flex items-center justify-center rounded-xl
                        text-2xl font-semibold cursor-pointer select-none
                        transition-all duration-150 ease-out
                        ${value === '⏎' ? 'text-lg tracking-wider' : ''}
                        ${getKeyStyle(value)}
                    `}
                    onClick={() => handdlerTouch(String(value))}
                >
                    {getLabel(value)}
                </button>
            ))}
        </div>
    );
}
