/**
 * TemplateModal.js
 * Animated template picker modal with 10 built-in templates.
 */

import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Modal, Button } from '@wordpress/components';
import { TEMPLATES } from '../templates';

export default function TemplateModal( { isOpen, onClose, onSelect } ) {
	const [ hoveredId, setHoveredId ] = useState( null );
	const [ selectedId, setSelectedId ] = useState( null );

	if ( ! isOpen ) {
		return null;
	}

	const handleSelect = ( template ) => {
		setSelectedId( template.id );
		setTimeout( () => {
			onSelect( template );
			setSelectedId( null );
			onClose();
		}, 300 );
	};

	return (
		<Modal
			title={ __(
				'📋 Choose a Template',
				'wstech-visual-table-builder'
			) }
			onRequestClose={ onClose }
			className="vtb-template-modal"
		>
			<p className="vtb-template-subtitle">
				{ __(
					'Start quickly with a pre-designed table template. All templates are fully customisable after insertion.',
					'wstech-visual-table-builder'
				) }
			</p>

			<div className="vtb-template-grid">
				{ TEMPLATES.map( ( tpl ) => (
					<button
						key={ tpl.id }
						className={ `vtb-template-card ${
							hoveredId === tpl.id ? 'hovered' : ''
						} ${ selectedId === tpl.id ? 'selected' : '' }` }
						onMouseEnter={ () => setHoveredId( tpl.id ) }
						onMouseLeave={ () => setHoveredId( null ) }
						onClick={ () => handleSelect( tpl ) }
					>
						<div className="vtb-template-icon">{ tpl.icon }</div>
						<div className="vtb-template-name">{ tpl.name }</div>
						<div className="vtb-template-desc">
							{ tpl.description }
						</div>
						{ tpl.settings?.sortable && (
							<span className="vtb-template-badge">Sortable</span>
						) }
						{ tpl.settings?.searchable && (
							<span className="vtb-template-badge">
								Searchable
							</span>
						) }
					</button>
				) ) }
			</div>

			<div className="vtb-template-footer">
				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Cancel', 'wstech-visual-table-builder' ) }
				</Button>
			</div>
		</Modal>
	);
}
