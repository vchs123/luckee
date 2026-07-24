import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

await build({
  entryPoints: [resolve(root, 'workers/app.ts')],
  bundle: true,
  outfile: resolve(root, 'build/client/_worker.js'),
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  conditions: ['workerd', 'worker', 'browser', 'module', 'import'],
  plugins: [
    {
      name: 'resolve-react-router-server-build',
      setup(b) {
        b.onResolve({ filter: /^virtual:react-router\/server-build$/ }, () => ({
          path: resolve(root, 'build/server/index.js'),
        }));
      },
    },
  ],
  define: {
    'import.meta.env.MODE': '"production"',
    'import.meta.env.PROD': 'true',
    'import.meta.env.DEV': 'false',
    'import.meta.env.SSR': 'true',
    'process.env.NODE_ENV': '"production"',
  },
  logLevel: 'info',
});

console.log('✓ Pages Worker bundled → build/client/_worker.js');
