/* global FileReader */
import { __, sprintf } from '@wordpress/i18n';
export const MAX_ROWS = 10000;
export const MAX_COLS = 200;
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
// Bound rich editor cell objects, including rectangular padding, to 200,000.
export const MAX_CELLS = 200000;
export function assertFileSize( file ) {
	if ( ! file || file.size > MAX_IMPORT_BYTES ) {
		throw new Error(
			__(
				'Import exceeds the 10 MiB file limit. Existing table unchanged.',
				'wstech-visual-table-builder'
			)
		);
	}
}
export function assertTextSize( text ) {
	if ( typeof text !== 'string' ) {
		throw new Error(
			__( 'Invalid import text.', 'wstech-visual-table-builder' )
		);
	}
	let bytes = text.length;
	if ( bytes <= MAX_IMPORT_BYTES ) {
		bytes = 0;
		for ( let i = 0; i < text.length && bytes <= MAX_IMPORT_BYTES; i++ ) {
			const code = text.charCodeAt( i );
			if ( code < 0x80 ) {
				bytes++;
			} else if ( code < 0x800 ) {
				bytes += 2;
			} else if (
				code >= 0xd800 &&
				code <= 0xdbff &&
				text.charCodeAt( i + 1 ) >= 0xdc00 &&
				text.charCodeAt( i + 1 ) <= 0xdfff
			) {
				bytes += 4;
				i++;
			} else {
				bytes += 3;
			}
		}
	}
	if ( bytes > MAX_IMPORT_BYTES ) {
		throw new Error(
			__(
				'Import exceeds the 10 MiB text limit. Existing table unchanged.',
				'wstech-visual-table-builder'
			)
		);
	}
}
export function assertDimensions( rows, cols ) {
	if ( rows > MAX_ROWS ) {
		throw new Error(
			sprintf(
				/* translators: %d: maximum imported rows. */
				__(
					'Import exceeds %d rows. Existing table unchanged.',
					'wstech-visual-table-builder'
				),
				MAX_ROWS
			)
		);
	}
	if ( cols > MAX_COLS ) {
		throw new Error(
			sprintf(
				/* translators: %d: maximum imported columns. */
				__(
					'Import exceeds %d columns. Existing table unchanged.',
					'wstech-visual-table-builder'
				),
				MAX_COLS
			)
		);
	}
	if ( rows * cols > MAX_CELLS ) {
		throw new Error(
			sprintf(
				/* translators: %d: maximum imported cells. */
				__(
					'Import exceeds %d cells. Existing table unchanged.',
					'wstech-visual-table-builder'
				),
				MAX_CELLS
			)
		);
	}
}
/**
 * Read only after the file-size gate; validate decoded text before parsing.
 * @param {File}     file   Input file.
 * @param {Function} parser Validating parser.
 */
export function readImportFile( file, parser ) {
	return new Promise( ( resolve, reject ) => {
		try {
			assertFileSize( file );
		} catch ( error ) {
			reject( error );
			return;
		}
		const reader = new FileReader();
		reader.onload = ( event ) => {
			try {
				assertTextSize( event.target.result );
				resolve( parser( event.target.result ) );
			} catch ( error ) {
				reject( error );
			}
		};
		reader.onerror = () =>
			reject(
				new Error(
					__(
						'Failed to read file. Existing table unchanged.',
						'wstech-visual-table-builder'
					)
				)
			);
		reader.readAsText( file );
	} );
}
