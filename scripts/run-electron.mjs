// Lanza Electron sobre este proyecto. Elimina ELECTRON_RUN_AS_NODE, que algunos entornos
// (p. ej. terminales integrados de VS Code) definen y que haría arrancar Electron como Node.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const electronPath = require('electron');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, [root, ...process.argv.slice(2)], { stdio: 'inherit', env, windowsHide: false });
child.on('exit', (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
