/** Bounded CSV records: quoted newlines are field content, not records. */
import { __ } from '@wordpress/i18n';
import { createCell } from './tableHelpers';
import {
	assertTextSize,
	assertDimensions,
	readImportFile,
} from './importLimits';
export { MAX_ROWS, MAX_COLS } from './importLimits';
/**
 * Sample at most 64 KiB / 20 records. Ties prefer comma, tab, semicolon, pipe.
 * @param {string} text CSV text to sample.
 */
export function detectDelimiter( text ) {
	const delimiters = [ ',', '\t', ';', '|' ];
	const counts = delimiters.map( () => [] );
	let current = delimiters.map( () => 0 );
	let quoted = false;
	let nonempty = false;
	let records = 0;
	for ( let i = 0; i < Math.min( text.length, 65536 ) && records < 20; i++ ) {
		const ch = text[ i ];
		if ( ch === '"' ) {
			if ( quoted && text[ i + 1 ] === '"' ) {
				i++;
			} else {
				quoted = ! quoted;
			}
		}
		if ( ! quoted && ( ch === '\r' || ch === '\n' ) ) {
			if ( nonempty ) {
				current.forEach( ( count, index ) =>
					counts[ index ].push( count )
				);
				records++;
			}
			current = delimiters.map( () => 0 );
			nonempty = false;
			if ( ch === '\r' && text[ i + 1 ] === '\n' ) {
				i++;
			}
		} else {
			if ( ch.trim() ) {
				nonempty = true;
			}
			if ( ! quoted ) {
				const index = delimiters.indexOf( ch );
				if ( index >= 0 ) {
					current[ index ]++;
					nonempty = true;
				}
			}
		}
	}
	if ( nonempty && records < 20 ) {
		current.forEach( ( count, index ) => counts[ index ].push( count ) );
	}
	let best = 0;
	let bestScore = 0;
	counts.forEach( ( rows, index ) => {
		const frequencies = new Map();
		rows.filter( ( count ) => count > 0 ).forEach( ( count ) =>
			frequencies.set( count, ( frequencies.get( count ) || 0 ) + 1 )
		);
		let score = 0;
		frequencies.forEach( ( frequency, count ) => {
			score = Math.max(
				score,
				frequency * 1000 + Math.min( count, 999 )
			);
		} );
		if ( score > bestScore ) {
			best = index;
			bestScore = score;
		}
	} );
	return delimiters[ best ];
}
export function parseCSV( csvText ) {
	assertTextSize( csvText );
	const text = csvText.replace( /^\uFEFF/, '' );
	if ( ! text.trim() ) {
		return { tableData: [], rows: 0, cols: 0 };
	}
	const delimiter = detectDelimiter( text );
	const records = [];
	let fields = [];
	let field = '';
	let state = 'plain';
	let touched = false;
	let cols = 0;
	const malformed = () => {
		throw new Error(
			__(
				'Malformed CSV quoting. Existing table unchanged.',
				'wstech-visual-table-builder'
			)
		);
	};
	const endField = () => {
		assertDimensions( 1, fields.length + 1 );
		fields.push( field );
		field = '';
		state = 'plain';
	};
	const endRecord = () => {
		if ( touched || field.trim() || fields.length ) {
			endField();
			cols = Math.max( cols, fields.length );
			assertDimensions( records.length + 1, cols );
			records.push( fields );
		}
		fields = [];
		field = '';
		touched = false;
		state = 'plain';
	};
	for ( let i = 0; i < text.length; i++ ) {
		const ch = text[ i ];
		if ( state === 'quoted' ) {
			if ( ch === '"' ) {
				if ( text[ i + 1 ] === '"' ) {
					field += '"';
					i++;
				} else {
					state = 'closed';
				}
			} else {
				field += ch;
			}
		} else if ( ch === delimiter ) {
			endField();
			touched = true;
		} else if ( ch === '\r' || ch === '\n' ) {
			endRecord();
			if ( ch === '\r' && text[ i + 1 ] === '\n' ) {
				i++;
			}
		} else if ( state === 'closed' ) {
			if ( ch !== ' ' && ch !== '\t' ) {
				malformed();
			}
		} else if ( ch === '"' ) {
			if ( field.length ) {
				malformed();
			}
			state = 'quoted';
			touched = true;
		} else {
			field += ch;
		}
	}
	if ( state === 'quoted' ) {
		malformed();
	}
	endRecord();
	const tableData = records.map( ( row ) =>
		Array.from( { length: cols }, ( unused, index ) =>
			createCell( row[ index ] ?? '' )
		)
	);
	return { tableData, rows: records.length, cols };
}
export function readCSVFile( file, parser = parseCSV ) {
	return readImportFile( file, parser );
}
