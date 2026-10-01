/** Validate the existing rectangular grid; never repair or discard user data. */
export class MergeSafetyError extends Error {
	constructor() {
		super( 'Unmerge the affected cells before changing rows or columns.' );
		this.name = 'MergeSafetyError';
	}
}

export function assertTableIntegrity( data, options = {} ) {
	const fail = () => {
		throw new MergeSafetyError();
	};
	const cols = data[ 0 ]?.length;
	if (
		! cols ||
		data.some( ( row ) => ! Array.isArray( row ) || row.length !== cols )
	) {
		fail();
	}
	const covered = new Set();
	const merges = [];
	const footer =
		options.hasFooterRow && data.length > ( options.hasHeaderRow ? 2 : 1 );
	const section = ( r ) => {
		if ( options.hasHeaderRow && r === 0 ) {
			return 'header';
		}
		if ( footer && r === data.length - 1 ) {
			return 'footer';
		}
		return 'body';
	};
	data.forEach( ( row, r ) =>
		row.forEach( ( cell, c ) => {
			if (
				! cell ||
				! Number.isInteger( cell.rowspan ) ||
				cell.rowspan < 1 ||
				! Number.isInteger( cell.colspan ) ||
				cell.colspan < 1
			) {
				fail();
			}
			if ( cell.hidden ) {
				if ( cell.rowspan !== 1 || cell.colspan !== 1 ) {
					fail();
				}
				return;
			}
			const endRow = r + cell.rowspan - 1,
				endCol = c + cell.colspan - 1;
			if (
				endRow >= data.length ||
				endCol >= cols ||
				section( r ) !== section( endRow )
			) {
				fail();
			}
			for ( let rr = r; rr <= endRow; rr++ ) {
				for ( let cc = c; cc <= endCol; cc++ ) {
					const key = `${ rr }:${ cc }`;
					if (
						covered.has( key ) ||
						Boolean( data[ rr ][ cc ]?.hidden ) !==
							( rr !== r || cc !== c )
					) {
						fail();
					}
					covered.add( key );
				}
			}
			if ( endRow !== r || endCol !== c ) {
				merges.push( { row: r, col: c, endRow, endCol } );
			}
		} )
	);
	if ( covered.size !== data.length * cols ) {
		fail();
	}
	return merges;
}

/**
 * Insertions outside a span and edits entirely outside merges keep the model valid.
 * @param {Array}  data      Rectangular grid.
 * @param {string} axis      Row or col.
 * @param {string} operation Insert, delete, duplicate or move.
 * @param {number} index     Source index or insertion boundary.
 * @param {number} target    Move destination.
 */
export function guardStructure( data, axis, operation, index, target = index ) {
	const merges = assertTableIntegrity( data );
	const size = axis === 'row' ? data.length : data[ 0 ].length;
	if (
		! Number.isInteger( index ) ||
		index < 0 ||
		index > size ||
		( operation !== 'insert' && index === size ) ||
		! Number.isInteger( target ) ||
		target < 0 ||
		target >= size
	) {
		// A trailing insertion has no destination row/column to validate.
		if ( operation !== 'insert' || index !== size || target !== index ) {
			throw new MergeSafetyError();
		}
	}
	for ( const merge of merges ) {
		const start = merge[ axis ],
			end = axis === 'row' ? merge.endRow : merge.endCol;
		const touches =
			operation === 'insert'
				? index > start && index <= end
				: Math.min( index, target ) <= end &&
				  Math.max( index, target ) >= start;
		if ( touches ) {
			throw new MergeSafetyError();
		}
	}
}
