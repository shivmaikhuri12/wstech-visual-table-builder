/**
 * edit.js
 * Main editor component for WSTech Visual Table Builder.
 * Handles table rendering, cell editing, context menus, drag-and-drop,
 * merge/unmerge, format toolbar, undo/redo, and keyboard navigation.
 */

import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	useBlockProps,
	RichText,
} from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	ToolbarDropdownMenu,
	Popover,
	ColorPalette,
} from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';

import TableInspector from './inspector/TableInspector';
import ImportModal from './components/ImportModal';
import TemplateModal from './components/TemplateModal';
import { exportTableAsCSV } from './utils/csvExport';
import { exportTableAsJSON } from './utils/jsonIO';
import {
	createDefaultTable,
	normalizeTableData,
	buildCellStyle,
	addRowAfter,
	addRowBefore,
	deleteRow,
	addColumnAfter,
	addColumnBefore,
	deleteColumn,
	duplicateRow,
	duplicateColumn,
	clearRow,
	clearColumn,
	updateCell,
	updateCellStyle,
	moveRow,
	moveColumn,
} from './utils/tableHelpers';
import {
	canMerge,
	canUnmerge,
	mergeCells,
	unmergeCells,
} from './utils/mergeHelpers';

const COLORS = [
	{ name: __( 'White', 'wstech-table-builder' ), color: '#ffffff' },
	{ name: __( 'Light Gray', 'wstech-table-builder' ), color: '#f3f4f6' },
	{ name: __( 'Gray', 'wstech-table-builder' ), color: '#9ca3af' },
	{ name: __( 'Dark', 'wstech-table-builder' ), color: '#374151' },
	{ name: __( 'Black', 'wstech-table-builder' ), color: '#000000' },
	{ name: __( 'Indigo', 'wstech-table-builder' ), color: '#4f46e5' },
	{ name: __( 'Blue', 'wstech-table-builder' ), color: '#2563eb' },
	{ name: __( 'Sky', 'wstech-table-builder' ), color: '#0ea5e9' },
	{ name: __( 'Green', 'wstech-table-builder' ), color: '#16a34a' },
	{ name: __( 'Yellow', 'wstech-table-builder' ), color: '#eab308' },
	{ name: __( 'Orange', 'wstech-table-builder' ), color: '#f97316' },
	{ name: __( 'Red', 'wstech-table-builder' ), color: '#dc2626' },
	{ name: __( 'Pink', 'wstech-table-builder' ), color: '#ec4899' },
	{ name: __( 'Purple', 'wstech-table-builder' ), color: '#9333ea' },
];

export default function Edit( { attributes, setAttributes } ) {
	const {
		tableData: rawTableData,
		hasHeaderRow,
		hasFooterRow,
		theme,
		responsive,
		firstColumnHeader,
	} = attributes;
	const tableData = normalizeTableData( rawTableData );
	const blockProps = useBlockProps( { className: 'vtb-block' } );

	// ── State ──
	const [ activeCell, setActiveCell ] = useState( null );
	const [ selectedCells, setSelectedCells ] = useState( [] );
	const [ contextMenu, setContextMenu ] = useState( null );
	const [ showImport, setShowImport ] = useState( false );
	const [ showTemplate, setShowTemplate ] = useState( false );
	const [ showBgColor, setShowBgColor ] = useState( false );
	const [ showTextColor, setShowTextColor ] = useState( false );
	const [ undoStack, setUndoStack ] = useState( [] );
	const [ redoStack, setRedoStack ] = useState( [] );
	const [ dragState, setDragState ] = useState( null );
	const tableRef = useRef( null );

	// ── Init default table ──
	useEffect( () => {
		const normalized = normalizeTableData( rawTableData );

		if ( normalized.length === 0 ) {
			setAttributes( { tableData: createDefaultTable( 4, 4 ) } );
			return;
		}

		if ( JSON.stringify( normalized ) !== JSON.stringify( rawTableData ) ) {
			setAttributes( { tableData: normalized } );
		}
	}, [ rawTableData, setAttributes ] );

	const rows = tableData.length;
	const cols = tableData[ 0 ]?.length || 0;

	// ── Undo / Redo ──
	const pushUndo = () => {
		setUndoStack( ( prev ) => [
			...prev.slice( -30 ),
			JSON.stringify( tableData ),
		] );
		setRedoStack( [] );
	};

	const handleUndo = () => {
		if ( undoStack.length === 0 ) {
			return;
		}
		const prev = [ ...undoStack ];
		const snapshot = prev.pop();
		setUndoStack( prev );
		setRedoStack( ( r ) => [ ...r, JSON.stringify( tableData ) ] );
		setAttributes( { tableData: JSON.parse( snapshot ) } );
	};

	const handleRedo = () => {
		if ( redoStack.length === 0 ) {
			return;
		}
		const next = [ ...redoStack ];
		const snapshot = next.pop();
		setRedoStack( next );
		setUndoStack( ( u ) => [ ...u, JSON.stringify( tableData ) ] );
		setAttributes( { tableData: JSON.parse( snapshot ) } );
	};

	const updateTable = ( newData ) => {
		pushUndo();
		setAttributes( { tableData: newData } );
	};

	// ── Cell Selection ──
	const handleCellClick = ( row, col, e ) => {
		if ( e.shiftKey && activeCell ) {
			// Multi-select: build rectangle from activeCell to current
			const startRow = Math.min( activeCell.row, row );
			const endRow = Math.max( activeCell.row, row );
			const startCol = Math.min( activeCell.col, col );
			const endCol = Math.max( activeCell.col, col );
			const cells = [];
			for ( let r = startRow; r <= endRow; r++ ) {
				for ( let c = startCol; c <= endCol; c++ ) {
					cells.push( { row: r, col: c } );
				}
			}
			setSelectedCells( cells );
		} else {
			setActiveCell( { row, col } );
			setSelectedCells( [ { row, col } ] );
		}
		setContextMenu( null );
	};

	const isCellSelected = ( row, col ) =>
		selectedCells.some( ( sc ) => sc.row === row && sc.col === col );

	// ── Cell Content Update ──
	const handleCellChange = ( row, col, content ) => {
		pushUndo();
		setAttributes( {
			tableData: updateCell( tableData, row, col, { content } ),
		} );
	};

	// ── Context Menu ──
	const handleContextMenu = ( e, row, col ) => {
		e.preventDefault();
		setActiveCell( { row, col } );
		if ( ! isCellSelected( row, col ) ) {
			setSelectedCells( [ { row, col } ] );
		}
		setContextMenu( { x: e.clientX, y: e.clientY, row, col } );
	};

	const closeContextMenu = () => setContextMenu( null );

	// ── Context Menu Actions ──
	const contextActions = contextMenu
		? [
				{
					label:
						'➕ ' +
						__( 'Insert Row Above', 'wstech-table-builder' ),
					action: () =>
						updateTable(
							addRowBefore( tableData, contextMenu.row )
						),
				},
				{
					label:
						'➕ ' +
						__( 'Insert Row Below', 'wstech-table-builder' ),
					action: () =>
						updateTable(
							addRowAfter( tableData, contextMenu.row )
						),
				},
				{
					label:
						'📋 ' + __( 'Duplicate Row', 'wstech-table-builder' ),
					action: () =>
						updateTable(
							duplicateRow( tableData, contextMenu.row )
						),
				},
				{
					label: '🗑️ ' + __( 'Delete Row', 'wstech-table-builder' ),
					action: () =>
						updateTable( deleteRow( tableData, contextMenu.row ) ),
					danger: true,
				},
				{ separator: true },
				{
					label:
						'➕ ' +
						__( 'Insert Column Before', 'wstech-table-builder' ),
					action: () =>
						updateTable(
							addColumnBefore( tableData, contextMenu.col )
						),
				},
				{
					label:
						'➕ ' +
						__( 'Insert Column After', 'wstech-table-builder' ),
					action: () =>
						updateTable(
							addColumnAfter( tableData, contextMenu.col )
						),
				},
				{
					label:
						'📋 ' +
						__( 'Duplicate Column', 'wstech-table-builder' ),
					action: () =>
						updateTable(
							duplicateColumn( tableData, contextMenu.col )
						),
				},
				{
					label:
						'🗑️ ' + __( 'Delete Column', 'wstech-table-builder' ),
					action: () =>
						updateTable(
							deleteColumn( tableData, contextMenu.col )
						),
					danger: true,
				},
				{ separator: true },
				{
					label: '🧹 ' + __( 'Clear Row', 'wstech-table-builder' ),
					action: () =>
						updateTable( clearRow( tableData, contextMenu.row ) ),
				},
				{
					label: '🧹 ' + __( 'Clear Column', 'wstech-table-builder' ),
					action: () =>
						updateTable(
							clearColumn( tableData, contextMenu.col )
						),
				},
		  ]
		: [];

	// ── Merge / Unmerge ──
	const handleMerge = () => {
		if ( canMerge( selectedCells, tableData ) ) {
			updateTable( mergeCells( tableData, selectedCells ) );
			setSelectedCells( [ selectedCells[ 0 ] ] );
		}
	};

	const handleUnmerge = () => {
		if ( selectedCells.length === 1 ) {
			const { row, col } = selectedCells[ 0 ];
			if ( canUnmerge( selectedCells, tableData ) ) {
				updateTable( unmergeCells( tableData, row, col ) );
			}
		}
	};

	// ── Formatting ──
	const applyStyleToSelected = ( styleUpdates ) => {
		pushUndo();
		let newData = [ ...tableData ];
		for ( const { row, col } of selectedCells ) {
			const cell = newData[ row ]?.[ col ];
			if ( cell ) {
				newData = updateCellStyle( newData, row, col, styleUpdates );
			}
		}
		setAttributes( { tableData: newData } );
	};

	const getActiveStyle = ( prop ) => {
		if ( ! activeCell ) {
			return undefined;
		}
		return tableData[ activeCell.row ]?.[ activeCell.col ]?.styles?.[
			prop
		];
	};

	// ── Drag & Drop ──
	const handleDragStart = ( type, index, e ) => {
		setDragState( { type, index } );
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData( 'text/plain', '' );
	};

	const handleDragOver = ( e ) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	const handleDrop = ( type, targetIndex, e ) => {
		e.preventDefault();
		if ( ! dragState || dragState.type !== type ) {
			return;
		}
		const from = dragState.index;
		if ( from === targetIndex ) {
			return;
		}

		if ( type === 'row' ) {
			updateTable( moveRow( tableData, from, targetIndex ) );
		} else if ( type === 'col' ) {
			updateTable( moveColumn( tableData, from, targetIndex ) );
		}
		setDragState( null );
	};

	// ── Keyboard Navigation ──
	const handleKeyDown = ( e ) => {
		if ( ! activeCell ) {
			return;
		}
		const { row, col } = activeCell;

		// Tab: move to next cell
		if ( e.key === 'Tab' ) {
			e.preventDefault();
			if ( e.shiftKey ) {
				// Previous cell
				if ( col > 0 ) {
					setActiveCell( { row, col: col - 1 } );
					setSelectedCells( [ { row, col: col - 1 } ] );
				} else if ( row > 0 ) {
					setActiveCell( { row: row - 1, col: cols - 1 } );
					setSelectedCells( [ { row: row - 1, col: cols - 1 } ] );
				}
			} else if ( col < cols - 1 ) {
				// Next cell
				setActiveCell( { row, col: col + 1 } );
				setSelectedCells( [ { row, col: col + 1 } ] );
			} else if ( row < rows - 1 ) {
				setActiveCell( { row: row + 1, col: 0 } );
				setSelectedCells( [ { row: row + 1, col: 0 } ] );
			} else {
				// At last cell — add a new row
				updateTable( addRowAfter( tableData, row ) );
				setActiveCell( { row: row + 1, col: 0 } );
				setSelectedCells( [ { row: row + 1, col: 0 } ] );
			}
		}

		// Ctrl+Z: Undo
		if ( e.key === 'z' && ( e.ctrlKey || e.metaKey ) && ! e.shiftKey ) {
			e.preventDefault();
			handleUndo();
		}

		// Ctrl+Y or Ctrl+Shift+Z: Redo
		if (
			( e.key === 'y' && ( e.ctrlKey || e.metaKey ) ) ||
			( e.key === 'z' && ( e.ctrlKey || e.metaKey ) && e.shiftKey )
		) {
			e.preventDefault();
			handleRedo();
		}
	};

	if ( ! tableData || tableData.length === 0 ) {
		return (
			<div { ...blockProps }>
				<div className="vtb-empty-state">
					<p>{ __( 'Loading table…', 'wstech-table-builder' ) }</p>
				</div>
			</div>
		);
	}

	// ── Import handler ──
	const handleImport = ( importedData, fullAttrs ) => {
		pushUndo();
		if ( fullAttrs ) {
			// Full JSON import — restore all attributes
			setAttributes( {
				tableData: importedData,
				...( fullAttrs.hasHeaderRow !== undefined && {
					hasHeaderRow: fullAttrs.hasHeaderRow,
				} ),
				...( fullAttrs.hasFooterRow !== undefined && {
					hasFooterRow: fullAttrs.hasFooterRow,
				} ),
				...( fullAttrs.theme && { theme: fullAttrs.theme } ),
				...( fullAttrs.sortable !== undefined && {
					sortable: fullAttrs.sortable,
				} ),
				...( fullAttrs.searchable !== undefined && {
					searchable: fullAttrs.searchable,
				} ),
				...( fullAttrs.pagination !== undefined && {
					pagination: fullAttrs.pagination,
				} ),
				...( fullAttrs.pageSize && { pageSize: fullAttrs.pageSize } ),
			} );
		} else {
			setAttributes( { tableData: importedData } );
		}
	};

	// ── Template handler ──
	const handleTemplateSelect = ( template ) => {
		pushUndo();
		const attrs = { tableData: template.tableData };
		if ( template.settings ) {
			Object.assign( attrs, template.settings );
		}
		setAttributes( attrs );
	};

	// ── Row section helpers ──
	const getRowSection = ( rowIndex ) => {
		if ( hasHeaderRow && rowIndex === 0 ) {
			return 'header';
		}
		if (
			hasFooterRow &&
			rowIndex === rows - 1 &&
			rows > ( hasHeaderRow ? 2 : 1 )
		) {
			return 'footer';
		}
		return 'body';
	};

	// ── Render ──
	const themeClass = `vtb-theme-${ theme || 'default' }`;
	const responsiveClass = responsive === 'stack' ? 'vtb-stack' : 'vtb-scroll';

	return (
		<div
			{ ...blockProps }
			role="grid"
			aria-label={ __( 'Visual table editor', 'wstech-table-builder' ) }
			tabIndex={ 0 }
			onKeyDown={ handleKeyDown }
		>
			{ /* ── Block Toolbar ── */ }
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon="undo"
						label={ __( 'Undo', 'wstech-table-builder' ) }
						onClick={ handleUndo }
						disabled={ undoStack.length === 0 }
					/>
					<ToolbarButton
						icon="redo"
						label={ __( 'Redo', 'wstech-table-builder' ) }
						onClick={ handleRedo }
						disabled={ redoStack.length === 0 }
					/>
				</ToolbarGroup>

				<ToolbarGroup>
					<ToolbarButton
						icon="table-row-after"
						label={ __( 'Add Row', 'wstech-table-builder' ) }
						onClick={ () =>
							updateTable(
								addRowAfter(
									tableData,
									activeCell?.row ?? rows - 1
								)
							)
						}
					/>
					<ToolbarButton
						icon="table-col-after"
						label={ __( 'Add Column', 'wstech-table-builder' ) }
						onClick={ () =>
							updateTable(
								addColumnAfter(
									tableData,
									activeCell?.col ?? cols - 1
								)
							)
						}
					/>
				</ToolbarGroup>

				<ToolbarGroup>
					{ canMerge( selectedCells, tableData ) && (
						<ToolbarButton
							label={ __(
								'Merge Cells',
								'wstech-table-builder'
							) }
							onClick={ handleMerge }
						>
							⊞ { __( 'Merge', 'wstech-table-builder' ) }
						</ToolbarButton>
					) }
					{ canUnmerge( selectedCells, tableData ) && (
						<ToolbarButton
							label={ __( 'Unmerge', 'wstech-table-builder' ) }
							onClick={ handleUnmerge }
						>
							⊟ { __( 'Unmerge', 'wstech-table-builder' ) }
						</ToolbarButton>
					) }
				</ToolbarGroup>

				<ToolbarGroup>
					<ToolbarButton onClick={ () => setShowTemplate( true ) }>
						📋 { __( 'Templates', 'wstech-table-builder' ) }
					</ToolbarButton>
					<ToolbarButton onClick={ () => setShowImport( true ) }>
						📥 { __( 'Import', 'wstech-table-builder' ) }
					</ToolbarButton>
					<ToolbarDropdownMenu
						icon="download"
						label={ __( 'Export', 'wstech-table-builder' ) }
						controls={ [
							{
								title: __(
									'Export CSV',
									'wstech-table-builder'
								),
								onClick: () => exportTableAsCSV( tableData ),
							},
							{
								title: __(
									'Export JSON',
									'wstech-table-builder'
								),
								onClick: () => exportTableAsJSON( attributes ),
							},
						] }
					/>
				</ToolbarGroup>
			</BlockControls>

			{ /* ── Inspector ── */ }
			<TableInspector
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>

			{ /* ── Modals ── */ }
			<ImportModal
				isOpen={ showImport }
				onClose={ () => setShowImport( false ) }
				onImport={ handleImport }
			/>
			<TemplateModal
				isOpen={ showTemplate }
				onClose={ () => setShowTemplate( false ) }
				onSelect={ handleTemplateSelect }
			/>

			{ /* ── Format Bar ── */ }
			{ activeCell && (
				<div className="vtb-format-bar">
					<button
						className={ `vtb-fmt-btn ${
							getActiveStyle( 'fontWeight' ) === 'bold'
								? 'active'
								: ''
						}` }
						onClick={ () =>
							applyStyleToSelected( {
								fontWeight:
									getActiveStyle( 'fontWeight' ) === 'bold'
										? 'normal'
										: 'bold',
							} )
						}
						title="Bold"
					>
						<strong>B</strong>
					</button>
					<button
						className={ `vtb-fmt-btn ${
							getActiveStyle( 'fontStyle' ) === 'italic'
								? 'active'
								: ''
						}` }
						onClick={ () =>
							applyStyleToSelected( {
								fontStyle:
									getActiveStyle( 'fontStyle' ) === 'italic'
										? 'normal'
										: 'italic',
							} )
						}
						title="Italic"
					>
						<em>I</em>
					</button>
					<button
						className={ `vtb-fmt-btn ${
							getActiveStyle( 'textDecoration' ) === 'underline'
								? 'active'
								: ''
						}` }
						onClick={ () =>
							applyStyleToSelected( {
								textDecoration:
									getActiveStyle( 'textDecoration' ) ===
									'underline'
										? 'none'
										: 'underline',
							} )
						}
						title="Underline"
					>
						<u>U</u>
					</button>

					<span className="vtb-fmt-divider" />

					<button
						className={ `vtb-fmt-btn ${
							getActiveStyle( 'textAlign' ) === 'left'
								? 'active'
								: ''
						}` }
						onClick={ () =>
							applyStyleToSelected( { textAlign: 'left' } )
						}
						title="Align Left"
					>
						⫷
					</button>
					<button
						className={ `vtb-fmt-btn ${
							getActiveStyle( 'textAlign' ) === 'center'
								? 'active'
								: ''
						}` }
						onClick={ () =>
							applyStyleToSelected( { textAlign: 'center' } )
						}
						title="Align Center"
					>
						☰
					</button>
					<button
						className={ `vtb-fmt-btn ${
							getActiveStyle( 'textAlign' ) === 'right'
								? 'active'
								: ''
						}` }
						onClick={ () =>
							applyStyleToSelected( { textAlign: 'right' } )
						}
						title="Align Right"
					>
						⫸
					</button>

					<span className="vtb-fmt-divider" />

					<button
						className="vtb-fmt-btn"
						onClick={ () => setShowBgColor( ! showBgColor ) }
						title="Background Color"
					>
						🎨
					</button>
					{ showBgColor && (
						<Popover
							onClose={ () => setShowBgColor( false ) }
							position="bottom center"
						>
							<div style={ { padding: 12, width: 220 } }>
								<p
									style={ {
										margin: '0 0 8px',
										fontWeight: 600,
										fontSize: 12,
									} }
								>
									{ __(
										'Background Color',
										'wstech-table-builder'
									) }
								</p>
								<ColorPalette
									colors={ COLORS }
									value={ getActiveStyle(
										'backgroundColor'
									) }
									onChange={ ( val ) => {
										applyStyleToSelected( {
											backgroundColor: val || '',
										} );
										setShowBgColor( false );
									} }
								/>
							</div>
						</Popover>
					) }

					<button
						className="vtb-fmt-btn"
						onClick={ () => setShowTextColor( ! showTextColor ) }
						title="Text Color"
					>
						🖊
					</button>
					{ showTextColor && (
						<Popover
							onClose={ () => setShowTextColor( false ) }
							position="bottom center"
						>
							<div style={ { padding: 12, width: 220 } }>
								<p
									style={ {
										margin: '0 0 8px',
										fontWeight: 600,
										fontSize: 12,
									} }
								>
									{ __(
										'Text Color',
										'wstech-table-builder'
									) }
								</p>
								<ColorPalette
									colors={ COLORS }
									value={ getActiveStyle( 'color' ) }
									onChange={ ( val ) => {
										applyStyleToSelected( {
											color: val || '',
										} );
										setShowTextColor( false );
									} }
								/>
							</div>
						</Popover>
					) }

					<span className="vtb-fmt-divider" />

					<select
						className="vtb-fmt-select"
						value={ getActiveStyle( 'fontSize' ) || '' }
						onChange={ ( e ) =>
							applyStyleToSelected( { fontSize: e.target.value } )
						}
						title="Font Size"
					>
						<option value="">Default</option>
						<option value="10">10px</option>
						<option value="12">12px</option>
						<option value="14">14px</option>
						<option value="16">16px</option>
						<option value="18">18px</option>
						<option value="20">20px</option>
						<option value="24">24px</option>
						<option value="28">28px</option>
						<option value="32">32px</option>
					</select>
				</div>
			) }

			{ /* ── Table Editor ── */ }
			<div
				className={ `vtb-wrapper ${ themeClass } ${ responsiveClass }` }
			>
				<div className="vtb-table-container">
					<table
						className="vtb-table vtb-editor-table"
						ref={ tableRef }
					>
						<tbody>
							{ tableData.map( ( row, rIdx ) => {
								const section = getRowSection( rIdx );

								return (
									<tr
										key={ rIdx }
										draggable
										onDragStart={ ( e ) =>
											handleDragStart( 'row', rIdx, e )
										}
										onDragOver={ handleDragOver }
										onDrop={ ( e ) =>
											handleDrop( 'row', rIdx, e )
										}
										className={ `vtb-editor-row ${
											section === 'header'
												? 'vtb-header-row'
												: ''
										} ${
											section === 'footer'
												? 'vtb-footer-row'
												: ''
										}` }
									>
										{ row.map( ( cell, cIdx ) => {
											if ( cell.hidden ) {
												return null;
											}

											const isActive =
												activeCell?.row === rIdx &&
												activeCell?.col === cIdx;
											const isSelected = isCellSelected(
												rIdx,
												cIdx
											);

											const Tag =
												section === 'header' ||
												( firstColumnHeader &&
													cIdx === 0 )
													? 'th'
													: 'td';

											const cellProps = {
												style: buildCellStyle( cell ),
												className: `vtb-cell ${
													isActive ? 'vtb-active' : ''
												} ${
													isSelected
														? 'vtb-selected'
														: ''
												}`,
												onClick: ( e ) =>
													handleCellClick(
														rIdx,
														cIdx,
														e
													),
												onContextMenu: ( e ) =>
													handleContextMenu(
														e,
														rIdx,
														cIdx
													),
											};

											if ( cell.colspan > 1 ) {
												cellProps.colSpan =
													cell.colspan;
											}
											if ( cell.rowspan > 1 ) {
												cellProps.rowSpan =
													cell.rowspan;
											}

											return (
												<Tag
													key={ cIdx }
													{ ...cellProps }
												>
													<RichText
														tagName="div"
														value={
															cell.content || ''
														}
														onChange={ ( val ) =>
															handleCellChange(
																rIdx,
																cIdx,
																val
															)
														}
														placeholder={
															section === 'header'
																? __(
																		'Header',
																		'wstech-table-builder'
																  )
																: ''
														}
													/>
												</Tag>
											);
										} ) }
									</tr>
								);
							} ) }
						</tbody>
					</table>
				</div>
			</div>

			{ /* ── Context Menu ── */ }
			{ contextMenu && (
				<div
					className="vtb-context-overlay"
					role="presentation"
					onClick={ closeContextMenu }
					onContextMenu={ ( e ) => {
						e.preventDefault();
						closeContextMenu();
					} }
					onKeyDown={ ( e ) => {
						if ( e.key === 'Escape' ) {
							closeContextMenu();
						}
					} }
				>
					<div
						className="vtb-context-menu"
						role="menu"
						tabIndex={ -1 }
						style={ {
							position: 'fixed',
							left: contextMenu.x,
							top: contextMenu.y,
						} }
						onClick={ ( e ) => e.stopPropagation() }
						onKeyDown={ ( e ) => e.stopPropagation() }
					>
						{ contextActions.map( ( item, idx ) => {
							if ( item.separator ) {
								return (
									<div
										key={ idx }
										className="vtb-context-separator"
									/>
								);
							}
							return (
								<button
									key={ idx }
									className={ `vtb-context-item ${
										item.danger ? 'vtb-danger' : ''
									}` }
									onClick={ () => {
										item.action();
										closeContextMenu();
									} }
								>
									{ item.label }
								</button>
							);
						} ) }
					</div>
				</div>
			) }

			{ /* ── Info Bar ── */ }
			<div className="vtb-info-bar">
				<span className="vtb-badge">WSTech Table Builder</span>
				<span className="vtb-info-text">
					{ rows } × { cols }
					{ selectedCells.length > 1 &&
						` | ${ selectedCells.length } cells selected` }
					{ undoStack.length > 0 &&
						` | ${ undoStack.length } undo steps` }
				</span>
			</div>
		</div>
	);
}
