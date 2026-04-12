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
				return undefined;
			}

			return decompressFromUTF16(value.slice(PREFIX.length)) ?? undefined;
		}
	};
}
