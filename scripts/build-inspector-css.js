import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const shouldWatch = process.argv.includes('--watch');

async function main() {
	const args = [
		'exec',
		'tailwindcss',
		'-i',
		'./src/lib/inspector/inspector.tailwind.css',
		'-o',
		'./src/lib/inspector/style.css'
	];

	if (shouldWatch) {
		args.push('--watch');
	} else {
		args.push('--minify');
	}

	await execFileAsync('pnpm', args, {
		cwd: ROOT
	});
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
