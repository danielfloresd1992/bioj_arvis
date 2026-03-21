import { isDesktop } from 'react-device-detect';

export function CustomInputNumeric({ labelText = '', value = '', placeholder = '', changeEvent = () => {} }) {
    return (
        <div className="w-full h-[64px] flex items-center bg-[#131922] border border-slate-700/50 rounded-xl overflow-hidden shrink-0">
            <p className="text-emerald-400 text-base font-bold px-3 shrink-0">
                {labelText}
            </p>

            <div className="flex-1 h-full">
                <input
                    className="w-full h-full bg-transparent text-slate-100 text-xl px-3 outline-none placeholder:text-slate-600 tracking-widest"
                    onFocus={e => e.target.blur()}
                    placeholder={placeholder}
                    value={value}
                    type="text"
                    onKeyDown={(e) => {
                        if (isDesktop) changeEvent(e.key);
                    }}
                />
            </div>

            <div className="h-full w-[56px] bg-emerald-900/40 flex items-center justify-center shrink-0 border-l border-emerald-800/30">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>
    );
}
