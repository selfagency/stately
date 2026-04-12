import lzString from 'lz-string';
import type { PersistCompression } from '../types.js';

const PREFIX = 'lz:';
const { compressToUTF16, decompressFromUTF16 } = lzString;

export function createLzStringCompression(): PersistCompression {
	return {
		compress(value) {
			return `${PREFIX}${compressToUTF16(value)}`;
		},
		decompress(value) {
			if (!value.startsWith(PREFIX)) {
				// Treat unrecognised data as legacy uncompressed text only if it looks like a
				// JSON object — persisted state always serialises to a `{`-prefixed string.
				return value.startsWith('{') ? value : undefined;
			}

			return decompressFromUTF16(value.slice(PREFIX.length)) ?? undefined;
		}
	};
}
