/**
 * mergeHelpers.js
 * Cell merge / unmerge utilities for Visual Table Builder.
 * Works with the immutable pattern — returns new arrays.
 */

/**
 * Returns the bounding rectangle of a set of selected cells.
 *
 * @param {Array} selectedCells Array of { row, col } objects.
 * @return {{ startRow, endRow, startCol, endCol }} Bounding rectangle.
 */
export function getSelectionBounds( selectedCells ) {
	if ( ! selectedCells || selectedCells.length === 0 ) {
		return null;
	}

	let startRow = Infinity,
		endRow = -Infinity,
		startCol = Infinity,
		endCol = -Infinity;

	for ( const { row, col } of selectedCells ) {
		if ( row < startRow ) {
			startRow = row;
		}
		if ( row > endRow ) {
			endRow = row;
		}
		if ( col < startCol ) {
			startCol = col;
		}
		if ( col > endCol ) {
			endCol = col;
		}
	}

	return { startRow, endRow, startCol, endCol };
}

/**
 * Checks if a rectangular selection can be merged.
 * Validates that the selection is rectangular and contains more than one cell.
 *
 * @param {Array} selectedCells Array of { row, col }.
 * @return {boolean} Whether the selected cells can be merged.
 */
export function canMerge( selectedCells ) {
	if ( ! selectedCells || selectedCells.length < 2 ) {
		return false;
	}

	const bounds = getSelectionBounds( selectedCells );
	if ( ! bounds ) {
		return false;
	}

	const { startRow, endRow, startCol, endCol } = bounds;
	const expectedCount = ( endRow - startRow + 1 ) * ( endCol - startCol + 1 );

	if ( selectedCells.length !== expectedCount ) {
		return false;
	}

	// Verify all cells in the rectangle are selected
	for ( let r = startRow; r <= endRow; r++ ) {
		for ( let c = startCol; c <= endCol; c++ ) {
			const found = selectedCells.some(
				( sc ) => sc.row === r && sc.col === c
			);
			if ( ! found ) {
				return false;
			}
		}
	}

	return true;
}

/**
 * Checks if the selected cell is a merged cell that can be unmerged.
 *
 * @param {Array} selectedCells Single selected cell.
 * @param {Array} tableData     Current table data.
 * @return {boolean} Whether the selected cell can be unmerged.
 */
export function canUnmerge( selectedCells, tableData ) {
	if ( ! selectedCells || selectedCells.length !== 1 ) {
		return false;
	}
	const { row, col } = selectedCells[ 0 ];
	const cell = tableData[ row ]?.[ col ];
	if ( ! cell ) {
		return false;
	}
	return cell.colspan > 1 || cell.rowspan > 1;
}

/**
 * Merges the selected cells into one.
 * The top-left cell keeps content; other cells become hidden.
 *
 * @param {Array} tableData     Current table data.
 * @param {Array} selectedCells Array of { row, col }.
 * @return {Array} Updated table data.
 */
export function mergeCells( tableData, selectedCells ) {
	const bounds = getSelectionBounds( selectedCells );
	if ( ! bounds ) {
		return tableData;
	}

	const { startRow, endRow, startCol, endCol } = bounds;
	const rowSpan = endRow - startRow + 1;
	const colSpan = endCol - startCol + 1;

	// Collect content from all selected cells (non-empty)
	const contents = [];
	for ( let r = startRow; r <= endRow; r++ ) {
		for ( let c = startCol; c <= endCol; c++ ) {
			const cellContent = tableData[ r ][ c ]?.content || '';
			if ( cellContent.trim() ) {
				contents.push( cellContent );
			}
		}
	}

	return tableData.map( ( row, rIdx ) =>
		row.map( ( cell, cIdx ) => {
			if ( rIdx === startRow && cIdx === startCol ) {
				// Master cell: set spans, keep merged content
				return {
					...cell,
					colspan: colSpan,
					rowspan: rowSpan,
					hidden: false,
					content: contents.join( ' ' ),
				};
			}
			if (
				rIdx >= startRow &&
				rIdx <= endRow &&
				cIdx >= startCol &&
				cIdx <= endCol
			) {
				// Covered cell: hide
				return {
					...cell,
					colspan: 1,
					rowspan: 1,
					hidden: true,
					content: '',
				};
			}
			return cell;
		} )
	);
}

/**
 * Unmerges a cell — resets colspan/rowspan to 1 and shows hidden cells.
 *
 * @param {Array}  tableData Current table data.
 * @param {number} row       Row index of the merged master cell.
 * @param {number} col       Column index of the merged master cell.
 * @return {Array} Updated table data.
 */
export function unmergeCells( tableData, row, col ) {
	const cell = tableData[ row ]?.[ col ];
	if ( ! cell ) {
		return tableData;
	}

	const endRow = row + ( cell.rowspan || 1 ) - 1;
	const endCol = col + ( cell.colspan || 1 ) - 1;

	return tableData.map( ( rowData, rIdx ) =>
		rowData.map( ( cellData, cIdx ) => {
			if (
				rIdx >= row &&
				rIdx <= endRow &&
				cIdx >= col &&
				cIdx <= endCol
			) {
				return {
					...cellData,
					colspan: 1,
					rowspan: 1,
					hidden: false,
				};
			}
			return cellData;
		} )
	);
}
