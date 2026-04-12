import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

async function main() {
	await execFileAsync(
		'pnpm',
		[
			'exec',
			'tailwindcss',
			'-i',
			'./src/lib/inspector/inspector.tailwind.css',
			'-o',
			'./src/lib/inspector/style.css',
			'--minify'
		],
		{
			cwd: ROOT
		}
	);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
