/* global FileReader, HTMLAnchorElement */
import { parseCSV, readCSVFile, detectDelimiter } from '../src/utils/csvImport';
import { parseTable } from '../src/utils/tableImport';
import { exportTableAsCSV } from '../src/utils/csvExport';
import {
	importTableFromJSON,
	parseTableJSON,
	exportTableAsJSON,
} from '../src/utils/jsonIO';
import { csvEscape } from '../src/utils/csvSafety';
import {
	assertTextSize,
	MAX_IMPORT_BYTES,
	MAX_CELLS,
} from '../src/utils/importLimits';

const values = ( result ) =>
	result.tableData.map( ( row ) => row.map( ( cell ) => cell.content ) );
const jsonFile = ( data ) => ( { size: 100, text: JSON.stringify( data ) } );
const backup = ( extra = {} ) => ( {
	plugin: 'wstech-visual-table-builder',
	version: 1,
	attributes: { tableData: [ [ 'A', 'B' ] ] },
	...extra,
} );

describe( 'CSV and Smart Import compatibility', () => {
	test.each( [
		[
			'A,B\n1,2',
			[
				[ 'A', 'B' ],
				[ '1', '2' ],
			],
		],
		[
			'A;B\n1;2',
			[
				[ 'A', 'B' ],
				[ '1', '2' ],
			],
		],
		[
			'A\tB\n1\t2',
			[
				[ 'A', 'B' ],
				[ '1', '2' ],
			],
		],
		[
			'A|B\n1|2',
			[
				[ 'A', 'B' ],
				[ '1', '2' ],
			],
		],
		[
			'A,B\r\n1,"x\r\ny"\r\n',
			[
				[ 'A', 'B' ],
				[ '1', 'x\r\ny' ],
			],
		],
		[
			'\uFEFFA,B\n"café","日本語"',
			[
				[ 'A', 'B' ],
				[ 'café', '日本語' ],
			],
		],
		[
			'A,B\n"a,b","a""b"',
			[
				[ 'A', 'B' ],
				[ 'a,b', 'a"b' ],
			],
		],
		[
			',\n"",',
			[
				[ '', '' ],
				[ '', '' ],
			],
		],
		[ '""', [ [ '' ] ] ],
		[
			'A,B\n1\n\n2,3',
			[
				[ 'A', 'B' ],
				[ '1', '' ],
				[ '2', '3' ],
			],
		],
		[
			'A,B\n1,"a\n\nb"',
			[
				[ 'A', 'B' ],
				[ '1', 'a\n\nb' ],
			],
		],
	] )( 'CSV fixture %#', ( text, expected ) =>
		expect( values( parseCSV( text ) ) ).toEqual( expected )
	);
	test.each( [
		[ '"a,b,c";X\n2;3', ';' ],
		[ '"a;|b"\tX\n2\t3', '\t' ],
		[ '"a,b;c"|X\n2|3', '|' ],
		[ '"a;|b",X\n2,3', ',' ],
		[ '\nA;B\n1;2', ';' ],
		[ 'Title\nA;B\n1;2', ';' ],
		[ 'a,b;c', ',' ], // documented deterministic tie
		[ '"a\nb,c,d";X\n1;2', ';' ],
		[ 'no delimiters', ',' ],
	] )( 'delimiter fixture %#', ( text, delimiter ) =>
		expect( detectDelimiter( text ) ).toBe( delimiter )
	);
	test.each( [ 'A,B\n1,"unfinished', 'A,B\n"a"junk,b', 'a"b,c' ] )(
		'malformed CSV rejected: %s',
		( text ) => expect( () => parseCSV( text ) ).toThrow( /Malformed CSV/ )
	);
	test.each( [
		'| Name | Value |\n| --- | --- |\n| Alpha | 1 |',
		'Name | Value\n--- | ---\nAlpha | 1',
		'Here is your table:\n\n```markdown\n| Name | Value |\n| :--- | ---: |\n| Alpha | 1 |\n```',
	] )( 'AI/Markdown fixture %#', ( text ) => {
		const result = parseTable( text );
		expect( result.format ).toBe( 'markdown' );
		expect( values( result ) ).toEqual( [
			[ 'Name', 'Value' ],
			[ 'Alpha', '1' ],
		] );
	} );
	test( 'Markdown escaped pipes', () =>
		expect( values( parseTable( 'A|B\n---|---\nx\\|y|2' ) ) ).toEqual( [
			[ 'A', 'B' ],
			[ 'x|y', '2' ],
		] ) );
	test( 'TSV format identity', () =>
		expect( parseTable( 'A\tB\n1\t2' ).format ).toBe( 'tsv' ) );
	test( 'quoted CSV containing Markdown is still CSV', () => {
		const text =
			'Name,Description\nA,"Intro\n| X | Y |\n| --- | --- |\n| 1 | 2 |\nEnd"';
		expect( parseTable( text ).format ).toBe( 'csv' );
		expect( parseTable( text ).rows ).toBe( 2 );
	} );
	test( 'empty text', () =>
		expect( parseTable( '' ).tableData ).toEqual( [] ) );
} );

describe( 'early resource gates', () => {
	test.each( [ 9999, 10000 ] )( '%i rows accepted', ( rows ) =>
		expect( parseCSV( Array( rows ).fill( 'a' ).join( '\n' ) ).rows ).toBe(
			rows
		)
	);
	test.each( [ 199, 200 ] )( '%i columns accepted', ( cols ) =>
		expect( parseCSV( Array( cols ).fill( 'a' ).join( ',' ) ).cols ).toBe(
			cols
		)
	);
	test( 'exact total cell budget accepted', () => {
		const result = parseCSV(
			Array( 1000 )
				.fill( Array( 200 ).fill( 'a' ).join( ',' ) )
				.join( '\n' )
		);
		expect( result.rows * result.cols ).toBe( MAX_CELLS );
	} );
	test( 'total cell budget exceeded', () =>
		expect( () =>
			parseCSV(
				Array( 1001 )
					.fill( Array( 200 ).fill( 'a' ).join( ',' ) )
					.join( '\n' )
			)
		).toThrow( /cells/ ) );
	test( 'ragged rectangular padding counted', () =>
		expect( () =>
			parseCSV(
				Array( 1001 ).fill( 'a' ).join( '\n' ) +
					'\n' +
					Array( 200 ).fill( 'b' ).join( ',' )
			)
		).toThrow( /cells/ ) );
	test( 'text size boundary', () => {
		expect( () =>
			assertTextSize( 'a'.repeat( MAX_IMPORT_BYTES ) )
		).not.toThrow();
		expect( () => parseCSV( 'a'.repeat( MAX_IMPORT_BYTES + 1 ) ) ).toThrow(
			/10 MiB/
		);
	} );
	test( 'UTF-8 byte budget counts Unicode', () =>
		expect( () =>
			assertTextSize(
				'日'.repeat( Math.floor( MAX_IMPORT_BYTES / 3 ) + 1 )
			)
		).toThrow( /10 MiB/ ) );
	test( 'file reader failure propagated', async () => {
		FileReader.prototype.readAsText = function () {
			this.onerror();
		};
		await expect( readCSVFile( { size: 1 } ) ).rejects.toThrow(
			/read file/
		);
	} );
} );

describe( 'shared spreadsheet-safe CSV policy', () => {
	test.each( [ '＝1+1', '＋SUM(A1)', '－SUM(A1)', '＠SUM(A1)', '\u200b=1' ] )(
		'neutralizes locale/invisible prefix %p',
		( value ) => {
			expect( values( parseCSV( csvEscape( value ) ) )[ 0 ][ 0 ] ).toBe(
				"'" + value
			);
		}
	);
	test( 'HTML/entity text is decoded before editor CSV safety', () => {
		const NativeBlob = global.Blob;
		let output;
		global.Blob = class {
			constructor( parts ) {
				output = parts.join( '' );
			}
		};
		URL.createObjectURL = jest.fn( () => 'blob:test' );
		URL.revokeObjectURL = jest.fn();
		const click = jest
			.spyOn( HTMLAnchorElement.prototype, 'click' )
			.mockImplementation( () => {} );
		try {
			exportTableAsCSV( [
				[ { content: '<strong>&#61;1+1</strong>' } ],
			] );
			expect( values( parseCSV( output ) )[ 0 ][ 0 ] ).toBe( "'=1+1" );
		} finally {
			global.Blob = NativeBlob;
			click.mockRestore();
		}
	} );
	test.each( [
		'=1+1',
		'+SUM(A1)',
		'-SUM(A1)',
		'@SUM(A1)',
		'  =1',
		'\t=1',
		'\r\n+cmd',
		'\u0000@cmd',
	] )( 'neutralizes %p', ( value ) => {
		expect( values( parseCSV( csvEscape( value ) ) )[ 0 ][ 0 ] ).toBe(
			"'" + value
		);
	} );
	test.each( [
		'-10',
		'-10.5',
		'-.5',
		'-1e3',
		'+10',
		'42',
		'normal',
		'https://wstech.in',
		'café',
		'  text  ',
		'"quoted"',
		'a,b',
		'a\rb',
	] )( 'preserves %p', ( value ) => {
		expect( values( parseCSV( csvEscape( value ) ) )[ 0 ][ 0 ] ).toBe(
			value
		);
	} );
	test( 'real editor and visitor download agree', () => {
		const NativeBlob = global.Blob;
		const outputs = [];
		global.Blob = class {
			constructor( parts ) {
				outputs.push( parts.join( '' ) );
			}
		};
		URL.createObjectURL = jest.fn( () => 'blob:test' );
		URL.revokeObjectURL = jest.fn();
		const click = jest
			.spyOn( HTMLAnchorElement.prototype, 'click' )
			.mockImplementation( () => {} );
		try {
			const content = [ '=1+1', '-10', '  @cmd', '"quoted"', 'café' ];
			exportTableAsCSV( [
				content.map( ( text ) => ( { content: text } ) ),
			] );
			document.body.innerHTML =
				'<div class="vtb-wrapper"><table class="vtb-table" data-vtb-csv="true"><tbody><tr></tr></tbody></table><button class="vtb-csv-btn">CSV</button></div>';
			content.forEach( ( text ) => {
				const cell = document.createElement( 'td' );
				cell.textContent = text;
				document.querySelector( 'tr' ).appendChild( cell );
			} );
			require( '../src/view' );
			document.dispatchEvent( new Event( 'DOMContentLoaded' ) );
			document.querySelector( '.vtb-csv-btn' ).click();
			expect( outputs ).toHaveLength( 2 );
			expect( outputs[ 1 ] ).toBe( outputs[ 0 ] );
		} finally {
			global.Blob = NativeBlob;
			click.mockRestore();
			document.body.innerHTML = '';
		}
	} );
} );

describe( 'JSON schema and legacy compatibility', () => {
	test.each( [
		'wstech-visual-table-builder',
		'wstech-table-builder',
		'visual-table-builder',
	] )( 'accepts supported signature %s', ( plugin ) =>
		expect(
			values( {
				tableData: parseTableJSON(
					JSON.stringify( backup( { plugin } ) )
				).tableData,
			} )
		).toEqual( [ [ 'A', 'B' ] ] )
	);
	test( 'known legacy rows/cell aliases and missing version', () => {
		const data = backup( {
			plugin: 'visual-table-builder',
			version: undefined,
			attributes: {
				tableData: {
					rows: [ [ { content: 'legacy', colSpan: 1, rowSpan: 1 } ] ],
				},
			},
		} );
		expect(
			parseTableJSON( JSON.stringify( data ) ).tableData[ 0 ][ 0 ].content
		).toBe( 'legacy' );
	} );
	test.each( [
		null,
		[],
		{},
		{ plugin: 'unknown' },
		backup( { version: '1' } ),
		backup( { version: undefined } ),
		backup( { attributes: null } ),
		backup( { attributes: { tableData: [] } } ),
		backup( { attributes: { tableData: [ null ] } } ),
	] )( 'invalid structure/version %#', ( data ) =>
		expect( () => parseTableJSON( JSON.stringify( data ) ) ).toThrow()
	);
	test( 'malformed JSON', () =>
		expect( () => parseTableJSON( '{' ) ).toThrow( /Invalid JSON/ ) );
	test( 'oversized JSON rejects before parsing', () =>
		expect( () =>
			parseTableJSON( ' '.repeat( MAX_IMPORT_BYTES + 1 ) )
		).toThrow( /10 MiB/ ) );
	test( 'oversized JSON file rejects before reading', async () => {
		const read = jest.spyOn( FileReader.prototype, 'readAsText' );
		await expect(
			importTableFromJSON( { size: MAX_IMPORT_BYTES + 1 } )
		).rejects.toThrow( /10 MiB/ );
		expect( read ).not.toHaveBeenCalled();
	} );
	test.each( [
		null,
		true,
		[],
		{},
		{ content: {} },
		{ content: 'x', colspan: 0 },
		{ content: 'x', rowspan: 2 },
		{ content: 'x', hidden: 'false' },
		{ content: 'x', styles: [] },
		{ content: 'x', meta: [] },
		{ content: 'x', styles: { color: {} } },
	] )( 'invalid cell %#', ( cell ) =>
		expect( () =>
			parseTableJSON(
				JSON.stringify(
					backup( { attributes: { tableData: [ [ cell ] ] } } )
				)
			)
		).toThrow()
	);
	test.each( [
		[ 'hasHeaderRow', 'false' ],
		[ 'pageSize', 0 ],
		[ 'borderWidth', -1 ],
		[ 'caption', {} ],
	] )( 'invalid attribute %s', ( key, value ) =>
		expect( () =>
			parseTableJSON(
				JSON.stringify(
					backup( {
						attributes: { tableData: [ [ 'x' ] ], [ key ]: value },
					} )
				)
			)
		).toThrow()
	);
	test.each( [
		[ 10001, 1 ],
		[ 1, 201 ],
		[ 1001, 200 ],
	] )( 'dimensions %i x %i rejected', ( rows, cols ) =>
		expect( () =>
			parseTableJSON(
				JSON.stringify(
					backup( {
						attributes: {
							tableData: Array.from( { length: rows }, () =>
								Array( cols ).fill( '' )
							),
						},
					} )
				)
			)
		).toThrow()
	);
	test( 'unknown cell/style/prototype properties not restored', () => {
		const text =
			'{"plugin":"wstech-visual-table-builder","version":1,"attributes":{"tableData":[[{"content":"safe","evil":true,"styles":{"color":"red","position":"fixed"},"__proto__":{"polluted":true}}]],"__proto__":{"polluted":true}}}';
		const attrs = parseTableJSON( text );
		expect( attrs.tableData[ 0 ][ 0 ] ).not.toHaveProperty( 'evil' );
		expect( attrs.tableData[ 0 ][ 0 ].styles ).not.toHaveProperty(
			'position'
		);
		expect( {}.polluted ).toBeUndefined();
	} );
	test( 'actual JSON export/import round trip preserves recognized attributes', () => {
		const NativeBlob = global.Blob;
		let output;
		global.Blob = class {
			constructor( parts ) {
				output = parts.join( '' );
			}
		};
		URL.createObjectURL = jest.fn( () => 'blob:test' );
		URL.revokeObjectURL = jest.fn();
		const click = jest
			.spyOn( HTMLAnchorElement.prototype, 'click' )
			.mockImplementation( () => {} );
		try {
			const attrs = {
				tableData: [ [ 'C:\\folder\\"quoted"', '日本語' ] ],
				caption: 'Backup',
				hasHeaderRow: false,
				borderWidth: 0,
				pageSize: 10,
				theme: 'default',
				sortable: true,
				frontendCsvExport: true,
			};
			exportTableAsJSON( attrs );
			const restored = parseTableJSON( output );
			expect( restored ).toMatchObject( {
				caption: 'Backup',
				hasHeaderRow: false,
				borderWidth: 0,
				pageSize: 10,
				theme: 'default',
				sortable: true,
				frontendCsvExport: true,
			} );
			expect(
				restored.tableData[ 0 ].map( ( cell ) => cell.content )
			).toEqual( attrs.tableData[ 0 ] );
		} finally {
			global.Blob = NativeBlob;
			click.mockRestore();
		}
	} );
} );

beforeEach( () => {
	global.FileReader = class {
		readAsText( file ) {
			this.onload( { target: { result: file.text } } );
		}
	};
} );

describe( 'B2 reproduced failures', () => {
	test( 'CSV quoted multiline is a single record', () => {
		expect(
			values( parseCSV( 'Name,Description\nA,"Line one\nLine two"' ) )
		).toEqual( [
			[ 'Name', 'Description' ],
			[ 'A', 'Line one\nLine two' ],
		] );
	} );
	test( 'delimiter ignores quoted misleading commas', () => {
		expect( values( parseCSV( '"a,b,c,d";Value\nTest;2' ) ) ).toEqual( [
			[ 'a,b,c,d', 'Value' ],
			[ 'Test', '2' ],
		] );
	} );
	test( 'rejects unterminated CSV rather than accepting partial data', () => {
		expect( () => parseCSV( 'A,B\n1,"broken' ) ).toThrow();
	} );
	test( 'row limit rejects intact', () => {
		expect( () =>
			parseCSV( Array( 10001 ).fill( 'a' ).join( '\n' ) )
		).toThrow();
	} );
	test( 'column limit rejects intact', () => {
		expect( () =>
			parseCSV( Array( 201 ).fill( 'a' ).join( ',' ) )
		).toThrow();
	} );
	test( 'Markdown limit rejects rather than truncating', () => {
		expect( () =>
			parseTable(
				'|A|B|\n|---|---|\n' +
					Array( 10000 ).fill( '|1|2|' ).join( '\n' )
			)
		).toThrow();
	} );
	test( 'file size rejected before reading', async () => {
		const read = jest.spyOn( FileReader.prototype, 'readAsText' );
		await expect(
			readCSVFile( { size: 10 * 1024 * 1024 + 1, text: 'a,b' } )
		).rejects.toThrow();
		expect( read ).not.toHaveBeenCalled();
	} );
	test( 'unsupported future JSON version rejected', async () => {
		await expect(
			importTableFromJSON( jsonFile( backup( { version: 2 } ) ) )
		).rejects.toThrow();
	} );
	test( 'malformed JSON cell rejected', async () => {
		await expect(
			importTableFromJSON(
				jsonFile(
					backup( {
						attributes: { tableData: [ [ { content: {} } ] ] },
					} )
				)
			)
		).rejects.toThrow();
	} );
	test( 'unknown attributes cannot be restored', async () => {
		const result = await importTableFromJSON(
			jsonFile(
				backup( {
					attributes: {
						tableData: [ [ 'A' ] ],
						arbitrary: 'bad',
						tableId: 123,
					},
				} )
			)
		);
		expect( result ).not.toHaveProperty( 'arbitrary' );
		expect( result ).not.toHaveProperty( 'tableId' );
	} );
	test( 'CSV export neutralizes formulas while preserving negative numbers', () => {
		const NativeBlob = global.Blob;
		let output;
		global.Blob = class {
			constructor( parts ) {
				output = parts.join( '' );
			}
		};
		URL.createObjectURL = jest.fn( () => 'blob:test' );
		URL.revokeObjectURL = jest.fn();
		const click = jest
			.spyOn( HTMLAnchorElement.prototype, 'click' )
			.mockImplementation( () => {} );
		try {
			exportTableAsCSV( [ [ { content: '=1+1' }, { content: '-10' } ] ] );
			expect( output ).toBe( '\uFEFF"\'=1+1",-10' );
		} finally {
			global.Blob = NativeBlob;
			click.mockRestore();
		}
	} );
} );
