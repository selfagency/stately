/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */

export default {
	attributeGroups: ['$CODE_GUIDE'],
	bracketSameLine: true,
	overrides: [
		{
			files: '*.svelte',
			options: {
				parser: 'svelte',
				svelteAllowShorthand: false,
				svelteBracketNewLine: false,
				svelteIndentScriptAndStyle: false,
				svelteSortOrder: 'options-styles-scripts-markup'
			}
		}
	],
	plugins: ['prettier-plugin-svelte', 'prettier-plugin-organize-attributes'],
	printWidth: 100,
	singleQuote: true,
	trailingComma: 'none',
	useTabs: true
};
