/**
 * tableImport.js
 * Detects and parses supported plain-text table formats.
 */

import { parseCSV, detectDelimiter } from './csvImport';
import { assertTextSize, assertDimensions } from './importLimits';
import { createCell } from './tableHelpers';

const FORMAT_MARKDOWN = 'markdown';
const FORMAT_CSV = 'csv';
const FORMAT_TSV = 'tsv';
const FORMAT_UNKNOWN = 'unknown';

/**
 * Splits a Markdown table row while preserving escaped pipe characters.
 * Leading and trailing pipes are treated as optional table delimiters.
 *
 * @param {string} line Markdown table row.
 * @return {Array<string>} Parsed cell values.
 */
function splitMarkdownRow( line ) {
	let value = line.trim();

	if ( value.startsWith( '|' ) ) {
		value = value.slice( 1 );
	}

	let trailingPipeIndex = value.length - 1;
	while (
		trailingPipeIndex >= 0 &&
		/\s/.test( value[ trailingPipeIndex ] )
	) {
		trailingPipeIndex--;
	}

	if (
		trailingPipeIndex >= 0 &&
		value[ trailingPipeIndex ] === '|' &&
		! isEscaped( value, trailingPipeIndex )
	) {
		value = value.slice( 0, trailingPipeIndex );
	}

	const cells = [];
	let current = '';

	for ( let index = 0; index < value.length; index++ ) {
		const character = value[ index ];

		if ( character === '|' && ! isEscaped( value, index ) ) {
			assertDimensions( 1, cells.length + 1 );
			cells.push( current.trim() );
			current = '';
			continue;
		}

		if ( character === '|' && current.endsWith( '\\' ) ) {
			current = current.slice( 0, -1 );
		}

		current += character;
	}

	assertDimensions( 1, cells.length + 1 );
	cells.push( current.trim() );
	return cells;
}

/**
 * Checks whether the character at an index is escaped by an odd number of
 * immediately preceding backslashes.
 *
 * @param {string} value Text to inspect.
 * @param {number} index Character index.
 * @return {boolean} Whether the character is escaped.
 */
function isEscaped( value, index ) {
	let backslashes = 0;

	for ( let cursor = index - 1; cursor >= 0; cursor-- ) {
		if ( value[ cursor ] !== '\\' ) {
			break;
		}
		backslashes++;
	}

	return backslashes % 2 === 1;
}

/**
 * Determines whether parsed cells form a Markdown separator row.
 *
 * @param {Array<string>} cells Parsed Markdown cells.
 * @return {boolean} Whether the row is a Markdown separator.
 */
function isMarkdownSeparator( cells ) {
	return (
		cells.length >= 2 &&
		cells.every( ( cell ) => /^:?-{3,}:?$/.test( cell.trim() ) )
	);
}

/**
 * Locates a standard Markdown table and returns its parsed source rows.
 *
 * @param {string} text Plain text that may contain a Markdown table.
 * @return {Array<Array<string>>|null} Markdown rows, or null when not found.
 */
function* textLines( text ) {
	let start = 0;
	while ( start < text.length ) {
		const end = text.indexOf( '\n', start );
		if ( end === -1 ) {
			yield text.slice( start ).replace( /\r$/, '' );
			return;
		}
		yield text.slice( start, end ).replace( /\r$/, '' );
		start = end + 1;
	}
}
function findMarkdownRows( text ) {
	const lines = textLines( text.replace( /^\uFEFF/, '' ) );
	let previous = '';
	let quoted = false;
	for ( const line of lines ) {
		const wasQuoted = quoted;
		for ( let i = 0; i < line.length; i++ ) {
			if ( line[ i ] === '"' ) {
				if ( quoted && line[ i + 1 ] === '"' ) {
					i++;
				} else {
					quoted = ! quoted;
				}
			}
		}
		// Do not mistake Markdown-looking content inside a CSV quoted record for a table.
		if ( wasQuoted || quoted ) {
			previous = '';
			continue;
		}
		// Only split potential Markdown separators; ordinary CSV/prose is not Markdown.
		if (
			! line.includes( '|' ) ||
			/[^|:\s-]/.test( line ) ||
			! previous.trim()
		) {
			previous = line;
			continue;
		}
		const separator = splitMarkdownRow( line );
		if ( ! isMarkdownSeparator( separator ) ) {
			previous = line;
			continue;
		}
		const header = splitMarkdownRow( previous );
		if ( header.length !== separator.length ) {
			previous = line;
			continue;
		}
		const rows = [ header ];
		let cols = header.length;
		for ( const body of lines ) {
			if ( ! body.trim() ) {
				break;
			}
			const row = splitMarkdownRow( body );
			if ( row.length < 2 ) {
				break;
			}
			cols = Math.max( cols, row.length );
			assertDimensions( rows.length + 1, cols );
			rows.push( row );
		}
		return rows;
	}
	return null;
}
/**
 * Detect and parse once. Limits reject the entire input; no truncated results.
 * @param {string} text Plain-text table input.
 */
export function parseTable( text ) {
	assertTextSize( text );
	const rows = findMarkdownRows( text );
	if ( rows ) {
		const cols = rows.reduce(
			( maximum, row ) => Math.max( maximum, row.length ),
			0
		);
		assertDimensions( rows.length, cols );
		return {
			tableData: rows.map( ( row ) =>
				Array.from( { length: cols }, ( unused, column ) =>
					createCell( row[ column ] ?? '' )
				)
			),
			rows: rows.length,
			cols,
			format: FORMAT_MARKDOWN,
			truncated: false,
		};
	}
	if ( ! text.trim() ) {
		return {
			tableData: [],
			rows: 0,
			cols: 0,
			format: FORMAT_UNKNOWN,
			truncated: false,
		};
	}
	const delimiter = detectDelimiter( text );
	const result = parseCSV( text );
	return {
		...result,
		format: delimiter === '\t' ? FORMAT_TSV : FORMAT_CSV,
		truncated: false,
	};
}
