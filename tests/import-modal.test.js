/* eslint-disable import/no-extraneous-dependencies -- React test APIs are supplied by the existing @wordpress/scripts test runtime. */
import { createElement } from '@wordpress/element';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { act } from 'react';
import ImportModal from '../src/components/ImportModal';

// Replace visual WordPress controls only; exercise real modal handlers/parsers.
jest.mock( '@wordpress/components', () => {
	const { createElement: el } = require( '@wordpress/element' );
	return {
		Modal: ( { children } ) => el( 'div', null, children ),
		Button: ( { onClick, children } ) =>
			el( 'button', { onClick }, children ),
		Notice: ( { children } ) => el( 'div', { role: 'alert' }, children ),
		TextareaControl: ( { value, onChange } ) =>
			el( 'textarea', {
				value,
				onChange: ( event ) => onChange( event.target.value ),
			} ),
	};
} );
let container;
let root;
let current;
let onImport;
beforeEach( () => {
	global.IS_REACT_ACT_ENVIRONMENT = true;
	jest.useFakeTimers();
	global.FileReader = class {
		readAsText( file ) {
			this.onload( { target: { result: file.text } } );
		}
	};
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	root = createRoot( container );
	current = [ [ { content: 'KEEP ME' } ] ];
	onImport = jest.fn( ( tableData ) => {
		current = tableData;
	} );
	act( () =>
		root.render(
			createElement( ImportModal, {
				isOpen: true,
				onClose: jest.fn(),
				onImport,
			} )
		)
	);
} );
afterEach( () => {
	act( () => root.unmount() );
	container.remove();
	jest.clearAllTimers();
	jest.useRealTimers();
} );
function button( label ) {
	return Array.from( container.querySelectorAll( 'button' ) ).find(
		( item ) => item.textContent.includes( label )
	);
}
function paste( text ) {
	act( () =>
		Simulate.change( container.querySelector( 'textarea' ), {
			target: { value: text },
		} )
	);
	act( () => button( 'Import Table' ).click() );
}
test.each( [
	[ 'A,B\n1,"broken', 'Malformed CSV' ],
	[ Array( 10001 ).fill( 'a' ).join( '\n' ), 'rows' ],
	[ Array( 201 ).fill( 'a' ).join( ',' ), 'columns' ],
	[
		'|A|B|\n|---|---|\n' + Array( 10000 ).fill( '|1|2|' ).join( '\n' ),
		'rows',
	],
	[ 'a'.repeat( 10 * 1024 * 1024 + 1 ), '10 MiB' ],
	[ '', 'Please paste' ],
] )( 'rejected paste keeps existing table %#', ( text, error ) => {
	const original = current;
	paste( text );
	expect( onImport ).not.toHaveBeenCalled();
	expect( current ).toBe( original );
	expect( container.textContent ).toContain( error );
} );
test( 'accepted paste commits once after complete validation', () => {
	paste( 'A,B\n1,"Line one\nLine two"' );
	expect( onImport ).toHaveBeenCalledTimes( 1 );
	expect( current[ 1 ][ 1 ].content ).toBe( 'Line one\nLine two' );
} );
test.each( [
	[ 'csv', { size: 11 * 1024 * 1024, text: 'A,B' }, '10 MiB' ],
	[ 'csv', { size: 10, text: 'A,"broken' }, 'Malformed CSV' ],
	[ 'json', { size: 10, text: '{' }, 'Invalid JSON' ],
	[
		'json',
		{
			size: 10,
			text: '{"plugin":"wstech-visual-table-builder","version":2,"attributes":{"tableData":[["A"]]}}',
		},
		'version',
	],
] )(
	'rejected %s file preserves existing table %#',
	async ( tab, file, error ) => {
		if ( tab === 'json' ) {
			act( () => button( 'JSON Import' ).click() );
		}
		const original = current;
		await act( async () =>
			Simulate.change( container.querySelector( 'input[type="file"]' ), {
				target: { files: [ file ] },
			} )
		);
		expect( onImport ).not.toHaveBeenCalled();
		expect( current ).toBe( original );
		expect( container.textContent ).toContain( error );
	}
);
test( 'JSON attributes committed only after validation', async () => {
	act( () => button( 'JSON Import' ).click() );
	const file = {
		size: 50,
		text: '{"plugin":"wstech-visual-table-builder","version":1,"attributes":{"tableData":[["A"]],"hasHeaderRow":false,"caption":"Backup"}}',
	};
	await act( async () =>
		Simulate.change( container.querySelector( 'input[type="file"]' ), {
			target: { files: [ file ] },
		} )
	);
	expect( onImport ).toHaveBeenCalledTimes( 1 );
	expect( onImport.mock.calls[ 0 ][ 1 ] ).toMatchObject( {
		hasHeaderRow: false,
		caption: 'Backup',
	} );
} );
