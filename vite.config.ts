import { defineConfig } from 'vite'

import fs from 'fs';

const sslCrt = './certs/localhost+2.pem';
const sslKey = './certs/localhost+2-key.pem';

const key = fs.readFileSync(sslKey);
const cert = fs.readFileSync(sslCrt);

export default defineConfig({
  // ...
  server: {
    https: { key, cert },
    open: '/',
  },
})