/**
 * csvExport.js
 * Exports table data to CSV format.
 */

/**
 * Converts tableData to CSV string and triggers download.
 *
 * @param {Array}  tableData 2-D array of cell objects.
 * @param {string} filename  Download filename (without extension).
 */
export function exportTableAsCSV( tableData, filename = 'table-export' ) {
	if ( ! tableData || ! tableData.length ) {
		return;
	}

	const rows = tableData.map( ( row ) =>
		row.map( ( cell ) => {
			let content = cell?.content || '';
			// Strip HTML tags
			content = content.replace( /<[^>]*>/g, '' );
			// Decode HTML entities
			const textarea = document.createElement( 'textarea' );
			textarea.innerHTML = content;
			content = textarea.value;
			// Escape double quotes
			content = content.replace( /"/g, '""' );
			// Wrap in quotes if contains comma, newline, or quote
			if (
				content.includes( ',' ) ||
				content.includes( '\n' ) ||
				content.includes( '"' )
			) {
				content = `"${ content }"`;
			}
			return content;
		} )
	);

	const csvContent = rows.map( ( row ) => row.join( ',' ) ).join( '\n' );
	const blob = new Blob( [ '\uFEFF' + csvContent ], {
		type: 'text/csv;charset=utf-8;',
	} );

	const link = document.createElement( 'a' );
	link.href = URL.createObjectURL( blob );
	link.download = `${ filename }.csv`;
	link.style.display = 'none';
	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );
	URL.revokeObjectURL( link.href );
}
