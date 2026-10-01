import { assertTableIntegrity } from '../src/utils/mergeIntegrity';
import {
	createDefaultTable,
	addColumnBefore,
	addColumnAfter,
	deleteColumn,
	duplicateColumn,
	moveColumn,
	addRowBefore,
	addRowAfter,
	deleteRow,
	duplicateRow,
	moveRow,
} from '../src/utils/tableHelpers';
import { mergeCells, unmergeCells } from '../src/utils/mergeHelpers';

const rectangle = ( r, c, height, width ) =>
	Array.from( { length: height * width }, ( _, i ) => ( {
		row: r + Math.floor( i / width ),
		col: c + ( i % width ),
	} ) );
const base = () =>
	createDefaultTable( 5, 5 ).map( ( row, r ) =>
		row.map( ( cell, c ) => ( { ...cell, content: `R${ r }C${ c }` } ) )
	);
const fixture = ( height = 1, width = 3, r = 1, c = 1 ) =>
	mergeCells( base(), rectangle( r, c, height, width ) );
function expectIntegrity( data ) {
	const coverage = new Map();
	const cols = data[ 0 ].length;
	data.forEach( ( row, r ) => {
		expect( row ).toHaveLength( cols );
		row.forEach( ( cell, c ) => {
			expect( Number.isInteger( cell.rowspan ) && cell.rowspan > 0 ).toBe(
				true
			);
			expect( Number.isInteger( cell.colspan ) && cell.colspan > 0 ).toBe(
				true
			);
			if ( cell.hidden ) {
				return;
			}
			expect( r + cell.rowspan ).toBeLessThanOrEqual( data.length );
			expect( c + cell.colspan ).toBeLessThanOrEqual( cols );
			for ( let rr = r; rr < r + cell.rowspan; rr++ ) {
				for ( let cc = c; cc < c + cell.colspan; cc++ ) {
					const key = `${ rr }:${ cc }`;
					expect( coverage.has( key ) ).toBe( false );
					coverage.set( key, `${ r }:${ c }` );
					expect( data[ rr ][ cc ].hidden ).toBe(
						rr !== r || cc !== c
					);
				}
			}
		} );
	} );
	data.forEach( ( row, r ) =>
		row.forEach( ( cell, c ) =>
			expect( coverage.has( `${ r }:${ c }` ) ).toBe( true )
		)
	);
}
const risks = [
	[
		'horizontal insert inside',
		() => fixture(),
		( d ) => addColumnBefore( d, 2 ),
	],
	[
		'horizontal delete anchor',
		() => fixture(),
		( d ) => deleteColumn( d, 1 ),
	],
	[
		'horizontal delete covered',
		() => fixture(),
		( d ) => deleteColumn( d, 2 ),
	],
	[
		'horizontal duplicate involved',
		() => fixture(),
		( d ) => duplicateColumn( d, 2 ),
	],
	[
		'horizontal move involved',
		() => fixture(),
		( d ) => moveColumn( d, 1, 4 ),
	],
	[
		'horizontal move through',
		() => fixture(),
		( d ) => moveColumn( d, 0, 4 ),
	],
	[
		'vertical insert inside',
		() => fixture( 3, 1 ),
		( d ) => addRowBefore( d, 2 ),
	],
	[
		'vertical delete anchor',
		() => fixture( 3, 1 ),
		( d ) => deleteRow( d, 1 ),
	],
	[
		'vertical delete covered',
		() => fixture( 3, 1 ),
		( d ) => deleteRow( d, 2 ),
	],
	[
		'vertical duplicate involved',
		() => fixture( 3, 1 ),
		( d ) => duplicateRow( d, 2 ),
	],
	[
		'vertical move involved',
		() => fixture( 3, 1 ),
		( d ) => moveRow( d, 1, 4 ),
	],
	[
		'vertical move through',
		() => fixture( 3, 1 ),
		( d ) => moveRow( d, 0, 4 ),
	],
	[ '2D row', () => fixture( 2, 2 ), ( d ) => duplicateRow( d, 1 ) ],
	[ '2D column', () => fixture( 2, 2 ), ( d ) => deleteColumn( d, 2 ) ],
	[
		'first row boundary',
		() => fixture( 2, 2, 0, 0 ),
		( d ) => deleteRow( d, 0 ),
	],
	[
		'last column boundary',
		() => fixture( 2, 2, 3, 3 ),
		( d ) => deleteColumn( d, 4 ),
	],
];
test.each( risks )(
	'%s is guarded without modifying content',
	( _name, make, operation ) => {
		const data = make();
		const before = JSON.stringify( data );
		expectIntegrity( data );
		expect( () => operation( data ) ).toThrow( /unmerge/i );
		expect( JSON.stringify( data ) ).toBe( before );
		expectIntegrity( data );
	}
);
const allowed = [
	[ 'column before', ( d ) => addColumnBefore( d, 0 ) ],
	[ 'column after', ( d ) => addColumnAfter( d, 4 ) ],
	[ 'row before', ( d ) => addRowBefore( d, 0 ) ],
	[ 'row after', ( d ) => addRowAfter( d, 4 ) ],
	[ 'delete unrelated row', ( d ) => deleteRow( d, 4 ) ],
	[ 'delete unrelated column', ( d ) => deleteColumn( d, 4 ) ],
	[ 'duplicate unrelated row', ( d ) => duplicateRow( d, 4 ) ],
	[ 'duplicate unrelated column', ( d ) => duplicateColumn( d, 4 ) ],
];
test.each( allowed )(
	'%s preserves independent merges',
	( _name, operation ) => {
		const data = mergeCells( fixture( 2, 2 ), rectangle( 3, 0, 1, 2 ) );
		const before = JSON.stringify( data );
		const result = operation( data );
		expectIntegrity( result );
		expect( JSON.stringify( data ) ).toBe( before );
		const content = result
			.flat()
			.map( ( c ) => c.content )
			.join( ' ' );
		expect( content ).toContain( 'R1C1 R1C2 R2C1 R2C2' );
		expect( content ).toContain( 'R3C0 R3C1' );
	}
);
test.each( [ moveRow, moveColumn ] )(
	'moving only outside a merge remains valid',
	( operation ) => {
		const data = fixture( 2, 2, 0, 0 );
		const result = operation( data, 3, 4 );
		expect( result ).not.toBe( data );
		expectIntegrity( result );
	}
);
test.each( [
	[ 1, 3 ],
	[ 3, 1 ],
	[ 2, 2 ],
] )(
	'merge/unmerge %s x %s preserves anchor and unrelated content',
	( h, w ) => {
		const data = base(),
			selected = rectangle( 1, 1, h, w ),
			merged = mergeCells( data, selected );
		expectIntegrity( merged );
		expect( merged[ 1 ][ 1 ].content ).toBe(
			selected
				.map( ( { row, col } ) => data[ row ][ col ].content )
				.join( ' ' )
		);
		const unmerged = unmergeCells( merged, 1, 1 );
		expectIntegrity( unmerged );
		expect( unmerged[ 1 ][ 1 ].content ).toBe( merged[ 1 ][ 1 ].content );
		expect( unmerged[ 4 ][ 4 ].content ).toBe( 'R4C4' );
		expectIntegrity( addColumnBefore( addRowBefore( unmerged, 2 ), 2 ) );
	}
);
test( 'merging a partial existing region must not orphan covered cells', () => {
	const data = fixture();
	expect( () => mergeCells( data, rectangle( 1, 0, 1, 2 ) ) ).toThrow(
		/unmerge/i
	);
	expectIntegrity( data );
} );
test.each( [ { hasHeaderRow: true }, { hasFooterRow: true } ] )(
	'merge crossing a row section is guarded',
	( options ) => {
		const data = base(),
			r = options.hasHeaderRow ? 0 : 3;
		expect( () =>
			mergeCells( data, rectangle( r, 1, 2, 1 ), options )
		).toThrow( /unmerge/i );
		expectIntegrity( data );
	}
);

const invalidCases = [
	[
		'orphan hidden',
		( d ) => {
			d[ 0 ][ 0 ].hidden = true;
		},
	],
	[
		'zero span',
		( d ) => {
			d[ 0 ][ 0 ].colspan = 0;
		},
	],
	[
		'fractional span',
		( d ) => {
			d[ 0 ][ 0 ].rowspan = 1.5;
		},
	],
	[
		'out of bounds',
		( d ) => {
			d[ 4 ][ 4 ].colspan = 2;
		},
	],
	[
		'visible covered cell',
		( d ) => {
			d[ 0 ][ 0 ].colspan = 2;
		},
	],
	[
		'overlap',
		( d ) => {
			d[ 0 ][ 0 ].colspan = 2;
			d[ 0 ][ 1 ].colspan = 2;
		},
	],
	[
		'unequal rows',
		( d ) => {
			d[ 0 ].pop();
		},
	],
	[
		'hidden spanning cell',
		( d ) => {
			d[ 0 ][ 0 ].hidden = true;
			d[ 0 ][ 0 ].rowspan = 2;
		},
	],
];
test.each( invalidCases )(
	'validator rejects %s without repair',
	( _name, corrupt ) => {
		const data = base();
		corrupt( data );
		const before = JSON.stringify( data );
		expect( () => assertTableIntegrity( data ) ).toThrow( /unmerge/i );
		expect( () => addRowAfter( data, 4 ) ).toThrow( /unmerge/i );
		expect( JSON.stringify( data ) ).toBe( before );
	}
);
test( 'section validator catches an existing header/body crossing', () => {
	const data = fixture( 2, 1, 0, 1 );
	expect( () =>
		assertTableIntegrity( data, { hasHeaderRow: true } )
	).toThrow( /unmerge/i );
	expectIntegrity( unmergeCells( data, 0, 1 ) );
} );
test.each( [
	[ fixture(), ( d ) => addColumnAfter( d, 1 ) ],
	[ fixture( 3, 1 ), ( d ) => addRowAfter( d, 1 ) ],
] )( 'insert after anchor is guarded', ( data, op ) =>
	expect( () => op( data ) ).toThrow( /unmerge/i )
);
test( 'horizontal header merge stays within its section', () => {
	const data = mergeCells( base(), rectangle( 0, 1, 1, 3 ), {
		hasHeaderRow: true,
	} );
	expect( assertTableIntegrity( data, { hasHeaderRow: true } ) ).toHaveLength(
		1
	);
	expectIntegrity( data );
} );
