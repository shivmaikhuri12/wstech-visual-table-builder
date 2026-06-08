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
		if ( ! wrapper ) {
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

		const pageSize = parseInt( table.dataset.vtbPageSize || '10', 10 );
		const allRows = Array.from( tbody.querySelectorAll( 'tr' ) );
		let filteredRows = [ ...allRows ];
		let currentPage = 1;
		let sortCol = -1;
		let sortDir = 'asc';

		// ── Sorting ──
		if ( isSortable ) {
			const headers = table.querySelectorAll( 'thead th' );
			headers.forEach( function ( th, idx ) {
				th.style.cursor = 'pointer';
				th.setAttribute( 'role', 'columnheader' );
				th.setAttribute( 'aria-sort', 'none' );
				th.addEventListener( 'click', function () {
					if ( sortCol === idx ) {
						sortDir = sortDir === 'asc' ? 'desc' : 'asc';
					} else {
						sortCol = idx;
						sortDir = 'asc';
					}
					// Reset aria
					headers.forEach( function ( h ) {
						h.setAttribute( 'aria-sort', 'none' );
						h.classList.remove( 'vtb-sort-asc', 'vtb-sort-desc' );
					} );
					th.setAttribute(
						'aria-sort',
						sortDir === 'asc' ? 'ascending' : 'descending'
					);
					th.classList.add(
						sortDir === 'asc' ? 'vtb-sort-asc' : 'vtb-sort-desc'
					);

					filteredRows.sort( function ( a, b ) {
						const cellA = a.children[ idx ];
						const cellB = b.children[ idx ];
						if ( ! cellA || ! cellB ) {
							return 0;
						}
						const valA = ( cellA.textContent || '' ).trim();
						const valB = ( cellB.textContent || '' ).trim();

						// Numeric comparison
						const numA = parseFloat(
							valA.replace( /[^\d.\-]/g, '' )
						);
						const numB = parseFloat(
							valB.replace( /[^\d.\-]/g, '' )
						);
						if ( ! isNaN( numA ) && ! isNaN( numB ) ) {
							return sortDir === 'asc'
								? numA - numB
								: numB - numA;
						}

						// Date comparison
						const dateA = Date.parse( valA );
						const dateB = Date.parse( valB );
						if ( ! isNaN( dateA ) && ! isNaN( dateB ) ) {
							return sortDir === 'asc'
								? dateA - dateB
								: dateB - dateA;
						}

						// String comparison
						const cmp = valA.localeCompare( valB, undefined, {
							numeric: true,
							sensitivity: 'base',
						} );
						return sortDir === 'asc' ? cmp : -cmp;
					} );

					renderRows();
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
						const query = searchInput.value.toLowerCase().trim();
						if ( ! query ) {
							filteredRows = [ ...allRows ];
						} else {
							filteredRows = allRows.filter( function ( row ) {
								return (
									row.textContent
										.toLowerCase()
										.indexOf( query ) !== -1
								);
							} );
						}
						currentPage = 1;
						renderRows();
					}, 300 );
				} );
			}
		}

		// ── Pagination ──
		function renderRows() {
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
						__( 'Page %1$d of %2$d', 'wstech-table-builder' ),
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

	function csvEscape( text ) {
		text = ( text || '' ).trim();
		text = text.replace( /"/g, '""' );
		if (
			text.indexOf( ',' ) !== -1 ||
			text.indexOf( '\n' ) !== -1 ||
			text.indexOf( '"' ) !== -1
		) {
			text = '"' + text + '"';
		}
		return text;
	}
} )();
