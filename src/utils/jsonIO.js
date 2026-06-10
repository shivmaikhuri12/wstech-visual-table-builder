/**
 * jsonIO.js
 * JSON import / export for full table backup and restore.
 */

/* global FileReader */

import { __, sprintf } from '@wordpress/i18n';
import { normalizeTableData } from './tableHelpers';

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
	return new Promise( ( resolve, reject ) => {
		const reader = new FileReader();
		reader.onload = ( e ) => {
			try {
				const data = JSON.parse( e.target.result );

				// Validate signature
				if (
					data.plugin !== PLUGIN_SIGNATURE &&
					! LEGACY_PLUGIN_SIGNATURES.includes( data.plugin )
				) {
					reject(
						new Error(
							__(
								'Invalid file: Not a WSTech Table Builder export.',
								'wstech-visual-table-builder'
							)
						)
					);
					return;
				}

				if ( ! data.attributes || ! data.attributes.tableData ) {
					reject(
						new Error(
							__(
								'Invalid file: No table data found.',
								'wstech-visual-table-builder'
							)
						)
					);
					return;
				}

				// Ensure each cell has all required properties
				const tableData = normalizeTableData(
					data.attributes.tableData
				);

				resolve( {
					...data.attributes,
					tableData,
				} );
			} catch ( err ) {
				reject(
					new Error(
						sprintf(
							/* translators: %s: JSON parser error message. */
							__(
								'Failed to parse JSON: %s',
								'wstech-visual-table-builder'
							),
							err.message
						)
					)
				);
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
