/**
 * csvImport.js
 * Parses CSV text into table cell data.
 */

/* global FileReader */

import { __ } from '@wordpress/i18n';
import { createCell } from './tableHelpers';

export const MAX_ROWS = 10000;
export const MAX_COLS = 200;

/**
 * Auto-detects the delimiter used in CSV text.
 *
 * @param {string} text CSV text.
 * @return {string} Detected delimiter.
 */
function detectDelimiter( text ) {
	const firstLine = text.split( /\r?\n/ )[ 0 ] || '';
	const delimiters = [ ',', '\t', ';', '|' ];
	let bestDelimiter = ',';
	let bestCount = 0;

	for ( const d of delimiters ) {
		const count = ( firstLine.match( new RegExp( `\\${ d }`, 'g' ) ) || [] )
			.length;
		if ( count > bestCount ) {
			bestCount = count;
			bestDelimiter = d;
		}
	}
	return bestDelimiter;
}

/**
 * Parses a CSV line respecting quoted fields.
 *
 * @param {string} line      Single CSV line.
 * @param {string} delimiter Delimiter character.
 * @return {Array<string>} Array of field values.
 */
function parseCSVLine( line, delimiter ) {
	const fields = [];
	let current = '';
	let inQuotes = false;

	for ( let i = 0; i < line.length; i++ ) {
		const ch = line[ i ];

		if ( inQuotes ) {
			if ( ch === '"' ) {
				if ( i + 1 < line.length && line[ i + 1 ] === '"' ) {
					current += '"';
					i++; // Skip escaped quote
				} else {
					inQuotes = false;
				}
			} else {
				current += ch;
			}
		} else if ( ch === '"' ) {
			inQuotes = true;
		} else if ( ch === delimiter ) {
			fields.push( current );
			current = '';
		} else {
			current += ch;
		}
	}
	fields.push( current );
	return fields;
}

/**
 * Parses CSV text into a 2-D array of cell objects.
 *
 * @param {string} csvText Raw CSV text content.
 * @return {{ tableData: Array, rows: number, cols: number }} Parsed table data.
 */
export function parseCSV( csvText ) {
	if ( ! csvText || ! csvText.trim() ) {
		return { tableData: [], rows: 0, cols: 0 };
	}

	const lines = csvText.split( /\r?\n/ ).filter( ( line ) => line.trim() );

	if ( lines.length === 0 ) {
		return { tableData: [], rows: 0, cols: 0 };
	}

	const delimiter = detectDelimiter( csvText );
	const parsedRows = lines.map( ( line ) => parseCSVLine( line, delimiter ) );

	// Find max columns
	const maxCols = Math.max( ...parsedRows.map( ( r ) => r.length ) );

	// Convert to cell objects
	const tableData = parsedRows.map( ( fields ) => {
		const row = [];
		for ( let c = 0; c < maxCols; c++ ) {
			row.push( createCell( fields[ c ] || '' ) );
		}
		return row;
	} );

	return { tableData, rows: tableData.length, cols: maxCols };
}

/**
 * Reads a CSV file and returns parsed data.
 *
 * @param {File}     file   The CSV File object.
 * @param {Function} parser Text parser. Defaults to the existing CSV parser.
 * @return {Promise<{ tableData: Array, rows: number, cols: number }>} Parsed file data.
 */
export function readCSVFile( file, parser = parseCSV ) {
	return new Promise( ( resolve, reject ) => {
		const reader = new FileReader();
		reader.onload = ( e ) => {
			try {
				const result = parser( e.target.result );
				resolve( result );
			} catch ( err ) {
				reject( err );
			}
		};
		reader.onerror = () =>
			reject(
				new Error(
					__( 'Failed to read file.', 'wstech-visual-table-builder' )
				)
			);
		reader.readAsText( file );
	} );
}
