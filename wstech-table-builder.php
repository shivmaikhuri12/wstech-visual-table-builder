<?php
/**
 * Plugin Name: WSTech Visual Table Builder
 * Plugin URI: https://www.wstech.in
 * Description: Professional visual table builder for WordPress with drag-and-drop editing, merge cells, templates, import/export, shortcodes, and responsive data tables.
 * Version: 2.0.0
 * Requires at least: 6.2
 * Requires PHP: 7.4
 * Author: Web Solution Technologies
 * Author URI: https://www.wstech.in
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: wstech-table-builder
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
define( 'WSTB_VERSION', '2.0.0' );
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

	return WSTech_Table_Renderer::render( $table_data, $settings, $styles );
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
				esc_html__( 'WSTech Visual Table Builder: Build directory not found. Please run %s to compile the block assets.', 'wstech-table-builder' ),
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
			esc_html__( 'Manage Tables', 'wstech-table-builder' )
		),
		sprintf(
			'<a href="%s">%s</a>',
			esc_url( admin_url( 'post-new.php?post_type=wstech_table' ) ),
			esc_html__( 'Add New Table', 'wstech-table-builder' )
		),
		sprintf(
			'<a href="%s" target="_blank" rel="noopener noreferrer" style="font-weight:600;color:#0a7f42;">%s</a>',
			esc_url( 'https://wstech.in/donate' ),
			esc_html__( 'Donate', 'wstech-table-builder' )
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
		'plugin'    => 'wstech-table-builder',
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
		esc_url( wstb_plugin_information_url() ),
		esc_attr__( 'View WSTech Visual Table Builder details', 'wstech-table-builder' ),
		esc_html__( 'View details', 'wstech-table-builder' )
	);

	$links[] = sprintf(
		'<a href="%s" class="thickbox open-plugin-details-modal" aria-label="%s">%s</a>',
		esc_url( wstb_plugin_information_url( 'docs' ) ),
		esc_attr__( 'Open WSTech Visual Table Builder documentation', 'wstech-table-builder' ),
		esc_html__( 'Docs', 'wstech-table-builder' )
	);

	$links[] = sprintf(
		'<a href="%s" class="thickbox open-plugin-details-modal" aria-label="%s">%s</a>',
		esc_url( wstb_plugin_information_url( 'faq' ) ),
		esc_attr__( 'Open WSTech Visual Table Builder frequently asked questions', 'wstech-table-builder' ),
		esc_html__( 'FAQs', 'wstech-table-builder' )
	);

	return $links;
}
add_filter( 'plugin_row_meta', 'wstb_plugin_row_meta', 10, 2 );

/**
 * Provide local plugin information for the native WordPress details modal.
 *
 * @param false|object|WP_Error $result Current plugin API result.
 * @param string                $action API action.
 * @param object                $args   API arguments.
 * @return false|object|WP_Error Plugin API result.
 */
function wstb_plugin_information( $result, $action, $args ) {
	if ( 'plugin_information' !== $action || empty( $args->slug ) || 'wstech-table-builder' !== $args->slug ) {
		return $result;
	}

	return (object) array(
		'name'              => 'WSTech Visual Table Builder',
		'slug'              => 'wstech-table-builder',
		'version'           => WSTB_VERSION,
		'author'            => '<a href="https://www.wstech.in" target="_blank" rel="noopener noreferrer">Web Solution Technologies</a>',
		'author_profile'    => 'https://www.wstech.in',
		'homepage'          => 'https://www.wstech.in',
		'requires'          => '6.2',
		'tested'            => '7.0',
		'requires_php'      => '7.4',
		'last_updated'      => '2026-06-04',
		'short_description' => 'Professional visual table builder for WordPress with reusable tables, shortcodes, templates, import/export, and responsive data-table features.',
		'download_link'     => '',
		'banners'           => array(
			'low'  => WSTB_PLUGIN_URL . 'assets/plugin-banner.svg',
			'high' => WSTB_PLUGIN_URL . 'assets/plugin-banner.svg',
		),
		'icons'             => array(
			'svg' => WSTB_PLUGIN_URL . 'assets/plugin-icon.svg',
			'1x'  => WSTB_PLUGIN_URL . 'assets/plugin-icon.svg',
			'2x'  => WSTB_PLUGIN_URL . 'assets/plugin-icon.svg',
		),
		'active_installs'   => 0,
		'rating'            => 0,
		'num_ratings'       => 0,
		'sections'          => wstb_plugin_information_sections(),
	);
}
add_filter( 'plugins_api', 'wstb_plugin_information', 20, 3 );

/**
 * Get the tab content for the plugin details modal.
 *
 * @return array Modal sections keyed by tab slug.
 */
function wstb_plugin_information_sections() {
	$add_table_url    = esc_url( admin_url( 'post-new.php?post_type=wstech_table' ) );
	$manage_table_url = esc_url( admin_url( 'edit.php?post_type=wstech_table' ) );
	$donate_url       = esc_url( 'https://wstech.in/donate' );

	return array(
		'description'  => implode(
			"\n",
			array(
				'<h2>Build professional WordPress tables without code</h2>',
				'<p><strong>WSTech Visual Table Builder</strong> adds a focused table-building workflow to WordPress. You can create tables visually, save reusable tables in the admin, embed them with shortcodes, or place an inline table directly inside the block editor.</p>',
				'<p>The plugin is designed for real content tables: pricing tables, employee directories, invoice rows, project trackers, class timetables, nutrition facts, comparison charts, schedules, and searchable data tables.</p>',
				'<h3>Best ways to use it</h3>',
				'<ul>',
				'<li><strong>Reusable table:</strong> go to <a href="' . $add_table_url . '" target="_parent">WSTech Tables &rarr; Add New</a>, publish the table, then copy its shortcode.</li>',
				'<li><strong>Inline block:</strong> open any post or page, add the <strong>Visual Table Builder</strong> block, and build the table directly in the editor.</li>',
				'<li><strong>Page builders:</strong> paste the shortcode into Elementor, Divi, Beaver Builder, Classic Editor, widgets, or template files.</li>',
				'</ul>',
				'<p><a href="' . $manage_table_url . '" target="_parent">Manage saved tables</a> or <a href="' . $donate_url . '" target="_blank" rel="noopener noreferrer">support development with a donation</a>.</p>',
			)
		),
		'features'     => implode(
			"\n",
			array(
				'<h2>Included Features</h2>',
				'<h3>Reusable table management</h3>',
				'<ul>',
				'<li>Dedicated <strong>WSTech Tables</strong> admin area for creating and managing reusable tables.</li>',
				'<li>Each published table gets a shortcode such as <code>[wstech_table id=&quot;123&quot;]</code>.</li>',
				'<li>Slug-based embedding is supported with <code>[wstech_table slug=&quot;pricing-table&quot;]</code>.</li>',
				'<li>Duplicate tables, copy shortcodes, and use WordPress revisions for table history.</li>',
				'</ul>',
				'<h3>Visual editing</h3>',
				'<ul>',
				'<li>Click-to-edit cells with rich text formatting, links, bold, italic, underline, and strikethrough.</li>',
				'<li>Per-cell colors, alignment, vertical alignment, padding, and font styling.</li>',
				'<li>Right-click context menu for row and column operations.</li>',
				'<li>Drag and drop row and column reordering.</li>',
				'<li>Undo and redo controls, plus keyboard navigation with Tab and Shift+Tab.</li>',
				'</ul>',
				'<h3>Structure and templates</h3>',
				'<ul>',
				'<li>Header rows, footer rows, first-column headers, table captions, and custom borders.</li>',
				'<li>Merge and unmerge cells with colspan and rowspan support.</li>',
				'<li>10 built-in starter templates: blank table, employee directory, pricing table, product comparison, invoice, timetable, standings, project tracker, budget tracker, and nutrition facts.</li>',
				'<li>6 built-in themes: Default, Striped, Bordered, Dark, Minimal, and Colorful.</li>',
				'</ul>',
				'<h3>Import, export, and frontend behavior</h3>',
				'<ul>',
				'<li>Import CSV files or pasted CSV data with delimiter detection.</li>',
				'<li>Import and export full JSON backups using <code>.vtb.json</code>.</li>',
				'<li>Enable frontend sorting, live search, pagination, hover highlights, and CSV export per table.</li>',
				'<li>Responsive horizontal-scroll mode and mobile stacked-card mode.</li>',
				'</ul>',
			)
		),
		'installation' => implode(
			"\n",
			array(
				'<h2>Installation</h2>',
				'<ol>',
				'<li>Upload the <code>wstech-table-builder</code> plugin ZIP from <strong>Plugins &rarr; Add New &rarr; Upload Plugin</strong>.</li>',
				'<li>Activate <strong>WSTech Visual Table Builder</strong> from the Plugins screen.</li>',
				'<li>Go to <a href="' . $add_table_url . '" target="_parent">WSTech Tables &rarr; Add New</a> to create your first reusable table.</li>',
				'<li>Publish the table and copy the shortcode from the sidebar meta box or the tables list screen.</li>',
				'<li>Paste the shortcode into any page, post, builder widget, or template where the table should appear.</li>',
				'</ol>',
				'<h3>Quick inline block setup</h3>',
				'<ol>',
				'<li>Edit any post or page in the block editor.</li>',
				'<li>Click the block inserter and search for <strong>Visual Table Builder</strong>.</li>',
				'<li>Choose a template or start with a blank table.</li>',
				'<li>Save or publish the post.</li>',
				'</ol>',
			)
		),
		'docs'         => implode(
			"\n",
			array(
				'<h2>Documentation</h2>',
				'<h3>Create a reusable table</h3>',
				'<ol>',
				'<li>Open <a href="' . $add_table_url . '" target="_parent">WSTech Tables &rarr; Add New</a>.</li>',
				'<li>Enter a table title. This title is for admin organization.</li>',
				'<li>Edit cells directly in the table. Use the toolbar for templates, import, export, merge, and undo/redo.</li>',
				'<li>Use the right sidebar for header/footer rows, theme, borders, responsive mode, sorting, search, pagination, and CSV export.</li>',
				'<li>Publish the table, then copy the shortcode shown in the sidebar.</li>',
				'</ol>',
				'<h3>Use the table in Elementor</h3>',
				'<ol>',
				'<li>Create and publish a reusable table.</li>',
				'<li>Copy the shortcode, for example <code>[wstech_table id=&quot;123&quot;]</code>.</li>',
				'<li>Open the Elementor page and add a <strong>Shortcode</strong> widget.</li>',
				'<li>Paste the shortcode and update the page.</li>',
				'</ol>',
				'<h3>Use the table in Gutenberg</h3>',
				'<ul>',
				'<li>For reusable tables, paste the shortcode into a Shortcode block.</li>',
				'<li>For one-off tables, insert the native <strong>Visual Table Builder</strong> block directly in the page.</li>',
				'</ul>',
				'<h3>Import data</h3>',
				'<ul>',
				'<li>Use <strong>Import &rarr; CSV</strong> for spreadsheet exports from Excel, Google Sheets, or LibreOffice.</li>',
				'<li>Use <strong>Import &rarr; JSON</strong> to restore a complete <code>.vtb.json</code> backup with table data, styles, and settings.</li>',
				'</ul>',
				'<h3>Frontend controls</h3>',
				'<p>Open the block sidebar and enable sorting, search, pagination, hover highlight, and CSV export only for the tables that need those visitor-facing controls.</p>',
			)
		),
		'shortcodes'   => implode(
			"\n",
			array(
				'<h2>Shortcodes</h2>',
				'<p>Shortcodes are available for reusable tables created in <strong>WSTech Tables</strong>. Publish the table first, then copy the shortcode from the sidebar or from the tables list screen.</p>',
				'<h3>Embed by table ID</h3>',
				'<p><code>[wstech_table id=&quot;123&quot;]</code></p>',
				'<p>This is the recommended method because the numeric table ID never changes.</p>',
				'<h3>Embed by slug</h3>',
				'<p><code>[wstech_table slug=&quot;pricing-table&quot;]</code></p>',
				'<p>Use this when you prefer readable shortcodes. If the table slug changes, update the shortcode too.</p>',
				'<h3>Use inside PHP templates</h3>',
				'<p><code>&lt;?php echo do_shortcode( &#039;[wstech_table id=&quot;123&quot;]&#039; ); ?&gt;</code></p>',
				'<h3>Where shortcodes work</h3>',
				'<ul>',
				'<li>WordPress Shortcode block.</li>',
				'<li>Elementor Shortcode widget.</li>',
				'<li>Divi Code module.</li>',
				'<li>Beaver Builder HTML or shortcode modules.</li>',
				'<li>Classic Editor content area.</li>',
				'<li>Theme template files through <code>do_shortcode()</code>.</li>',
				'</ul>',
			)
		),
		'faq'          => implode(
			"\n",
			array(
				'<h2>Frequently Asked Questions</h2>',
				'<h3>How do I start with the plugin?</h3>',
				'<p>Go to <a href="' . $add_table_url . '" target="_parent">WSTech Tables &rarr; Add New</a>, build your table, publish it, copy the shortcode, and paste it where you want the table to appear.</p>',
				'<h3>How do I use it with Elementor?</h3>',
				'<p>Create a reusable table, copy the shortcode, then paste it into an Elementor Shortcode widget.</p>',
				'<h3>Can the same table appear on multiple pages?</h3>',
				'<p>Yes. Use the same shortcode anywhere. When you edit the original reusable table, every embedded copy updates automatically.</p>',
				'<h3>Can I use it without shortcodes?</h3>',
				'<p>Yes. Add the Visual Table Builder block directly inside any block-editor page or post.</p>',
				'<h3>Can I import from Excel or Google Sheets?</h3>',
				'<p>Yes. Export your spreadsheet as CSV, then use the Import button in the block toolbar.</p>',
				'<h3>How do I merge cells?</h3>',
				'<p>Shift-click to select a rectangular group of cells, then click Merge in the table toolbar. Select a merged cell and click Unmerge to split it again.</p>',
				'<h3>Why is my shortcode not showing a table?</h3>',
				'<p>Check that the table exists, is published, and the shortcode ID or slug is correct. Admin users will see a helpful shortcode error message when a table cannot be resolved.</p>',
			)
		),
		'changelog'    => implode(
			"\n",
			array(
				'<h2>Changelog</h2>',
				'<h3>2.0.0</h3>',
				'<ul>',
				'<li>Added reusable table management through the WSTech Tables custom post type.</li>',
				'<li>Added shortcode support by ID and slug.</li>',
				'<li>Added shared PHP rendering for blocks and shortcodes.</li>',
				'<li>Added duplicate table, copy shortcode, and sidebar embed helper.</li>',
				'<li>Added merge cells, drag and drop reordering, templates, CSV import, JSON import/export, and undo/redo controls.</li>',
				'<li>Improved frontend sorting, search, pagination, CSV export, responsive stack mode, and cell data compatibility.</li>',
				'</ul>',
				'<h3>1.0.0</h3>',
				'<ul>',
				'<li>Initial Gutenberg table builder release with cell editing, themes, formatting, responsive modes, sorting, search, pagination, and CSV export.</li>',
				'</ul>',
			)
		),
	);
}

/**
 * Handle the "Duplicate Table" admin action.
 *
 * Copies the CPT post and all its post meta, then redirects to the edit screen.
 *
 * @return void
 */
function wstb_duplicate_table() {
	if ( ! isset( $_GET['post'] ) || ! isset( $_GET['_wpnonce'] ) ) {
		wp_die( esc_html__( 'Invalid request.', 'wstech-table-builder' ) );
	}

	$post_id = absint( $_GET['post'] );
	$nonce   = sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) );

	if ( ! wp_verify_nonce( $nonce, 'wstb_duplicate_' . $post_id ) ) {
		wp_die( esc_html__( 'Security check failed.', 'wstech-table-builder' ) );
	}

	$post = get_post( $post_id );

	if ( ! $post || 'wstech_table' !== $post->post_type ) {
		wp_die( esc_html__( 'Table not found.', 'wstech-table-builder' ) );
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		wp_die( esc_html__( 'You do not have permission to duplicate this table.', 'wstech-table-builder' ) );
	}

	// Create the duplicate post.
	$new_post_id = wp_insert_post(
		array(
			'post_title'   => sprintf(
				/* translators: %s: original table title */
				__( '%s (Copy)', 'wstech-table-builder' ),
				$post->post_title
			),
			'post_content' => $post->post_content,
			'post_status'  => 'draft',
			'post_type'    => 'wstech_table',
			'post_author'  => get_current_user_id(),
		)
	);

	if ( is_wp_error( $new_post_id ) ) {
		wp_die( esc_html__( 'Failed to duplicate table.', 'wstech-table-builder' ) );
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
