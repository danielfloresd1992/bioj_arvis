import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import fs from 'fs';
import path from 'path';


// https://vitejs.dev/config/
export default defineConfig({
    server: {
        https: {
            key: fs.readFileSync(path.resolve(__dirname, 'server.key')),
            cert: fs.readFileSync(path.resolve(__dirname, 'server.crt')),
        },
        strictPort: true,
        host: true,
        port: 5173
    },
    plugins: [
        react(),
        basicSsl()
    ],
})