/**
 * jsonIO.js
 * JSON import / export for full table backup and restore.
 */

import { __ } from '@wordpress/i18n';
import { createCell, normalizeCell } from './tableHelpers';
import metadata from '../block.json';
import {
	assertTextSize,
	assertDimensions,
	readImportFile,
} from './importLimits';

const PLUGIN_SIGNATURE = 'wstech-visual-table-builder';
const LEGACY_PLUGIN_SIGNATURES = [
	'wstech-table-builder',
	'visual-table-builder',
];
const FORMAT_VERSION = 1;

/**
 * Exports the full table state (data + attributes) as a JSON download.
 *
 * @param {Object} attributes Block attributes.
 * @param {string} filename   Download filename.
 */
export function exportTableAsJSON( attributes, filename = 'table-export' ) {
	const payload = {
		plugin: PLUGIN_SIGNATURE,
		version: FORMAT_VERSION,
		exportedAt: new Date().toISOString(),
		attributes: {
			tableData: attributes.tableData,
			caption: attributes.caption || '',
			hasHeaderRow: attributes.hasHeaderRow,
			hasFooterRow: attributes.hasFooterRow,
			theme: attributes.theme,
			borderColor: attributes.borderColor,
			borderWidth: attributes.borderWidth,
			borderStyle: attributes.borderStyle,
			tableWidth: attributes.tableWidth,
			responsive: attributes.responsive,
			sortable: attributes.sortable,
			searchable: attributes.searchable,
			pagination: attributes.pagination,
			pageSize: attributes.pageSize,
			frontendCsvExport: attributes.frontendCsvExport,
			firstColumnHeader: attributes.firstColumnHeader,
			hoverHighlight: attributes.hoverHighlight,
		},
	};

	const json = JSON.stringify( payload, null, 2 );
	const blob = new Blob( [ json ], { type: 'application/json' } );
	const link = document.createElement( 'a' );
	link.href = URL.createObjectURL( blob );
	link.download = `${ filename }.vtb.json`;
	link.style.display = 'none';
	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );
	URL.revokeObjectURL( link.href );
}

/**
 * Imports a .vtb.json file and returns parsed attributes.
 *
 * @param {File} file JSON file to import.
 * @return {Promise<Object>} Parsed attributes from the file.
 */
export function importTableFromJSON( file ) {
	return readImportFile( file, parseTableJSON );
}
const isObject = ( value ) =>
	value !== null && typeof value === 'object' && ! Array.isArray( value );
const invalid = () => {
	throw new Error(
		__(
			'Invalid table backup structure or cell data. Existing table unchanged.',
			'wstech-visual-table-builder'
		)
	);
};
/**
 * Validate the entire backup before normalization or handing it to the editor.
 * @param {string} text JSON backup text.
 */
export function parseTableJSON( text ) {
	assertTextSize( text );
	let data;
	try {
		data = JSON.parse( text.replace( /^\uFEFF/, '' ) );
	} catch ( error ) {
		throw new Error(
			__(
				'Invalid JSON. Existing table unchanged.',
				'wstech-visual-table-builder'
			)
		);
	}
	if (
		! isObject( data ) ||
		( data.plugin !== PLUGIN_SIGNATURE &&
			! LEGACY_PLUGIN_SIGNATURES.includes( data.plugin ) )
	) {
		throw new Error(
			__(
				'Invalid file: Not a WSTech Table Builder export.',
				'wstech-visual-table-builder'
			)
		);
	}
	// Legacy signatures used the same attributes shape; missing version means version 1.
	const legacy = LEGACY_PLUGIN_SIGNATURES.includes( data.plugin );
	if (
		data.version !== FORMAT_VERSION &&
		! ( legacy && data.version === undefined )
	) {
		throw new Error(
			__(
				'Unsupported table backup version. Existing table unchanged.',
				'wstech-visual-table-builder'
			)
		);
	}
	if ( ! isObject( data.attributes ) ) {
		invalid();
	}
	const raw = data.attributes.tableData;
	const rows = isObject( raw ) ? raw.rows : raw;
	if ( ! Array.isArray( rows ) || ! rows.length ) {
		invalid();
	}
	assertDimensions( rows.length, 1 );
	let cols = 0;
	for ( const row of rows ) {
		if ( ! Array.isArray( row ) || ! row.length ) {
			invalid();
		}
		cols = Math.max( cols, row.length );
		assertDimensions( rows.length, cols );
	}
	const styleKeys = new Set( Object.keys( createCell().styles ) );
	const tableData = rows.map( ( row, rowIndex ) =>
		row.map( ( cell, column ) => {
			if (
				typeof cell === 'string' ||
				( typeof cell === 'number' && Number.isFinite( cell ) )
			) {
				return normalizeCell( cell );
			}
			if (
				! isObject( cell ) ||
				( typeof cell.content !== 'string' &&
					typeof cell.content !== 'number' ) ||
				( typeof cell.content === 'number' &&
					! Number.isFinite( cell.content ) )
			) {
				invalid();
			}
			const colspan = cell.colspan ?? cell.colSpan ?? 1;
			const rowspan = cell.rowspan ?? cell.rowSpan ?? 1;
			if (
				! Number.isInteger( colspan ) ||
				colspan < 1 ||
				colspan > cols - column ||
				! Number.isInteger( rowspan ) ||
				rowspan < 1 ||
				rowspan > rows.length - rowIndex
			) {
				invalid();
			}
			if (
				cell.hidden !== undefined &&
				typeof cell.hidden !== 'boolean'
			) {
				invalid();
			}
			if ( cell.styles !== undefined && ! isObject( cell.styles ) ) {
				invalid();
			}
			if ( cell.meta !== undefined && ! isObject( cell.meta ) ) {
				invalid();
			}
			const styles = {};
			for ( const key of styleKeys ) {
				if ( Object.hasOwn( cell.styles || {}, key ) ) {
					const value = cell.styles[ key ];
					if (
						typeof value !== 'string' &&
						( typeof value !== 'number' ||
							! Number.isFinite( value ) )
					) {
						invalid();
					}
					styles[ key ] = value;
				}
			}
			return normalizeCell( {
				content: String( cell.content ),
				colspan,
				rowspan,
				hidden: cell.hidden ?? false,
				styles,
				meta: {},
			} );
		} )
	);
	// Ragged legacy arrays are padded only after the rectangular budget passed.
	tableData.forEach( ( row ) => {
		while ( row.length < cols ) {
			row.push( createCell() );
		}
	} );
	const attrs = { tableData };
	for ( const [ key, schema ] of Object.entries( metadata.attributes ) ) {
		if (
			key === 'tableData' ||
			key === 'tableId' ||
			! Object.hasOwn( data.attributes, key )
		) {
			continue;
		}
		const value = data.attributes[ key ];
		if (
			typeof value !== schema.type ||
			( schema.type === 'number' && ! Number.isFinite( value ) )
		) {
			invalid();
		}
		if (
			key === 'pageSize' &&
			( ! Number.isInteger( value ) || value < 1 || value > 10000 )
		) {
			invalid();
		}
		if ( key === 'borderWidth' && value < 0 ) {
			invalid();
		}
		attrs[ key ] = value;
	}
	return attrs;
}
