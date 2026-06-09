<?php
/**
 * WSTech Table Shortcode handler.
 *
 * Registers [wstech_table] shortcode with support for id and slug attributes.
 *
 * @package WSTech_Table_Builder
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handles the [wstech_table] shortcode registration and rendering.
 */
class WSTech_Table_Shortcode {

	/**
	 * Register the shortcode.
	 *
	 * @return void
	 */
	public static function init() {
		add_shortcode( 'wstech_table', array( __CLASS__, 'render' ) );
	}

	/**
	 * Render the [wstech_table] shortcode.
	 *
	 * Supports two attributes:
	 * - id   (int)    — the post ID of a wstech_table CPT entry.
	 * - slug (string) — the post slug of a wstech_table CPT entry.
	 *
	 * If both are provided, `id` takes priority.
	 *
	 * @param array|string $atts Shortcode attributes.
	 * @return string Rendered table HTML or empty string.
	 */
	public static function render( $atts ) {
		$atts = shortcode_atts(
			array(
				'id'   => 0,
				'slug' => '',
			),
			$atts,
			'wstech_table'
		);

		$table_id = absint( $atts['id'] );
		$slug     = sanitize_title( $atts['slug'] );
		$post     = null;

		// Resolve the table post — id takes priority over slug.
		if ( $table_id > 0 ) {
			$post = get_post( $table_id );
		} elseif ( ! empty( $slug ) ) {
			$post = get_page_by_path( $slug, OBJECT, 'wstech_table' );
		}

		// Validate that a post was found.
		if ( ! $post ) {
			return self::render_error(
				__( 'Table not found. Please check the shortcode ID or slug.', 'wstech-table-builder' )
			);
		}

		// Validate post type.
		if ( 'wstech_table' !== $post->post_type ) {
			return self::render_error(
				__( 'The specified post is not a WSTech Table.', 'wstech-table-builder' )
			);
		}

		// Validate publication status.
		if ( 'publish' !== $post->post_status ) {
			return self::render_error(
				sprintf(
					/* translators: %s: post status */
					__( 'This table is not published (status: %s).', 'wstech-table-builder' ),
					$post->post_status
				)
			);
		}

		// Load table data from post meta.
		$raw_data = get_post_meta( $post->ID, '_wstech_table_data', true );

		if ( empty( $raw_data ) ) {
			return self::render_error(
				__( 'No table data found for this table.', 'wstech-table-builder' )
			);
		}

		$decoded = json_decode( $raw_data, true );

		if ( ! is_array( $decoded ) ) {
			return self::render_error(
				__( 'Invalid table data format.', 'wstech-table-builder' )
			);
		}

		$table_data = isset( $decoded['tableData'] ) ? $decoded['tableData'] : array();
		$settings   = isset( $decoded['settings'] ) ? $decoded['settings'] : array();
		$styles     = isset( $decoded['styles'] ) ? $decoded['styles'] : array();

		if ( empty( $table_data ) ) {
			return self::render_error(
				__( 'This table has no data.', 'wstech-table-builder' )
			);
		}

		// Ensure frontend assets are enqueued.
		self::ensure_assets();

		return WSTech_Table_Renderer::render_safe( $table_data, $settings, $styles );
	}

	/**
	 * Ensure frontend CSS and JS are enqueued.
	 *
	 * Useful when a shortcode appears on a page where the block isn't present,
	 * so the assets wouldn't otherwise be loaded.
	 *
	 * @return void
	 */
	private static function ensure_assets() {
		if ( function_exists( 'wstb_enqueue_frontend_assets_now' ) ) {
			wstb_enqueue_frontend_assets_now();
		}
	}

	/**
	 * Render an error message visible only to users with edit_posts capability.
	 *
	 * Regular visitors see nothing; editors and admins see a styled error notice.
	 *
	 * @param string $message Error message to display.
	 * @return string HTML error notice or empty string.
	 */
	private static function render_error( $message ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return '';
		}

		return sprintf(
			'<div class="wstb-shortcode-error" style="border-left:4px solid #d63638;background:#fef7f7;padding:12px 16px;margin:16px 0;font-size:13px;color:#1d2327;">
				<strong>%s</strong> %s
			</div>',
			esc_html__( 'WSTech Table Builder:', 'wstech-table-builder' ),
			esc_html( $message )
		);
	}
}
