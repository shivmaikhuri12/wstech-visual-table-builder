/**
 * WSTech Visual Table Builder — Gutenberg Block Registration
 *
 * @package
 */
import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import save from './save';
import metadata from './block.json';

// SCSS → CSS: wp-scripts generates index.css (editor) and style-index.css (frontend)
import './editor.scss';
import './style.scss';

registerBlockType( metadata.name, {
	edit: Edit,
	save,
} );
