/**
 * save.js
 * Serialises the block to static HTML for post_content.
 * On the frontend, the PHP render_callback overrides this output,
 * but save.js is still needed for Gutenberg validation.
 */

import { useBlockProps, RichText } from '@wordpress/block-editor';
import { buildCellStyle, normalizeTableData } from './utils/tableHelpers';

export default function save( { attributes } ) {
	const {
		tableData: rawTableData,
		caption,
		hasHeaderRow,
		hasFooterRow,
		theme,
		borderColor,
		borderWidth,
		borderStyle,
		tableWidth,
		responsive,
		sortable,
		searchable,
		pagination,
		pageSize,
		frontendCsvExport,
		firstColumnHeader,
		hoverHighlight,
		tableId,
	} = attributes;
	const tableData = normalizeTableData( rawTableData );

	// If referencing a stored CPT table, render_callback handles it.
	if ( tableId > 0 ) {
		return (
			<div { ...useBlockProps.save( { className: 'vtb-block' } ) }>
				<div
					className="vtb-stored-table-ref"
					data-table-id={ tableId }
				/>
			</div>
		);
	}

	if ( ! tableData || ! tableData.length ) {
		return null;
	}

	// Determine row sections
	const totalRows = tableData.length;
	const headerRows = hasHeaderRow ? [ tableData[ 0 ] ] : [];
	const minForFooter = hasHeaderRow ? 2 : 1;
	const footerRows =
		hasFooterRow && totalRows > minForFooter
			? [ tableData[ totalRows - 1 ] ]
			: [];
	const bodyStart = hasHeaderRow ? 1 : 0;
	const bodyEnd = footerRows.length ? totalRows - 1 : totalRows;
	const bodyRows = tableData.slice( bodyStart, bodyEnd );

	// Header labels for data-vtb-label
	const headerLabels = hasHeaderRow
		? tableData[ 0 ].map( ( c ) =>
				( c.content || '' ).replace( /<[^>]*>/g, '' )
		  )
		: [];

	const responsiveClass = responsive === 'stack' ? 'vtb-stack' : 'vtb-scroll';
	const themeClass = `vtb-theme-${ theme || 'default' }`;

	const tableStyle = {
		width: tableWidth || '100%',
		'--vtb-border-color': borderColor || '#dee2e6',
		'--vtb-border-width': `${ borderWidth ?? 1 }px`,
		'--vtb-border-style': borderStyle || 'solid',
	};

	const dataAttrs = {};
	if ( sortable ) {
		dataAttrs[ 'data-vtb-sortable' ] = 'true';
	}
	if ( searchable ) {
		dataAttrs[ 'data-vtb-searchable' ] = 'true';
	}
	if ( pagination ) {
		dataAttrs[ 'data-vtb-pagination' ] = 'true';
		dataAttrs[ 'data-vtb-page-size' ] = String( pageSize || 10 );
	}
	if ( frontendCsvExport ) {
		dataAttrs[ 'data-vtb-csv' ] = 'true';
	}
	if ( hoverHighlight ) {
		dataAttrs[ 'data-vtb-hover' ] = 'true';
	}
	if ( firstColumnHeader ) {
		dataAttrs[ 'data-vtb-first-col' ] = 'true';
	}

	const renderCell = ( cell, rowIndex, colIndex, section ) => {
		if ( cell.hidden ) {
			return null;
		}

		const isHeader = section === 'header';
		const isFirstColHeader =
			firstColumnHeader && colIndex === 0 && section !== 'header';
		const Tag = isHeader || isFirstColHeader ? 'th' : 'td';

		const cellProps = {
			key: colIndex,
			style: buildCellStyle( cell ),
		};

		if ( isHeader ) {
			cellProps.scope = 'col';
		}
		if ( isFirstColHeader ) {
			cellProps.scope = 'row';
		}
		if ( cell.colspan > 1 ) {
			cellProps.colSpan = cell.colspan;
		}
		if ( cell.rowspan > 1 ) {
			cellProps.rowSpan = cell.rowspan;
		}

		// Responsive label
		if ( ! isHeader && ! isFirstColHeader && headerLabels[ colIndex ] ) {
			cellProps[ 'data-vtb-label' ] = headerLabels[ colIndex ];
		}

		return (
			<Tag { ...cellProps }>
				<RichText.Content value={ cell.content || '' } />
			</Tag>
		);
	};

	const renderRowGroup = ( rows, section, Tag ) => {
		if ( ! rows.length ) {
			return null;
		}
		return (
			<Tag>
				{ rows.map( ( row, rIdx ) => (
					<tr key={ rIdx }>
						{ row.map( ( cell, cIdx ) =>
							renderCell( cell, rIdx, cIdx, section )
						) }
					</tr>
				) ) }
			</Tag>
		);
	};

	return (
		<div { ...useBlockProps.save( { className: 'vtb-block' } ) }>
			<div
				className={ `vtb-wrapper ${ themeClass } ${ responsiveClass }` }
			>
				{ searchable && (
					<div className="vtb-search-bar">
						<input
							type="text"
							className="vtb-search-input"
							placeholder="Search table…"
							aria-label="Search table"
						/>
					</div>
				) }

				<div className="vtb-table-container">
					<table
						className="vtb-table"
						style={ tableStyle }
						{ ...dataAttrs }
					>
						{ caption && (
							<caption className="vtb-caption">
								{ caption }
							</caption>
						) }
						{ renderRowGroup( headerRows, 'header', 'thead' ) }
						{ renderRowGroup( bodyRows, 'body', 'tbody' ) }
						{ renderRowGroup( footerRows, 'footer', 'tfoot' ) }
					</table>
				</div>

				{ ( pagination || frontendCsvExport ) && (
					<div className="vtb-footer-bar">
						{ pagination && (
							<div className="vtb-pagination">
								<button
									className="vtb-page-btn vtb-prev"
									aria-label="Previous page"
								>
									← Prev
								</button>
								<span
									className="vtb-page-info"
									aria-live="polite"
								/>
								<button
									className="vtb-page-btn vtb-next"
									aria-label="Next page"
								>
									Next →
								</button>
							</div>
						) }
						{ frontendCsvExport && (
							<button
								className="vtb-csv-btn"
								aria-label="Export table as CSV"
							>
								⬇ Export CSV
							</button>
						) }
					</div>
				) }
			</div>
		</div>
	);
}
