/**
 * TableInspector.js
 * Sidebar inspector panel for the Visual Table Builder block.
 * Controls all table-level settings and styles.
 */

import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	PanelRow,
	ToggleControl,
	SelectControl,
	RangeControl,
	TextControl,
	ColorPalette,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

const THEMES = [
	{
		label: __( 'Default (Indigo)', 'wstech-table-builder' ),
		value: 'default',
	},
	{
		label: __( 'Striped (Sky Blue)', 'wstech-table-builder' ),
		value: 'striped',
	},
	{
		label: __( 'Bordered (Slate)', 'wstech-table-builder' ),
		value: 'bordered',
	},
	{ label: __( 'Dark', 'wstech-table-builder' ), value: 'dark' },
	{ label: __( 'Minimal', 'wstech-table-builder' ), value: 'minimal' },
	{ label: __( 'Colorful', 'wstech-table-builder' ), value: 'colorful' },
];

const BORDER_STYLES = [
	{ label: __( 'Solid', 'wstech-table-builder' ), value: 'solid' },
	{ label: __( 'Dashed', 'wstech-table-builder' ), value: 'dashed' },
	{ label: __( 'Dotted', 'wstech-table-builder' ), value: 'dotted' },
	{ label: __( 'Double', 'wstech-table-builder' ), value: 'double' },
	{ label: __( 'None', 'wstech-table-builder' ), value: 'none' },
];

const RESPONSIVE_MODES = [
	{
		label: __( 'Horizontal Scroll', 'wstech-table-builder' ),
		value: 'scroll',
	},
	{ label: __( 'Stack on Mobile', 'wstech-table-builder' ), value: 'stack' },
];

const COLORS = [
	{ name: __( 'White', 'wstech-table-builder' ), color: '#ffffff' },
	{ name: __( 'Light Gray', 'wstech-table-builder' ), color: '#f3f4f6' },
	{ name: __( 'Gray', 'wstech-table-builder' ), color: '#9ca3af' },
	{ name: __( 'Dark Gray', 'wstech-table-builder' ), color: '#374151' },
	{ name: __( 'Black', 'wstech-table-builder' ), color: '#000000' },
	{ name: __( 'Indigo', 'wstech-table-builder' ), color: '#4f46e5' },
	{ name: __( 'Blue', 'wstech-table-builder' ), color: '#2563eb' },
	{ name: __( 'Sky', 'wstech-table-builder' ), color: '#0ea5e9' },
	{ name: __( 'Teal', 'wstech-table-builder' ), color: '#14b8a6' },
	{ name: __( 'Green', 'wstech-table-builder' ), color: '#16a34a' },
	{ name: __( 'Yellow', 'wstech-table-builder' ), color: '#eab308' },
	{ name: __( 'Orange', 'wstech-table-builder' ), color: '#f97316' },
	{ name: __( 'Red', 'wstech-table-builder' ), color: '#dc2626' },
	{ name: __( 'Pink', 'wstech-table-builder' ), color: '#ec4899' },
	{ name: __( 'Purple', 'wstech-table-builder' ), color: '#9333ea' },
	{ name: __( 'Slate', 'wstech-table-builder' ), color: '#64748b' },
];

export default function TableInspector( { attributes, setAttributes } ) {
	const {
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
	} = attributes;

	return (
		<InspectorControls>
			{ /* ── Table Structure ── */ }
			<PanelBody
				title={ __( '📐 Table Structure', 'wstech-table-builder' ) }
				initialOpen={ true }
			>
				<ToggleControl
					label={ __( 'Header Row', 'wstech-table-builder' ) }
					help={ __(
						'First row becomes a styled header (thead).',
						'wstech-table-builder'
					) }
					checked={ hasHeaderRow }
					onChange={ ( val ) =>
						setAttributes( { hasHeaderRow: val } )
					}
				/>
				<ToggleControl
					label={ __( 'Footer Row', 'wstech-table-builder' ) }
					help={ __(
						'Last row becomes a footer (tfoot).',
						'wstech-table-builder'
					) }
					checked={ hasFooterRow }
					onChange={ ( val ) =>
						setAttributes( { hasFooterRow: val } )
					}
				/>
				<ToggleControl
					label={ __(
						'First Column Header',
						'wstech-table-builder'
					) }
					help={ __(
						'First column cells become row headers.',
						'wstech-table-builder'
					) }
					checked={ firstColumnHeader }
					onChange={ ( val ) =>
						setAttributes( { firstColumnHeader: val } )
					}
				/>
				<TextControl
					label={ __( 'Table Caption', 'wstech-table-builder' ) }
					value={ caption }
					onChange={ ( val ) => setAttributes( { caption: val } ) }
					placeholder={ __(
						'Enter caption…',
						'wstech-table-builder'
					) }
				/>
			</PanelBody>

			{ /* ── Theme & Styling ── */ }
			<PanelBody
				title={ __( '🎨 Theme & Styling', 'wstech-table-builder' ) }
				initialOpen={ false }
			>
				<SelectControl
					label={ __( 'Table Theme', 'wstech-table-builder' ) }
					value={ theme }
					options={ THEMES }
					onChange={ ( val ) => setAttributes( { theme: val } ) }
				/>
				<PanelRow>
					<span>
						{ __( 'Border Color', 'wstech-table-builder' ) }
					</span>
				</PanelRow>
				<ColorPalette
					colors={ COLORS }
					value={ borderColor }
					onChange={ ( val ) =>
						setAttributes( { borderColor: val || '#dee2e6' } )
					}
				/>
				<RangeControl
					label={ __( 'Border Width', 'wstech-table-builder' ) }
					value={ borderWidth }
					onChange={ ( val ) =>
						setAttributes( { borderWidth: val } )
					}
					min={ 0 }
					max={ 5 }
				/>
				<SelectControl
					label={ __( 'Border Style', 'wstech-table-builder' ) }
					value={ borderStyle }
					options={ BORDER_STYLES }
					onChange={ ( val ) =>
						setAttributes( { borderStyle: val } )
					}
				/>
				<SelectControl
					label={ __( 'Table Width', 'wstech-table-builder' ) }
					value={ tableWidth }
					options={ [
						{ label: '100%', value: '100%' },
						{
							label: __( 'Auto', 'wstech-table-builder' ),
							value: 'auto',
						},
						{ label: '75%', value: '75%' },
						{ label: '50%', value: '50%' },
					] }
					onChange={ ( val ) => setAttributes( { tableWidth: val } ) }
				/>
			</PanelBody>

			{ /* ── Data Table Features ── */ }
			<PanelBody
				title={ __( '⚡ Data Table Features', 'wstech-table-builder' ) }
				initialOpen={ false }
			>
				<ToggleControl
					label={ __( 'Sortable Columns', 'wstech-table-builder' ) }
					help={ __(
						'Visitors can click headers to sort.',
						'wstech-table-builder'
					) }
					checked={ sortable }
					onChange={ ( val ) => setAttributes( { sortable: val } ) }
				/>
				<ToggleControl
					label={ __( 'Search / Filter', 'wstech-table-builder' ) }
					help={ __(
						'Shows a live search bar above the table.',
						'wstech-table-builder'
					) }
					checked={ searchable }
					onChange={ ( val ) => setAttributes( { searchable: val } ) }
				/>
				<ToggleControl
					label={ __( 'Pagination', 'wstech-table-builder' ) }
					help={ __(
						'Paginate rows on the frontend.',
						'wstech-table-builder'
					) }
					checked={ pagination }
					onChange={ ( val ) => setAttributes( { pagination: val } ) }
				/>
				{ pagination && (
					<RangeControl
						label={ __( 'Rows per Page', 'wstech-table-builder' ) }
						value={ pageSize }
						onChange={ ( val ) =>
							setAttributes( { pageSize: val } )
						}
						min={ 3 }
						max={ 100 }
					/>
				) }
				<ToggleControl
					label={ __(
						'Hover Row Highlight',
						'wstech-table-builder'
					) }
					checked={ hoverHighlight }
					onChange={ ( val ) =>
						setAttributes( { hoverHighlight: val } )
					}
				/>
			</PanelBody>

			{ /* ── Export Settings ── */ }
			<PanelBody
				title={ __( '📤 Export Settings', 'wstech-table-builder' ) }
				initialOpen={ false }
			>
				<ToggleControl
					label={ __(
						'Frontend CSV Export',
						'wstech-table-builder'
					) }
					help={ __(
						'Show an "Export CSV" button to visitors. Disabled by default.',
						'wstech-table-builder'
					) }
					checked={ frontendCsvExport }
					onChange={ ( val ) =>
						setAttributes( { frontendCsvExport: val } )
					}
				/>
			</PanelBody>

			{ /* ── Responsive ── */ }
			<PanelBody
				title={ __( '📱 Responsive', 'wstech-table-builder' ) }
				initialOpen={ false }
			>
				<SelectControl
					label={ __(
						'Mobile Display Mode',
						'wstech-table-builder'
					) }
					value={ responsive }
					options={ RESPONSIVE_MODES }
					onChange={ ( val ) => setAttributes( { responsive: val } ) }
				/>
				{ responsive === 'stack' && (
					<p className="components-base-control__help">
						{ __(
							'On mobile, each row becomes a vertical card with column labels.',
							'wstech-table-builder'
						) }
					</p>
				) }
			</PanelBody>
		</InspectorControls>
	);
}
