<?php
/**
 * Plugin Name: WSTech Visual Table Builder
 * Plugin URI: https://github.com/shivmaikhuri12/wstech-visual-table-builder
 * Description: Professional visual table builder for WordPress with drag-and-drop editing, merge cells, templates, import/export, shortcodes, and responsive data tables.
 * Version: 2.0.2
 * Requires at least: 6.2
 * Requires PHP: 7.4
 * Author: Web Solution Technologies
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: wstech-visual-table-builder
 *
 * @package WSTech_Table_Builder
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Plugin constants.
 */
define( 'WSTB_VERSION', '2.0.2' );
define( 'WSTB_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'WSTB_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'WSTB_PLUGIN_FILE', __FILE__ );

/**
 * Include required files.
 */
require_once WSTB_PLUGIN_DIR . 'includes/class-wstech-table-cpt.php';
require_once WSTB_PLUGIN_DIR . 'includes/class-wstech-table-shortcode.php';
require_once WSTB_PLUGIN_DIR . 'includes/class-wstech-table-renderer.php';

/**
 * Register the Gutenberg block with a dynamic render callback.
 *
 * @return void
 */
function wstb_register_block() {
	if ( ! file_exists( __DIR__ . '/build' ) ) {
		return;
	}

	register_block_type(
		__DIR__ . '/build',
		array(
			'render_callback' => 'wstb_render_block',
		)
	);
}
add_action( 'init', 'wstb_register_block' );

/**
 * Render callback for the vtb/table-builder block.
 *
 * If a tableId attribute references a CPT post, load data from post meta.
 * Otherwise, use inline attributes from the block itself.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block inner content (unused).
 * @return string Rendered HTML.
 */
function wstb_render_block( $attributes, $content ) {
	unset( $content );

	$table_id = isset( $attributes['tableId'] ) ? absint( $attributes['tableId'] ) : 0;

	if ( $table_id > 0 ) {
		// ── Stored table: load from CPT post meta ──
		$post = get_post( $table_id );

		if ( ! $post || 'wstech_table' !== $post->post_type || 'publish' !== $post->post_status ) {
			return '';
		}

		$raw_data = get_post_meta( $table_id, '_wstech_table_data', true );

		if ( empty( $raw_data ) ) {
			return '';
		}

		$decoded = json_decode( $raw_data, true );

		if ( ! is_array( $decoded ) ) {
			return '';
		}

		$table_data = isset( $decoded['tableData'] ) ? $decoded['tableData'] : array();
		$settings   = isset( $decoded['settings'] ) ? $decoded['settings'] : array();
		$styles     = isset( $decoded['styles'] ) ? $decoded['styles'] : array();
	} else {
		// ── Inline table: extract flat block attributes into settings/styles ──
		$table_data = isset( $attributes['tableData'] ) ? $attributes['tableData'] : array();

		$settings = array(
			'hasHeaderRow'      => ! empty( $attributes['hasHeaderRow'] ),
			'hasFooterRow'      => ! empty( $attributes['hasFooterRow'] ),
			'sortable'          => ! empty( $attributes['sortable'] ),
			'searchable'        => ! empty( $attributes['searchable'] ),
			'pagination'        => ! empty( $attributes['pagination'] ),
			'pageSize'          => isset( $attributes['pageSize'] ) ? absint( $attributes['pageSize'] ) : 10,
			'frontendCsvExport' => ! empty( $attributes['frontendCsvExport'] ),
			'firstColumnHeader' => ! empty( $attributes['firstColumnHeader'] ),
			'hoverHighlight'    => isset( $attributes['hoverHighlight'] ) ? (bool) $attributes['hoverHighlight'] : true,
			'responsive'        => isset( $attributes['responsive'] ) ? $attributes['responsive'] : 'scroll',
			'caption'           => isset( $attributes['caption'] ) ? $attributes['caption'] : '',
		);

		$styles = array(
			'theme'       => isset( $attributes['theme'] ) ? $attributes['theme'] : 'default',
			'borderColor' => isset( $attributes['borderColor'] ) ? $attributes['borderColor'] : '#dee2e6',
			'borderWidth' => isset( $attributes['borderWidth'] ) ? $attributes['borderWidth'] : 1,
			'borderStyle' => isset( $attributes['borderStyle'] ) ? $attributes['borderStyle'] : 'solid',
			'tableWidth'  => isset( $attributes['tableWidth'] ) ? $attributes['tableWidth'] : '100%',
		);
	}

	if ( empty( $table_data ) ) {
		return '';
	}

	return WSTech_Table_Renderer::render_safe( $table_data, $settings, $styles );
}

/**
 * Boot CPT and Shortcode classes on plugins_loaded.
 *
 * @return void
 */
function wstb_boot() {
	WSTech_Table_CPT::init();
	WSTech_Table_Shortcode::init();
}
add_action( 'plugins_loaded', 'wstb_boot' );

/**
 * Get generated asset metadata for a build file.
 *
 * @param string $asset_filename Asset metadata filename.
 * @return array{dependencies: array, version: string} Asset dependencies and version.
 */
function wstb_get_build_asset_metadata( $asset_filename ) {
	$asset_path = WSTB_PLUGIN_DIR . 'build/' . $asset_filename;

	if ( ! file_exists( $asset_path ) ) {
		return array(
			'dependencies' => array(),
			'version'      => WSTB_VERSION,
		);
	}

	$asset = include $asset_path;

	if ( ! is_array( $asset ) ) {
		return array(
			'dependencies' => array(),
			'version'      => WSTB_VERSION,
		);
	}

	return array(
		'dependencies' => isset( $asset['dependencies'] ) && is_array( $asset['dependencies'] ) ? $asset['dependencies'] : array(),
		'version'      => isset( $asset['version'] ) ? (string) $asset['version'] : WSTB_VERSION,
	);
}

/**
 * Enqueue frontend CSS and JS for rendered tables.
 *
 * @return void
 */
function wstb_enqueue_frontend_assets_now() {
	$build_dir = WSTB_PLUGIN_DIR . 'build/';

	if ( file_exists( $build_dir . 'style-index.css' ) ) {
		wp_enqueue_style(
			'wstb-frontend-style',
			WSTB_PLUGIN_URL . 'build/style-index.css',
			array(),
			WSTB_VERSION
		);
	}

	if ( file_exists( $build_dir . 'view.js' ) ) {
		$view_asset = wstb_get_build_asset_metadata( 'view.asset.php' );

		wp_enqueue_script(
			'wstb-frontend-view',
			WSTB_PLUGIN_URL . 'build/view.js',
			$view_asset['dependencies'],
			$view_asset['version'],
			true
		);
	}
}

/**
 * Determine whether frontend table assets are needed for the current request.
 *
 * @return bool True when frontend assets should be loaded.
 */
function wstb_should_enqueue_frontend_assets() {
	$should_enqueue = false;

	if ( is_singular() ) {
		$post = get_post();

		if ( $post instanceof WP_Post ) {
			$should_enqueue = has_shortcode( $post->post_content, 'wstech_table' ) || has_block( 'vtb/table-builder', $post );
		}
	}

	/**
	 * Filters whether WSTech table frontend assets should be loaded.
	 *
	 * Page builders that render shortcodes from metadata can return true here.
	 *
	 * @param bool $should_enqueue Whether assets should be enqueued.
	 */
	return (bool) apply_filters( 'wstb_should_enqueue_frontend_assets', $should_enqueue );
}

/**
 * Conditionally enqueue frontend CSS and JS.
 *
 * @return void
 */
function wstb_enqueue_frontend_assets() {
	if ( wstb_should_enqueue_frontend_assets() ) {
		wstb_enqueue_frontend_assets_now();
	}
}
add_action( 'wp_enqueue_scripts', 'wstb_enqueue_frontend_assets' );

/**
 * Show an admin notice if the build directory is missing.
 *
 * @return void
 */
function wstb_admin_notice_missing_build() {
	if ( file_exists( WSTB_PLUGIN_DIR . 'build' ) ) {
		return;
	}

	?>
	<div class="notice notice-error">
		<p>
			<?php
			printf(
				/* translators: 1: npm run build command wrapped in code tags */
				esc_html__( 'WSTech Visual Table Builder: Build directory not found. Please run %s to compile the block assets.', 'wstech-visual-table-builder' ),
				'<code>npm run build</code>'
			);
			?>
		</p>
	</div>
	<?php
}
add_action( 'admin_notices', 'wstb_admin_notice_missing_build' );

/**
 * Add plugin action links on the Plugins list table.
 *
 * @param array $links Existing action links.
 * @return array Modified action links.
 */
function wstb_plugin_action_links( $links ) {
	$custom_links = array(
		sprintf(
			'<a href="%s">%s</a>',
			esc_url( admin_url( 'edit.php?post_type=wstech_table' ) ),
			esc_html__( 'Manage Tables', 'wstech-visual-table-builder' )
		),
		sprintf(
			'<a href="%s">%s</a>',
			esc_url( admin_url( 'post-new.php?post_type=wstech_table' ) ),
			esc_html__( 'Add New Table', 'wstech-visual-table-builder' )
		),
		sprintf(
			'<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
			esc_url( 'https://wstech.in/donate' ),
			esc_html__( 'Donate', 'wstech-visual-table-builder' )
		),
	);

	return array_merge( $custom_links, $links );
}
add_filter( 'plugin_action_links_' . plugin_basename( WSTB_PLUGIN_FILE ), 'wstb_plugin_action_links' );

/**
 * Build a WordPress native plugin details modal URL.
 *
 * @param string $section Optional modal section/tab slug.
 * @return string Plugin information URL.
 */
function wstb_plugin_information_url( $section = '' ) {
	$args = array(
		'tab'       => 'plugin-information',
		'plugin'    => 'wstech-visual-table-builder',
		'TB_iframe' => 'true',
		'width'     => 772,
		'height'    => 680,
	);

	if ( ! empty( $section ) ) {
		$args['section'] = sanitize_key( $section );
	}

	return add_query_arg( $args, self_admin_url( 'plugin-install.php' ) );
}

/**
 * Load Thickbox on the Plugins screen for the plugin details modal.
 *
 * @param string $hook_suffix Current admin screen hook suffix.
 * @return void
 */
function wstb_enqueue_plugin_details_modal( $hook_suffix ) {
	if ( 'plugins.php' !== $hook_suffix ) {
		return;
	}

	add_thickbox();
	wp_enqueue_script( 'plugin-install' );
}
add_action( 'admin_enqueue_scripts', 'wstb_enqueue_plugin_details_modal' );

/**
 * Add plugin meta links under the plugin description.
 *
 * @param array  $links Existing plugin row meta links.
 * @param string $file  Plugin file path relative to plugins directory.
 * @return array Modified plugin row meta links.
 */
function wstb_plugin_row_meta( $links, $file ) {
	if ( plugin_basename( WSTB_PLUGIN_FILE ) !== $file ) {
		return $links;
	}

	$links[] = sprintf(
		'<a href="%s" class="thickbox open-plugin-details-modal" aria-label="%s">%s</a>',
		esc_url( wstb_plugin_information_url( 'faq' ) ),
		esc_attr__( 'Open WSTech Visual Table Builder frequently asked questions', 'wstech-visual-table-builder' ),
		esc_html__( 'FAQs', 'wstech-visual-table-builder' )
	);

	return $links;
}
add_filter( 'plugin_row_meta', 'wstb_plugin_row_meta', 10, 2 );

/**
 * Handle the "Duplicate Table" admin action.
 *
 * Copies the CPT post and all its post meta, then redirects to the edit screen.
 *
 * @return void
 */
function wstb_duplicate_table() {
	if ( ! isset( $_GET['post'] ) || ! isset( $_GET['_wpnonce'] ) ) {
		wp_die( esc_html__( 'Invalid request.', 'wstech-visual-table-builder' ) );
	}

	$post_id = absint( $_GET['post'] );
	$nonce   = sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) );

	if ( ! wp_verify_nonce( $nonce, 'wstb_duplicate_' . $post_id ) ) {
		wp_die( esc_html__( 'Security check failed.', 'wstech-visual-table-builder' ) );
	}

	$post = get_post( $post_id );

	if ( ! $post || 'wstech_table' !== $post->post_type ) {
		wp_die( esc_html__( 'Table not found.', 'wstech-visual-table-builder' ) );
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		wp_die( esc_html__( 'You do not have permission to duplicate this table.', 'wstech-visual-table-builder' ) );
	}

	// Create the duplicate post.
	$new_post_id = wp_insert_post(
		array(
			'post_title'   => sprintf(
				/* translators: %s: original table title */
				__( '%s (Copy)', 'wstech-visual-table-builder' ),
				$post->post_title
			),
			'post_content' => $post->post_content,
			'post_status'  => 'draft',
			'post_type'    => 'wstech_table',
			'post_author'  => get_current_user_id(),
		)
	);

	if ( is_wp_error( $new_post_id ) ) {
		wp_die( esc_html__( 'Failed to duplicate table.', 'wstech-visual-table-builder' ) );
	}

	// Copy all post meta.
	$post_meta = get_post_meta( $post_id );

	if ( $post_meta ) {
		foreach ( $post_meta as $meta_key => $meta_values ) {
			foreach ( $meta_values as $meta_value ) {
				add_post_meta( $new_post_id, $meta_key, maybe_unserialize( $meta_value ) );
			}
		}
	}

	wp_safe_redirect(
		admin_url( 'post.php?action=edit&post=' . $new_post_id )
	);
	exit;
}
add_action( 'admin_action_wstb_duplicate', 'wstb_duplicate_table' );

/**
 * Sync block attributes to post meta when a wstech_table CPT post is saved.
 *
 * Parses post_content for the vtb/table-builder block, extracts attributes,
 * and stores them as structured JSON in _wstech_table_data.
 *
 * @param int $post_id Post ID being saved.
 * @return void
 */
function wstb_sync_block_to_meta( $post_id ) {
	// Bail on autosave, revisions, or wrong post type.
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( wp_is_post_revision( $post_id ) ) {
		return;
	}

	$post = get_post( $post_id );

	if ( ! $post || 'wstech_table' !== $post->post_type ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$blocks = parse_blocks( $post->post_content );

	// Find the vtb/table-builder block (may be nested).
	$vtb_block = wstb_find_block( $blocks, 'vtb/table-builder' );

	if ( ! $vtb_block ) {
		return;
	}

	// Block attributes are FLAT (e.g. theme, sortable, hasHeaderRow)
	// not nested under settings/styles. Extract into structured JSON.
	$attrs = isset( $vtb_block['attrs'] ) && is_array( $vtb_block['attrs'] ) ? $vtb_block['attrs'] : array();

	$table_data_value = array(
		'version'     => 1,
		'tableData'   => isset( $attrs['tableData'] ) ? $attrs['tableData'] : array(),
		'settings'    => array(
			'hasHeaderRow'      => ! empty( $attrs['hasHeaderRow'] ),
			'hasFooterRow'      => ! empty( $attrs['hasFooterRow'] ),
			'sortable'          => ! empty( $attrs['sortable'] ),
			'searchable'        => ! empty( $attrs['searchable'] ),
			'pagination'        => ! empty( $attrs['pagination'] ),
			'pageSize'          => isset( $attrs['pageSize'] ) ? absint( $attrs['pageSize'] ) : 10,
			'frontendCsvExport' => ! empty( $attrs['frontendCsvExport'] ),
			'firstColumnHeader' => ! empty( $attrs['firstColumnHeader'] ),
			'hoverHighlight'    => isset( $attrs['hoverHighlight'] ) ? (bool) $attrs['hoverHighlight'] : true,
			'responsive'        => isset( $attrs['responsive'] ) ? sanitize_text_field( $attrs['responsive'] ) : 'scroll',
			'caption'           => isset( $attrs['caption'] ) ? sanitize_text_field( $attrs['caption'] ) : '',
		),
		'styles'      => array(
			'theme'       => isset( $attrs['theme'] ) ? sanitize_text_field( $attrs['theme'] ) : 'default',
			'borderColor' => isset( $attrs['borderColor'] ) ? sanitize_text_field( $attrs['borderColor'] ) : '#dee2e6',
			'borderWidth' => isset( $attrs['borderWidth'] ) ? absint( $attrs['borderWidth'] ) : 1,
			'borderStyle' => isset( $attrs['borderStyle'] ) ? sanitize_text_field( $attrs['borderStyle'] ) : 'solid',
			'tableWidth'  => isset( $attrs['tableWidth'] ) ? sanitize_text_field( $attrs['tableWidth'] ) : '100%',
		),
		'mergedCells' => array(),
		'metadata'    => array(),
	);

	update_post_meta(
		$post_id,
		'_wstech_table_data',
		wp_json_encode( $table_data_value, JSON_UNESCAPED_UNICODE )
	);
}
add_action( 'save_post', 'wstb_sync_block_to_meta' );

/**
 * Recursively find a block by name in a parsed blocks array.
 *
 * @param array  $blocks     Array of parsed blocks.
 * @param string $block_name Block name to search for.
 * @return array|null The found block or null.
 */
function wstb_find_block( $blocks, $block_name ) {
	foreach ( $blocks as $block ) {
		if ( $block_name === $block['blockName'] ) {
			return $block;
		}

		if ( ! empty( $block['innerBlocks'] ) ) {
			$found = wstb_find_block( $block['innerBlocks'], $block_name );
			if ( $found ) {
				return $found;
			}
		}
	}

	return null;
}
