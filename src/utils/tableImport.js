/**
 * tableImport.js
 * Detects and parses supported plain-text table formats.
 */

import { parseCSV, MAX_ROWS, MAX_COLS } from './csvImport';
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
			cells.push( current.trim() );
			current = '';
			continue;
		}

		if ( character === '|' && current.endsWith( '\\' ) ) {
			current = current.slice( 0, -1 );
		}

		current += character;
	}

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
function findMarkdownRows( text ) {
	const lines = text.replace( /^\uFEFF/, '' ).split( /\r?\n/ );

	for ( let index = 1; index < lines.length; index++ ) {
		if ( ! lines[ index - 1 ].trim() || ! lines[ index ].trim() ) {
			continue;
		}

		const header = splitMarkdownRow( lines[ index - 1 ] );
		const separator = splitMarkdownRow( lines[ index ] );

		if (
			header.length < 2 ||
			header.length !== separator.length ||
			! isMarkdownSeparator( separator )
		) {
			continue;
		}

		const rows = [ header ];

		for ( let rowIndex = index + 1; rowIndex < lines.length; rowIndex++ ) {
			const line = lines[ rowIndex ];
			if ( ! line.trim() ) {
				break;
			}

			const row = splitMarkdownRow( line );
			if ( row.length < 2 ) {
				break;
			}
			rows.push( row );
		}

		return rows;
	}

	return null;
}

/**
 * Counts a delimiter on the first non-empty line. This mirrors the delimiter
 * choices supported by the existing CSV parser.
 *
 * @param {string} text      Plain text.
 * @param {string} delimiter Delimiter to count.
 * @return {number} Number of delimiter occurrences.
 */
function countFirstLineDelimiter( text, delimiter ) {
	const firstLine =
		text
			.replace( /^\uFEFF/, '' )
			.split( /\r?\n/ )
			.find( ( line ) => line.trim() ) || '';

	return firstLine.split( delimiter ).length - 1;
}

/**
 * Detects the supported table format without changing the source text.
 *
 * @param {string} text Plain-text table input.
 * @return {string} Internal format identifier.
 */
function detectFormat( text ) {
	if ( ! text || ! text.trim() ) {
		return FORMAT_UNKNOWN;
	}

	if ( findMarkdownRows( text ) ) {
		return FORMAT_MARKDOWN;
	}

	const commaCount = countFirstLineDelimiter( text, ',' );
	const semicolonCount = countFirstLineDelimiter( text, ';' );
	const pipeCount = countFirstLineDelimiter( text, '|' );
	const tabCount = countFirstLineDelimiter( text, '\t' );
	const csvCount = Math.max( commaCount, semicolonCount, pipeCount );

	if ( tabCount > csvCount ) {
		return FORMAT_TSV;
	}

	if ( csvCount > 0 ) {
		return FORMAT_CSV;
	}

	if ( tabCount > 0 ) {
		return FORMAT_TSV;
	}

	if ( text.split( /\r?\n/ ).filter( ( line ) => line.trim() ).length > 1 ) {
		return FORMAT_CSV;
	}

	return FORMAT_UNKNOWN;
}

/**
 * Converts Markdown rows to the existing tableData cell structure.
 *
 * @param {string} text Markdown table text.
 * @return {{ tableData: Array, rows: number, cols: number, truncated: boolean, sourceRows: number, sourceCols: number }} Parsed Markdown result.
 */
function parseMarkdown( text ) {
	const rows = findMarkdownRows( text );
	if ( ! rows || rows.length === 0 ) {
		return {
			tableData: [],
			rows: 0,
			cols: 0,
			truncated: false,
			sourceRows: 0,
			sourceCols: 0,
		};
	}

	const sourceRows = rows.length;
	const sourceCols = rows.reduce(
		( maximum, row ) => Math.max( maximum, row.length ),
		0
	);
	const limitedRows = rows.slice( 0, MAX_ROWS );
	const columnCount = Math.min( sourceCols, MAX_COLS );
	const tableData = limitedRows.map( ( row ) =>
		Array.from( { length: columnCount }, ( unused, columnIndex ) =>
			createCell( row[ columnIndex ] || '' )
		)
	);

	return {
		tableData,
		rows: tableData.length,
		cols: columnCount,
		truncated: sourceRows > MAX_ROWS || sourceCols > MAX_COLS,
		sourceRows,
		sourceCols,
	};
}

/**
 * Detects and parses CSV, TSV, or Markdown table text.
 *
 * @param {string} text Plain-text table input.
 * @return {{ tableData: Array, rows: number, cols: number, truncated: boolean, sourceRows: number, sourceCols: number, format: string }} Parsed table result.
 */
export function parseTable( text ) {
	const format = detectFormat( text );

	if ( format === FORMAT_MARKDOWN ) {
		return {
			...parseMarkdown( text ),
			format,
		};
	}

	if ( format === FORMAT_CSV || format === FORMAT_TSV ) {
		return {
			...parseCSV( text ),
			format,
		};
	}

	return {
		...parseCSV( text ),
		format,
	};
}
