/* global KeyboardEvent */
import '../src/view';

const makeTable = ( rows, pageSize = 0 ) => {
	const wrapper = document.createElement( 'div' );
	wrapper.className = 'vtb-wrapper';
	wrapper.innerHTML = `<input class="vtb-search-input"><table class="vtb-table" data-vtb-sortable="true" data-vtb-searchable="true" data-vtb-pagination="${
		pageSize > 0
	}" data-vtb-page-size="${ pageSize }"><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody></tbody></table><button class="vtb-prev">Previous</button><span class="vtb-page-info"></span><button class="vtb-next">Next</button>`;
	rows.forEach( ( values ) => {
		const tr = document.createElement( 'tr' );
		values.forEach( ( value ) => {
			const td = document.createElement( 'td' );
			td.textContent = value;
			tr.appendChild( td );
		} );
		wrapper.querySelector( 'tbody' ).appendChild( tr );
	} );
	document.body.appendChild( wrapper );
	return wrapper;
};
const initialize = () =>
	document.dispatchEvent( new Event( 'DOMContentLoaded' ) );
const names = ( wrapper ) =>
	Array.from(
		wrapper.querySelectorAll( 'tbody tr' ),
		( row ) => row.cells[ 0 ].textContent
	);
const sort = ( wrapper, column = 1 ) =>
	wrapper.querySelectorAll( 'th' )[ column ].click();
const search = ( wrapper, query ) => {
	const input = wrapper.querySelector( 'input' );
	input.value = query;
	input.dispatchEvent( new Event( 'input' ) );
	jest.advanceTimersByTime( 300 );
};
const page = ( wrapper ) =>
	wrapper.querySelector( '.vtb-page-info' ).textContent;

beforeEach( () => {
	document.body.innerHTML = '';
	jest.useFakeTimers();
} );
afterEach( () => jest.useRealTimers() );

test( 'separate bundle executions keep all paginated rows and one set of controls', () => {
	const wrapper = makeTable(
		[
			[ 'A', '30' ],
			[ 'B', '20' ],
			[ 'C', '10' ],
			[ 'D', '5' ],
		],
		2
	);
	initialize();
	jest.isolateModules( () => require( '../src/view' ) );
	initialize();
	expect( page( wrapper ) ).toBe( 'Page 1 of 2' );
	wrapper.querySelector( '.vtb-next' ).click();
	expect( names( wrapper ) ).toEqual( [ 'C', 'D' ] );
	sort( wrapper );
	expect( names( wrapper ) ).toEqual( [ 'D', 'C' ] );
	search( wrapper, 'A' );
	expect( names( wrapper ) ).toEqual( [ 'A' ] );
} );

describe( 'frontend sorting', () => {
	test.each( [
		[ 'text', [ 'Zulu', 'Alpha', 'beta' ], [ 'B', 'C', 'A' ] ],
		[ 'integers', [ '20', '3', '-10' ], [ 'C', 'B', 'A' ] ],
		[ 'decimals', [ '1.25', '1.2', '-0.5' ], [ 'C', 'B', 'A' ] ],
		[ 'currency', [ '₹20', '₹3', '₹10' ], [ 'B', 'C', 'A' ] ],
		[
			'same-year ISO dates',
			[ '2026-12-01', '2026-01-01', '2026-06-01' ],
			[ 'B', 'C', 'A' ],
		],
		[
			'cross-year ISO dates',
			[ '2027-01-01', '2025-12-31', '2026-02-28' ],
			[ 'B', 'C', 'A' ],
		],
		[
			'text containing digits',
			[ 'Pro 20', 'Basic 3', 'Pro 2' ],
			[ 'B', 'C', 'A' ],
		],
	] )( '%s sorts ascending and descending', ( label, values, expected ) => {
		const wrapper = makeTable(
			values.map( ( value, i ) => [ 'ABC'[ i ], value ] )
		);
		initialize();
		sort( wrapper );
		expect( names( wrapper ) ).toEqual( expected );
		sort( wrapper );
		expect( names( wrapper ) ).toEqual( [ ...expected ].reverse() );
	} );
	test( 'empty values remain last in both directions', () => {
		const wrapper = makeTable( [
			[ 'Empty', '' ],
			[ 'Late', '2026-12-01' ],
			[ 'Early', '2026-01-01' ],
			[ 'Blank', ' ' ],
		] );
		initialize();
		sort( wrapper );
		expect( names( wrapper ) ).toEqual( [
			'Early',
			'Late',
			'Empty',
			'Blank',
		] );
		sort( wrapper );
		expect( names( wrapper ) ).toEqual( [
			'Late',
			'Early',
			'Empty',
			'Blank',
		] );
	} );
	test( 'ties retain original order after direction and search changes', () => {
		const wrapper = makeTable( [
			[ 'Pro A', '10' ],
			[ 'Basic', '2' ],
			[ 'Pro B', '10' ],
		] );
		initialize();
		sort( wrapper );
		sort( wrapper );
		search( wrapper, 'Pro' );
		expect( names( wrapper ) ).toEqual( [ 'Pro A', 'Pro B' ] );
		search( wrapper, '' );
		expect( names( wrapper ) ).toEqual( [ 'Pro A', 'Pro B', 'Basic' ] );
	} );
	test( 'mixed types use consistent ordering, invalid and ambiguous dates remain text', () => {
		const wrapper = makeTable( [
			[ 'Text', 'Zulu' ],
			[ 'Number', '2' ],
			[ 'Date', '2026-01-01' ],
			[ 'Invalid', '2026-02-30' ],
			[ 'Ambiguous', '01/02/2026' ],
		] );
		initialize();
		sort( wrapper );
		expect( names( wrapper ) ).toEqual( [
			'Date',
			'Number',
			'Ambiguous',
			'Invalid',
			'Text',
		] );
		sort( wrapper );
		expect( names( wrapper ) ).toEqual( [
			'Text',
			'Invalid',
			'Ambiguous',
			'Number',
			'Date',
		] );
	} );
} );

describe( 'filter → sort → pagination', () => {
	const rows = [
		[ 'Pro High', '30' ],
		[ 'Basic', '25' ],
		[ 'Pro Low', '10' ],
		[ 'Pro Mid', '20' ],
		[ 'Other', '5' ],
	];
	test.each( [ 'asc', 'desc' ] )(
		'active %s sort survives searching and clearing',
		( direction ) => {
			const wrapper = makeTable( rows );
			initialize();
			sort( wrapper );
			if ( direction === 'desc' ) {
				sort( wrapper );
			}
			search( wrapper, 'Pro' );
			const expected = [ 'Pro Low', 'Pro Mid', 'Pro High' ];
			expect( names( wrapper ) ).toEqual(
				direction === 'asc' ? expected : expected.reverse()
			);
			search( wrapper, '' );
			expect( names( wrapper ) ).toEqual(
				direction === 'asc'
					? [ 'Other', 'Pro Low', 'Pro Mid', 'Basic', 'Pro High' ]
					: [ 'Pro High', 'Basic', 'Pro Mid', 'Pro Low', 'Other' ]
			);
			expect(
				wrapper
					.querySelectorAll( 'th' )[ 1 ]
					.getAttribute( 'aria-sort' )
			).toBe( direction === 'asc' ? 'ascending' : 'descending' );
		}
	);
	test( 'sorted page transitions and sorting resets page one', () => {
		const wrapper = makeTable( rows, 2 );
		initialize();
		sort( wrapper );
		expect( names( wrapper ) ).toEqual( [ 'Other', 'Pro Low' ] );
		wrapper.querySelector( '.vtb-next' ).click();
		expect( names( wrapper ) ).toEqual( [ 'Pro Mid', 'Basic' ] );
		expect( page( wrapper ) ).toBe( 'Page 2 of 3' );
		sort( wrapper );
		expect( names( wrapper ) ).toEqual( [ 'Pro High', 'Basic' ] );
		expect( page( wrapper ) ).toBe( 'Page 1 of 3' );
	} );
	test( 'filtered pages retain sorting and clearing restores sorted page one', () => {
		const wrapper = makeTable( rows, 2 );
		initialize();
		sort( wrapper );
		search( wrapper, 'Pro' );
		expect( names( wrapper ) ).toEqual( [ 'Pro Low', 'Pro Mid' ] );
		wrapper.querySelector( '.vtb-next' ).click();
		expect( names( wrapper ) ).toEqual( [ 'Pro High' ] );
		wrapper.querySelector( '.vtb-prev' ).click();
		expect( names( wrapper ) ).toEqual( [ 'Pro Low', 'Pro Mid' ] );
		search( wrapper, '' );
		expect( page( wrapper ) ).toBe( 'Page 1 of 3' );
		expect( names( wrapper ) ).toEqual( [ 'Other', 'Pro Low' ] );
	} );
	test( 'search alone paginates and shrinking/empty results reset safely', () => {
		const wrapper = makeTable( rows, 2 );
		initialize();
		search( wrapper, 'Pro' );
		expect( names( wrapper ) ).toEqual( [ 'Pro High', 'Pro Low' ] );
		wrapper.querySelector( '.vtb-next' ).click();
		expect( names( wrapper ) ).toEqual( [ 'Pro Mid' ] );
		search( wrapper, 'Low' );
		expect( page( wrapper ) ).toBe( 'Page 1 of 1' );
		expect( names( wrapper ) ).toEqual( [ 'Pro Low' ] );
		search( wrapper, 'absent' );
		expect( names( wrapper ) ).toEqual( [] );
		expect( page( wrapper ) ).toBe( 'Page 1 of 1' );
		expect( wrapper.querySelector( '.vtb-next' ).disabled ).toBe( true );
		expect( wrapper.querySelector( '.vtb-prev' ).disabled ).toBe( true );
	} );
	test( 'two tables operate independently', () => {
		const first = makeTable( rows, 2 );
		const second = makeTable( rows, 2 );
		initialize();
		sort( first );
		search( first, 'Pro' );
		first.querySelector( '.vtb-next' ).click();
		expect( names( second ) ).toEqual( [ 'Pro High', 'Basic' ] );
		expect( page( second ) ).toBe( 'Page 1 of 3' );
		expect(
			second.querySelectorAll( 'th' )[ 1 ].getAttribute( 'aria-sort' )
		).toBe( 'none' );
	} );
} );

describe( 'keyboard and initialization', () => {
	test.each( [ 'Enter', ' ' ] )(
		'%s activates a focusable header and updates aria-sort',
		( key ) => {
			const wrapper = makeTable( [
				[ 'High', '20' ],
				[ 'Low', '10' ],
			] );
			initialize();
			const header = wrapper.querySelectorAll( 'th' )[ 1 ];
			expect( header.tabIndex ).toBe( 0 );
			header.focus();
			expect( document.activeElement ).toBe( header );
			header.dispatchEvent(
				new KeyboardEvent( 'keydown', {
					key,
					bubbles: true,
					cancelable: true,
				} )
			);
			expect( names( wrapper ) ).toEqual( [ 'Low', 'High' ] );
			expect( header.getAttribute( 'aria-sort' ) ).toBe( 'ascending' );
			header.dispatchEvent(
				new KeyboardEvent( 'keydown', {
					key,
					bubbles: true,
					cancelable: true,
				} )
			);
			expect( header.getAttribute( 'aria-sort' ) ).toBe( 'descending' );
		}
	);
	test( 'reinitialization does not duplicate sort or pagination handlers', () => {
		const wrapper = makeTable(
			[
				[ 'High', '30' ],
				[ 'Low', '10' ],
				[ 'Mid', '20' ],
			],
			1
		);
		initialize();
		initialize();
		sort( wrapper );
		expect( names( wrapper ) ).toEqual( [ 'Low' ] );
		expect(
			wrapper.querySelectorAll( 'th' )[ 1 ].getAttribute( 'aria-sort' )
		).toBe( 'ascending' );
		wrapper.querySelector( '.vtb-next' ).click();
		expect( names( wrapper ) ).toEqual( [ 'Mid' ] );
	} );
} );
