/**
 * ImportModal.js
 * Modal for CSV and JSON file imports.
 */

import { __ } from '@wordpress/i18n';
import { useState, useRef } from '@wordpress/element';
import { Modal, Button, TextareaControl, Notice } from '@wordpress/components';
import { parseCSV, readCSVFile } from '../utils/csvImport';
import { importTableFromJSON } from '../utils/jsonIO';

export default function ImportModal( { isOpen, onClose, onImport } ) {
	const [ activeTab, setActiveTab ] = useState( 'csv' );
	const [ csvText, setCsvText ] = useState( '' );
	const [ error, setError ] = useState( '' );
	const [ success, setSuccess ] = useState( '' );
	const [ isDragging, setIsDragging ] = useState( false );
	const fileInputRef = useRef( null );

	if ( ! isOpen ) {
		return null;
	}

	const resetState = () => {
		setError( '' );
		setSuccess( '' );
		setCsvText( '' );
	};

	const handleTabChange = ( tab ) => {
		setActiveTab( tab );
		resetState();
	};

	// ---------- CSV Import ----------

	const handleCSVPaste = () => {
		if ( ! csvText.trim() ) {
			setError(
				__(
					'Please paste CSV data first.',
					'wstech-visual-table-builder'
				)
			);
			return;
		}
		try {
			const result = parseCSV( csvText );
			if ( ! result.tableData.length ) {
				setError(
					__(
						'No data found in pasted text.',
						'wstech-visual-table-builder'
					)
				);
				return;
			}
			onImport( result.tableData );
			setSuccess(
				`${ result.rows } rows × ${ result.cols } columns imported!`
			);
			setTimeout( () => {
				onClose();
				resetState();
			}, 800 );
		} catch ( err ) {
			setError( err.message );
		}
	};

	const handleCSVFile = async ( file ) => {
		if ( ! file ) {
			return;
		}
		try {
			const result = await readCSVFile( file );
			if ( ! result.tableData.length ) {
				setError(
					__(
						'No data found in file.',
						'wstech-visual-table-builder'
					)
				);
				return;
			}
			onImport( result.tableData );
			setSuccess(
				`${ result.rows } rows × ${ result.cols } columns imported from ${ file.name }!`
			);
			setTimeout( () => {
				onClose();
				resetState();
			}, 800 );
		} catch ( err ) {
			setError( err.message );
		}
	};

	// ---------- JSON Import ----------

	const handleJSONFile = async ( file ) => {
		if ( ! file ) {
			return;
		}
		try {
			const attrs = await importTableFromJSON( file );
			onImport( attrs.tableData, attrs );
			setSuccess(
				__( 'Table imported from JSON!', 'wstech-visual-table-builder' )
			);
			setTimeout( () => {
				onClose();
				resetState();
			}, 800 );
		} catch ( err ) {
			setError( err.message );
		}
	};

	// ---------- File Drop Zone ----------

	const handleFileChange = ( e ) => {
		const file = e.target.files?.[ 0 ];
		if ( ! file ) {
			return;
		}

		if ( activeTab === 'csv' ) {
			handleCSVFile( file );
		} else {
			handleJSONFile( file );
		}
	};

	const handleDrop = ( e ) => {
		e.preventDefault();
		setIsDragging( false );
		const file = e.dataTransfer?.files?.[ 0 ];
		if ( file ) {
			if ( activeTab === 'csv' ) {
				handleCSVFile( file );
			} else {
				handleJSONFile( file );
			}
		}
	};

	const acceptTypes =
		activeTab === 'csv' ? '.csv,.tsv,.txt' : '.json,.vtb.json';
	const csvPlaceholder = [
		__( 'Paste CSV data here…', 'wstech-visual-table-builder' ),
		__( 'Name, Email, Phone', 'wstech-visual-table-builder' ),
		__( 'John, john@email.com, 123–456', 'wstech-visual-table-builder' ),
	].join( '\n' );

	return (
		<Modal
			title={ __(
				'📥 Import Table Data',
				'wstech-visual-table-builder'
			) }
			onRequestClose={ () => {
				onClose();
				resetState();
			} }
			className="vtb-import-modal"
		>
			<div className="vtb-import-tabs">
				<button
					className={ `vtb-import-tab ${
						activeTab === 'csv' ? 'active' : ''
					}` }
					onClick={ () => handleTabChange( 'csv' ) }
				>
					📄 { __( 'CSV Import', 'wstech-visual-table-builder' ) }
				</button>
				<button
					className={ `vtb-import-tab ${
						activeTab === 'json' ? 'active' : ''
					}` }
					onClick={ () => handleTabChange( 'json' ) }
				>
					📋 { __( 'JSON Import', 'wstech-visual-table-builder' ) }
				</button>
			</div>

			{ error && (
				<Notice
					status="error"
					isDismissible
					onRemove={ () => setError( '' ) }
				>
					{ error }
				</Notice>
			) }
			{ success && (
				<Notice status="success" isDismissible={ false }>
					{ success }
				</Notice>
			) }

			<button
				type="button"
				className={ `vtb-drop-zone ${
					isDragging ? 'vtb-dragging' : ''
				}` }
				onDragOver={ ( e ) => {
					e.preventDefault();
					setIsDragging( true );
				} }
				onDragLeave={ () => setIsDragging( false ) }
				onDrop={ handleDrop }
				onClick={ () => fileInputRef.current?.click() }
			>
				<div className="vtb-drop-icon">
					{ activeTab === 'csv' ? '📄' : '📋' }
				</div>
				<p>
					{ activeTab === 'csv'
						? __(
								'Drop a CSV file here, or click to browse',
								'wstech-visual-table-builder'
						  )
						: __(
								'Drop a .vtb.json file here, or click to browse',
								'wstech-visual-table-builder'
						  ) }
				</p>
			</button>
			<input
				ref={ fileInputRef }
				type="file"
				accept={ acceptTypes }
				style={ { display: 'none' } }
				onChange={ handleFileChange }
			/>

			{ activeTab === 'csv' && (
				<>
					<div className="vtb-import-divider">
						<span>
							{ __(
								'or paste CSV data',
								'wstech-visual-table-builder'
							) }
						</span>
					</div>
					<TextareaControl
						value={ csvText }
						onChange={ setCsvText }
						placeholder={ csvPlaceholder }
						rows={ 6 }
					/>
					<div className="vtb-import-actions">
						<Button variant="primary" onClick={ handleCSVPaste }>
							{ __(
								'Import Pasted Data',
								'wstech-visual-table-builder'
							) }
						</Button>
						<Button
							variant="tertiary"
							onClick={ () => {
								onClose();
								resetState();
							} }
						>
							{ __( 'Cancel', 'wstech-visual-table-builder' ) }
						</Button>
					</div>
				</>
			) }

			{ activeTab === 'json' && (
				<div className="vtb-import-info">
					<p>
						{ __(
							'Import a previously exported .vtb.json file to restore a complete table with all settings, styles, and data.',
							'wstech-visual-table-builder'
						) }
					</p>
				</div>
			) }
		</Modal>
	);
}
