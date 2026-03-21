export default function ShowData({ user = null }) {

    const changeDns = (url) => {
        if (!url) return null;
        if (url.includes('72.68.60.254')) {
            return url.replace('https://72.68.60.254', 'https://amazona365.ddns.net');
        }
        return url;
    };

    if (!user) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-600">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <p className="text-xs">Sin datos de usuario</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 min-h-0 flex items-center justify-center p-2">
                <img
                    className="max-w-full max-h-full object-contain rounded-lg"
                    src={changeDns(user.img)}
                    alt="user-photo"
                />
            </div>
            <div className="shrink-0 p-3 bg-[#131922] border-t border-slate-800/50">
                <p className="text-base font-semibold text-slate-100 truncate">{user.name}</p>
                <p className="text-sm text-emerald-400 font-mono">CI {user.dni}</p>
            </div>
        </div>
    );
}
