import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

const at=(p:string)=>fileURLToPath(new URL(p,import.meta.url));
export default defineConfig({
  root:at('./pages'),
  base:'./',
  publicDir:at('./public'),
  plugins:[react()],
  resolve:{alias:{'@':at('./')}},
  build:{outDir:at('./docs'),emptyOutDir:true},
});
