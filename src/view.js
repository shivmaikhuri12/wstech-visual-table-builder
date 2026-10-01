import { csvEscape } from './utils/csvSafety';
/**
 * view.js
 * Frontend interactivity for WSTech Visual Table Builder.
 * Handles sorting, searching, pagination, CSV export, and hover.
 * Pure client-side JavaScript — no page reloads.
 */

import { __, sprintf } from '@wordpress/i18n';

( function () {
	'use strict';

	document.addEventListener( 'DOMContentLoaded', function () {
		const tables = document.querySelectorAll( '.vtb-table' );
		tables.forEach( initTable );
	} );

	function initTable( table ) {
		const wrapper = table.closest( '.vtb-wrapper' );
		// Block and shortcode asset handles can load this bundle separately.
		if ( ! wrapper || table.dataset.vtbInitialized === 'true' ) {
			return;
		}

		const isSortable = table.dataset.vtbSortable === 'true';
		const isSearchable = table.dataset.vtbSearchable === 'true';
		const hasPagination = table.dataset.vtbPagination === 'true';
		const hasCsv = table.dataset.vtbCsv === 'true';
		const hasHover = table.dataset.vtbHover === 'true';

		const tbody = table.querySelector( 'tbody' );
		if ( ! tbody ) {
			return;
		}

		table.dataset.vtbInitialized = 'true';
		const pageSize = parseInt( table.dataset.vtbPageSize || '10', 10 );
		const allRows = Array.from( tbody.querySelectorAll( 'tr' ) );
		let filteredRows = [ ...allRows ];
		let query = '';
		const originalOrder = new Map(
			allRows.map( ( row, index ) => [ row, index ] )
		);
		let currentPage = 1;
		let sortCol = -1;
		let sortDir = 'asc';

		// Strict ISO calendar dates only; do not guess regional date formats.
		function sortValue( value ) {
			const text = value.trim();
			if ( ! text ) {
				return { type: 3, value: '' };
			}
			if ( /^\d{4}-\d{2}-\d{2}$/.test( text ) ) {
				const date = new Date( text + 'T00:00:00Z' );
				if (
					! Number.isNaN( date.getTime() ) &&
					date.toISOString().slice( 0, 10 ) === text
				) {
					return { type: 0, value: date.getTime() };
				}
			}
			const numeric = text.replace( /[$\u00a3\u20ac\u20b9,%\s]/g, '' );
			if (
				/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(
					numeric
				) &&
				Number.isFinite( Number( numeric ) )
			) {
				return { type: 1, value: Number( numeric ) };
			}
			return { type: 2, value: text };
		}

		function compareRows( a, b ) {
			const valA = sortValue( a.children[ sortCol ]?.textContent || '' );
			const valB = sortValue( b.children[ sortCol ]?.textContent || '' );
			let comparison;
			// Blanks stay last in both directions. Other mixed types have fixed ranks.
			if ( valA.type === 3 || valB.type === 3 ) {
				return (
					valA.type - valB.type ||
					originalOrder.get( a ) - originalOrder.get( b )
				);
			}
			if ( valA.type !== valB.type ) {
				comparison = valA.type - valB.type;
			} else if ( valA.type === 2 ) {
				comparison = valA.value.localeCompare( valB.value, undefined, {
					numeric: true,
					sensitivity: 'base',
				} );
			} else {
				comparison = valA.value - valB.value;
			}
			return (
				( sortDir === 'asc' ? comparison : -comparison ) ||
				originalOrder.get( a ) - originalOrder.get( b )
			);
		}

		// Sorting: the header retains columnheader semantics and gains keyboard focus.
		if ( isSortable ) {
			const headers = table.querySelectorAll( 'thead th' );
			headers.forEach( function ( th, idx ) {
				th.style.cursor = 'pointer';
				th.setAttribute( 'role', 'columnheader' );
				th.setAttribute( 'tabindex', '0' );
				th.setAttribute( 'aria-sort', 'none' );
				function activateSort() {
					if ( sortCol === idx ) {
						sortDir = sortDir === 'asc' ? 'desc' : 'asc';
					} else {
						sortCol = idx;
						sortDir = 'asc';
					}
					headers.forEach( function ( header ) {
						header.setAttribute( 'aria-sort', 'none' );
						header.classList.remove(
							'vtb-sort-asc',
							'vtb-sort-desc'
						);
					} );
					th.setAttribute(
						'aria-sort',
						sortDir === 'asc' ? 'ascending' : 'descending'
					);
					th.classList.add(
						sortDir === 'asc' ? 'vtb-sort-asc' : 'vtb-sort-desc'
					);
					currentPage = 1;
					renderRows();
				}
				th.addEventListener( 'click', activateSort );
				th.addEventListener( 'keydown', function ( event ) {
					if ( event.key === 'Enter' || event.key === ' ' ) {
						event.preventDefault();
						if ( ! event.repeat ) {
							activateSort();
						}
					}
				} );
			} );
		}

		// ── Search ──
		if ( isSearchable ) {
			const searchInput = wrapper.querySelector( '.vtb-search-input' );
			if ( searchInput ) {
				let debounceTimer;
				searchInput.addEventListener( 'input', function () {
					clearTimeout( debounceTimer );
					debounceTimer = setTimeout( function () {
						query = searchInput.value.toLowerCase().trim();
						currentPage = 1;
						renderRows();
					}, 300 );
				} );
			}
		}

		// ── Pagination ──
		function renderRows() {
			// Always derive results from original rows: filter, active sort, then page.
			filteredRows = allRows.filter(
				( row ) =>
					! query || row.textContent.toLowerCase().includes( query )
			);
			if ( sortCol >= 0 ) {
				filteredRows.sort( compareRows );
			}
			// Remove all tbody rows
			while ( tbody.firstChild ) {
				tbody.removeChild( tbody.firstChild );
			}

			let rowsToShow = filteredRows;

			if ( hasPagination && pageSize > 0 ) {
				const totalPages = Math.ceil( filteredRows.length / pageSize );
				if ( currentPage > totalPages ) {
					currentPage = totalPages || 1;
				}

				const start = ( currentPage - 1 ) * pageSize;
				rowsToShow = filteredRows.slice( start, start + pageSize );

				// Update pagination UI
				const pageInfo = wrapper.querySelector( '.vtb-page-info' );
				if ( pageInfo ) {
					pageInfo.textContent = sprintf(
						/* translators: 1: Current page number, 2: Total pages. */
						__(
							'Page %1$d of %2$d',
							'wstech-visual-table-builder'
						),
						currentPage,
						totalPages || 1
					);
				}

				const prevBtn = wrapper.querySelector( '.vtb-prev' );
				const nextBtn = wrapper.querySelector( '.vtb-next' );
				if ( prevBtn ) {
					prevBtn.disabled = currentPage <= 1;
				}
				if ( nextBtn ) {
					nextBtn.disabled = currentPage >= totalPages;
				}
			}

			rowsToShow.forEach( function ( row ) {
				tbody.appendChild( row );
			} );
		}

		if ( hasPagination ) {
			const prevBtn = wrapper.querySelector( '.vtb-prev' );
			const nextBtn = wrapper.querySelector( '.vtb-next' );

			if ( prevBtn ) {
				prevBtn.addEventListener( 'click', function () {
					if ( currentPage > 1 ) {
						currentPage--;
						renderRows();
					}
				} );
			}

			if ( nextBtn ) {
				nextBtn.addEventListener( 'click', function () {
					const totalPages = Math.ceil(
						filteredRows.length / pageSize
					);
					if ( currentPage < totalPages ) {
						currentPage++;
						renderRows();
					}
				} );
			}
		}

		// ── CSV Export ──
		if ( hasCsv ) {
			const csvBtn = wrapper.querySelector( '.vtb-csv-btn' );
			if ( csvBtn ) {
				csvBtn.addEventListener( 'click', function () {
					const rows = [];
					// Header
					const thead = table.querySelector( 'thead' );
					if ( thead ) {
						const headerRow = [];
						thead
							.querySelectorAll( 'th' )
							.forEach( function ( th ) {
								headerRow.push( csvEscape( th.textContent ) );
							} );
						rows.push( headerRow.join( ',' ) );
					}
					// Body (all, not just visible page)
					allRows.forEach( function ( tr ) {
						const rowCells = [];
						tr.querySelectorAll( 'td, th' ).forEach(
							function ( cell ) {
								rowCells.push( csvEscape( cell.textContent ) );
							}
						);
						rows.push( rowCells.join( ',' ) );
					} );
					// Footer
					const tfoot = table.querySelector( 'tfoot' );
					if ( tfoot ) {
						tfoot
							.querySelectorAll( 'tr' )
							.forEach( function ( tr ) {
								const rowCells = [];
								tr.querySelectorAll( 'td, th' ).forEach(
									function ( cell ) {
										rowCells.push(
											csvEscape( cell.textContent )
										);
									}
								);
								rows.push( rowCells.join( ',' ) );
							} );
					}

					const csv = '\uFEFF' + rows.join( '\n' );
					const blob = new Blob( [ csv ], {
						type: 'text/csv;charset=utf-8;',
					} );
					const link = document.createElement( 'a' );
					link.href = URL.createObjectURL( blob );
					link.download = 'table-export.csv';
					link.style.display = 'none';
					document.body.appendChild( link );
					link.click();
					document.body.removeChild( link );
					URL.revokeObjectURL( link.href );
				} );
			}
		}

		// ── Hover ──
		if ( hasHover ) {
			allRows.forEach( function ( row ) {
				row.addEventListener( 'mouseenter', function () {
					row.classList.add( 'vtb-row-hover' );
				} );
				row.addEventListener( 'mouseleave', function () {
					row.classList.remove( 'vtb-row-hover' );
				} );
			} );
		}

		// Initial render
		renderRows();
	}
} )();
