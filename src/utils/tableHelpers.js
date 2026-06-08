/**
 * tableHelpers.js
 * Pure helper functions for Visual Table Builder — all table data mutations.
 * No side effects; all functions return new arrays (immutable pattern).
 */

// ---------------------------------------------------------------------------
// CELL CREATION
// ---------------------------------------------------------------------------

/**
 * Creates a single cell object with default properties.
 *
 * @param {string} content - Optional initial HTML content.
 * @return {Object} Cell object.
 */
export function createCell( content = '' ) {
	return {
		content,
		colspan: 1,
		rowspan: 1,
		hidden: false, // true when this cell is covered by a spanning cell
		styles: {
			backgroundColor: '',
			color: '',
			fontSize: '',
			fontWeight: 'normal',
			fontStyle: 'normal',
			textDecoration: 'none',
			textAlign: 'left',
			verticalAlign: 'middle',
			paddingTop: '10',
			paddingRight: '14',
			paddingBottom: '10',
			paddingLeft: '14',
		},
		meta: {}, // Future: conditional formatting, formulas, comments
	};
}

/**
 * Normalizes unknown saved/imported cell data into the current cell shape.
 *
 * @param {*} cell Cell-like value.
 * @return {Object} Normalized cell object.
 */
export function normalizeCell( cell = '' ) {
	const defaults = createCell();

	if ( typeof cell === 'string' || typeof cell === 'number' ) {
		return {
			...defaults,
			content: String( cell ),
		};
	}

	if ( ! cell || typeof cell !== 'object' ) {
		return defaults;
	}

	const colspan = parseInt( cell.colspan ?? cell.colSpan ?? 1, 10 );
	const rowspan = parseInt( cell.rowspan ?? cell.rowSpan ?? 1, 10 );
	const styles =
		cell.styles && typeof cell.styles === 'object' ? cell.styles : {};
	const meta = cell.meta && typeof cell.meta === 'object' ? cell.meta : {};

	return {
		...defaults,
		...cell,
		content: cell.content ?? '',
		colspan: Number.isFinite( colspan ) && colspan > 0 ? colspan : 1,
		rowspan: Number.isFinite( rowspan ) && rowspan > 0 ? rowspan : 1,
		hidden: Boolean( cell.hidden ),
		styles: {
			...defaults.styles,
			...styles,
		},
		meta: {
			...defaults.meta,
			...meta,
		},
	};
}

/**
 * Normalizes saved/imported table data into a 2-D array of cell objects.
 *
 * @param {*} tableData Table-like value.
 * @return {Array} Normalized table data.
 */
export function normalizeTableData( tableData ) {
	const rows = Array.isArray( tableData?.rows ) ? tableData.rows : tableData;

	if ( ! Array.isArray( rows ) ) {
		return [];
	}

	return rows
		.filter( ( row ) => Array.isArray( row ) )
		.map( ( row ) => row.map( ( cell ) => normalizeCell( cell ) ) )
		.filter( ( row ) => row.length > 0 );
}

/**
 * Creates a default table (2-D array of cells).
 *
 * @param {number} rows - Number of rows.
 * @param {number} cols - Number of columns.
 * @return {Array} 2-D array of cell objects.
 */
export function createDefaultTable( rows = 4, cols = 4 ) {
	return Array.from( { length: rows }, () =>
		Array.from( { length: cols }, () => createCell() )
	);
}

// ---------------------------------------------------------------------------
// STYLE BUILDER
// ---------------------------------------------------------------------------

/**
 * Converts a cell's styles object into a React inline style object.
 *
 * @param {Object} cell - Cell object.
 * @return {Object} React style object.
 */
export function buildCellStyle( cell ) {
	const s = cell?.styles;
	if ( ! s ) {
		return {};
	}

	const style = {};

	if ( s.backgroundColor ) {
		style.backgroundColor = s.backgroundColor;
	}
	if ( s.color ) {
		style.color = s.color;
	}
	if ( s.fontSize ) {
		style.fontSize = `${ s.fontSize }px`;
	}
	if ( s.fontWeight && s.fontWeight !== 'normal' ) {
		style.fontWeight = s.fontWeight;
	}
	if ( s.fontStyle && s.fontStyle !== 'normal' ) {
		style.fontStyle = s.fontStyle;
	}
	if ( s.textDecoration && s.textDecoration !== 'none' ) {
		style.textDecoration = s.textDecoration;
	}
	if ( s.textAlign ) {
		style.textAlign = s.textAlign;
	}
	if ( s.verticalAlign ) {
		style.verticalAlign = s.verticalAlign;
	}

	const pt = s.paddingTop ?? '10';
	const pr = s.paddingRight ?? '14';
	const pb = s.paddingBottom ?? '10';
	const pl = s.paddingLeft ?? '14';
	style.padding = `${ pt }px ${ pr }px ${ pb }px ${ pl }px`;

	return style;
}

// ---------------------------------------------------------------------------
// ROW MUTATIONS
// ---------------------------------------------------------------------------

export function addRowAfter( tableData, rowIndex ) {
	const cols = tableData[ 0 ]?.length || 3;
	const newRow = Array.from( { length: cols }, () => createCell() );
	const next = [ ...tableData ];
	next.splice( rowIndex + 1, 0, newRow );
	return next;
}

export function addRowBefore( tableData, rowIndex ) {
	const cols = tableData[ 0 ]?.length || 3;
	const newRow = Array.from( { length: cols }, () => createCell() );
	const next = [ ...tableData ];
	next.splice( rowIndex, 0, newRow );
	return next;
}

export function deleteRow( tableData, rowIndex ) {
	if ( tableData.length <= 1 ) {
		return tableData;
	}
	return tableData.filter( ( _, idx ) => idx !== rowIndex );
}

export function moveRow( tableData, fromIndex, toIndex ) {
	const next = [ ...tableData ];
	const [ moved ] = next.splice( fromIndex, 1 );
	next.splice( toIndex, 0, moved );
	return next;
}

// ---------------------------------------------------------------------------
// COLUMN MUTATIONS
// ---------------------------------------------------------------------------

export function addColumnAfter( tableData, colIndex ) {
	return tableData.map( ( row ) => {
		const next = [ ...row ];
		next.splice( colIndex + 1, 0, createCell() );
		return next;
	} );
}

export function addColumnBefore( tableData, colIndex ) {
	return tableData.map( ( row ) => {
		const next = [ ...row ];
		next.splice( colIndex, 0, createCell() );
		return next;
	} );
}

export function deleteColumn( tableData, colIndex ) {
	if ( tableData[ 0 ]?.length <= 1 ) {
		return tableData;
	}
	return tableData.map( ( row ) =>
		row.filter( ( _, idx ) => idx !== colIndex )
	);
}

export function moveColumn( tableData, fromIndex, toIndex ) {
	return tableData.map( ( row ) => {
		const next = [ ...row ];
		const [ moved ] = next.splice( fromIndex, 1 );
		next.splice( toIndex, 0, moved );
		return next;
	} );
}

// ---------------------------------------------------------------------------
// CELL MUTATIONS
// ---------------------------------------------------------------------------

export function updateCell( tableData, rowIndex, colIndex, updates ) {
	return tableData.map( ( row, rIdx ) =>
		rIdx === rowIndex
			? row.map( ( cell, cIdx ) =>
					cIdx === colIndex ? { ...cell, ...updates } : cell
			  )
			: row
	);
}

export function updateCellStyle( tableData, rowIndex, colIndex, styleUpdates ) {
	const cell = tableData[ rowIndex ]?.[ colIndex ];
	if ( ! cell ) {
		return tableData;
	}
	return updateCell( tableData, rowIndex, colIndex, {
		styles: { ...cell.styles, ...styleUpdates },
	} );
}

/**
 * Duplicates a row and inserts it after the source row.
 *
 * @param {Array}  tableData Current table data.
 * @param {number} rowIndex  Source row index.
 * @return {Array} Updated table data.
 */
export function duplicateRow( tableData, rowIndex ) {
	const rowCopy = tableData[ rowIndex ].map( ( cell ) => ( {
		...cell,
		styles: { ...cell.styles },
	} ) );
	const next = [ ...tableData ];
	next.splice( rowIndex + 1, 0, rowCopy );
	return next;
}

/**
 * Duplicates a column and inserts it after the source column.
 *
 * @param {Array}  tableData Current table data.
 * @param {number} colIndex  Source column index.
 * @return {Array} Updated table data.
 */
export function duplicateColumn( tableData, colIndex ) {
	return tableData.map( ( row ) => {
		const next = [ ...row ];
		const colCopy = {
			...row[ colIndex ],
			styles: { ...row[ colIndex ].styles },
		};
		next.splice( colIndex + 1, 0, colCopy );
		return next;
	} );
}

/**
 * Clears all content from a row, keeping structure.
 *
 * @param {Array}  tableData Current table data.
 * @param {number} rowIndex  Row index.
 * @return {Array} Updated table data.
 */
export function clearRow( tableData, rowIndex ) {
	return tableData.map( ( row, rIdx ) =>
		rIdx === rowIndex
			? row.map( ( cell ) => ( { ...cell, content: '' } ) )
			: row
	);
}

/**
 * Clears all content from a column, keeping structure.
 *
 * @param {Array}  tableData Current table data.
 * @param {number} colIndex  Column index.
 * @return {Array} Updated table data.
 */
export function clearColumn( tableData, colIndex ) {
	return tableData.map( ( row ) =>
		row.map( ( cell, cIdx ) =>
			cIdx === colIndex ? { ...cell, content: '' } : cell
		)
	);
}
