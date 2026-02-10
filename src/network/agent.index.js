
import axios from 'axios';

// 1. Configurar confianza total en plataformas nativas
if (Capacitor.isNativePlatform()) {
    HTTP.setServerTrustMode('nocheck');
}

/**
 * Estandariza la respuesta del plugin nativo para que luzca como la de Axios
 */
const formatNativeResponse = (res) => ({
    data: typeof res.data === 'string' ? JSON.parse(res.data) : res.data,
    status: res.status,
    headers: res.headers
});

/**
 * Estandariza el error del plugin nativo para que luzca como error.response de Axios
 */
const formatNativeError = (err) => {
    return {
        response: {
            status: err.status,
            data: err.error ? (typeof err.error === 'string' ? JSON.parse(err.error) : err.error) : null,
            headers: err.headers
        },
        isNative: true
    };
};

export default async function httpAgent(config) {
    if (Capacitor.isNativePlatform()) {
        try {
            const response = await HTTP.sendRequest(config.url, {
                method: config.method || 'get',
                data: config?.data,
                headers: config?.headers,
                // El plugin nativo a veces necesita que el tipo de serialización sea explícito
                serializer: config?.method?.toLowerCase() === 'post' ? 'json' : 'urlencoded'
            });

            return formatNativeResponse(response);
        } catch (err) {
            const errorStandardized = formatNativeError(err);
            console.error('Error Nativo Estandarizado:', errorStandardized);
            throw errorStandardized; // Esto lo atrapará el catch de tu función userIsExist
        }
    } else {
        // En navegador usa Axios normal
        return axios(config);
    }
}