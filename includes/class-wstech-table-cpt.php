<?php
/**
 * WSTech Table CPT registration and admin customization.
 *
 * @package WSTech_Table_Builder
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the wstech_table custom post type and customizes admin UI.
 */
class WSTech_Table_CPT {

	/**
	 * Hook everything into WordPress.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_post_type' ) );
		add_filter( 'manage_wstech_table_posts_columns', array( __CLASS__, 'custom_columns' ) );
		add_action( 'manage_wstech_table_posts_custom_column', array( __CLASS__, 'render_column' ), 10, 2 );
		add_filter( 'post_row_actions', array( __CLASS__, 'row_actions' ), 10, 2 );
		add_action( 'add_meta_boxes', array( __CLASS__, 'add_meta_boxes' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_shortcode_admin_assets' ) );
	}

	/**
	 * Register the wstech_table custom post type.
	 *
	 * @return void
	 */
	public static function register_post_type() {
		$labels = array(
			'name'                  => _x( 'WSTech Tables', 'Post type general name', 'wstech-table-builder' ),
			'singular_name'         => _x( 'Table', 'Post type singular name', 'wstech-table-builder' ),
			'menu_name'             => __( 'WSTech Tables', 'wstech-table-builder' ),
			'name_admin_bar'        => __( 'Table', 'wstech-table-builder' ),
			'add_new'               => __( 'Add New', 'wstech-table-builder' ),
			'add_new_item'          => __( 'Add New Table', 'wstech-table-builder' ),
			'new_item'              => __( 'New Table', 'wstech-table-builder' ),
			'edit_item'             => __( 'Edit Table', 'wstech-table-builder' ),
			'view_item'             => __( 'View Table', 'wstech-table-builder' ),
			'all_items'             => __( 'All Tables', 'wstech-table-builder' ),
			'search_items'          => __( 'Search Tables', 'wstech-table-builder' ),
			'not_found'             => __( 'No tables found.', 'wstech-table-builder' ),
			'not_found_in_trash'    => __( 'No tables found in Trash.', 'wstech-table-builder' ),
			'filter_items_list'     => __( 'Filter tables list', 'wstech-table-builder' ),
			'items_list_navigation' => __( 'Tables list navigation', 'wstech-table-builder' ),
			'items_list'            => __( 'Tables list', 'wstech-table-builder' ),
		);

		$args = array(
			'labels'          => $labels,
			'public'          => false,
			'show_ui'         => true,
			'show_in_rest'    => true,
			'rest_base'       => 'wstech-tables',
			'menu_icon'       => 'dashicons-editor-table',
			'menu_position'   => 25,
			'capability_type' => 'post',
			'supports'        => array( 'title', 'editor', 'revisions' ),
			'template'        => array(
				array( 'vtb/table-builder' ),
			),
			'template_lock'   => 'all',
		);

		register_post_type( 'wstech_table', $args );

		// Register the _wstech_table_data meta field for REST API visibility.
		register_post_meta(
			'wstech_table',
			'_wstech_table_data',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function ( $allowed, $meta_key, $post_id ) {
					return current_user_can( 'edit_post', $post_id );
				},
			)
		);
	}

	/**
	 * Add custom columns to the tables list table.
	 *
	 * @param array $columns Existing columns.
	 * @return array Modified columns with Table ID and Shortcode inserted after title.
	 */
	public static function custom_columns( $columns ) {
		$new_columns = array();

		foreach ( $columns as $key => $value ) {
			$new_columns[ $key ] = $value;

			if ( 'title' === $key ) {
				$new_columns['table_id']  = __( 'Table ID', 'wstech-table-builder' );
				$new_columns['shortcode'] = __( 'Shortcode', 'wstech-table-builder' );
			}
		}

		return $new_columns;
	}

	/**
	 * Render content for the custom admin columns.
	 *
	 * @param string $column  Column name.
	 * @param int    $post_id Post ID.
	 * @return void
	 */
	public static function render_column( $column, $post_id ) {
		switch ( $column ) {
			case 'table_id':
				echo '<code>' . esc_html( $post_id ) . '</code>';
				break;

			case 'shortcode':
				$shortcode = '[wstech_table id="' . $post_id . '"]';
				printf(
					'<code class="wstb-shortcode-code" title="%s" data-shortcode="%s">%s</code> <span class="dashicons dashicons-clipboard wstb-copy-icon" data-shortcode="%s" title="%s"></span>',
					esc_attr__( 'Click to copy', 'wstech-table-builder' ),
					esc_attr( $shortcode ),
					esc_html( $shortcode ),
					esc_attr( $shortcode ),
					esc_attr__( 'Copy shortcode', 'wstech-table-builder' )
				);
				break;
		}
	}

	/**
	 * Add Duplicate and Copy Shortcode row actions.
	 *
	 * @param array   $actions Existing row actions.
	 * @param WP_Post $post    Current post object.
	 * @return array Modified row actions.
	 */
	public static function row_actions( $actions, $post ) {
		if ( 'wstech_table' !== $post->post_type || ! current_user_can( 'edit_post', $post->ID ) ) {
			return $actions;
		}

		$duplicate_url = wp_nonce_url(
			admin_url( 'admin.php?action=wstb_duplicate&post=' . $post->ID ),
			'wstb_duplicate_' . $post->ID
		);

		$shortcode = '[wstech_table id="' . $post->ID . '"]';

		$actions['wstb_duplicate'] = sprintf(
			'<a href="%s" aria-label="%s">%s</a>',
			esc_url( $duplicate_url ),
			/* translators: %s: table title */
			esc_attr( sprintf( __( 'Duplicate &#8220;%s&#8221;', 'wstech-table-builder' ), $post->post_title ) ),
			esc_html__( 'Duplicate', 'wstech-table-builder' )
		);

		$actions['wstb_copy_shortcode'] = sprintf(
			'<a href="#" class="wstb-copy-shortcode-link" data-shortcode="%s" aria-label="%s">%s</a>',
			esc_attr( $shortcode ),
			esc_attr__( 'Copy shortcode to clipboard', 'wstech-table-builder' ),
			esc_html__( 'Copy Shortcode', 'wstech-table-builder' )
		);

		return $actions;
	}

	/**
	 * Add a sidebar meta box on the table edit screen.
	 *
	 * @return void
	 */
	public static function add_meta_boxes() {
		add_meta_box(
			'wstb_embed_table',
			__( 'Embed This Table', 'wstech-table-builder' ),
			array( __CLASS__, 'render_shortcode_meta_box' ),
			'wstech_table',
			'side',
			'high'
		);
	}

	/**
	 * Render the shortcode embed meta box.
	 *
	 * @param WP_Post $post Current post.
	 * @return void
	 */
	public static function render_shortcode_meta_box( $post ) {
		$shortcode = '[wstech_table id="' . $post->ID . '"]';
		?>
		<div class="wstb-embed-metabox">
			<p>
				<label for="wstb-shortcode-field">
					<strong><?php esc_html_e( 'Shortcode:', 'wstech-table-builder' ); ?></strong>
				</label>
			</p>
			<div class="wstb-embed-copy-row">
				<input
					type="text"
					id="wstb-shortcode-field"
					value="<?php echo esc_attr( $shortcode ); ?>"
					readonly
					class="widefat wstb-shortcode-field"
				/>
				<button
					type="button"
					class="button wstb-copy-btn"
					data-shortcode="<?php echo esc_attr( $shortcode ); ?>"
					title="<?php esc_attr_e( 'Copy to clipboard', 'wstech-table-builder' ); ?>"
				>
					<span class="dashicons dashicons-clipboard"></span>
				</button>
			</div>

			<div class="wstb-embed-instructions">
				<p class="description">
					<?php esc_html_e( 'Paste this shortcode into any post, page, or widget area to embed this table.', 'wstech-table-builder' ); ?>
				</p>
				<p class="description wstb-slug-description">
					<?php esc_html_e( 'You can also use the slug:', 'wstech-table-builder' ); ?>
					<br />
					<code class="wstb-shortcode-example">[wstech_table slug="<?php echo esc_html( $post->post_name ); ?>"]</code>
				</p>
			</div>
		</div>
		<?php
	}

	/**
	 * Enqueue admin CSS and JavaScript for clipboard copy with a toast notification.
	 *
	 * Only loads on wstech_table admin screens.
	 *
	 * @param string $hook_suffix Current admin screen hook suffix.
	 * @return void
	 */
	public static function enqueue_shortcode_admin_assets( $hook_suffix = '' ) {
		unset( $hook_suffix );

		$screen = get_current_screen();

		if ( ! $screen || 'wstech_table' !== $screen->post_type ) {
			return;
		}

		wp_register_style( 'wstb-admin-shortcode', false, array(), WSTB_VERSION );
		wp_enqueue_style( 'wstb-admin-shortcode' );
		wp_add_inline_style(
			'wstb-admin-shortcode',
			'
			.wstb-shortcode-code {
				cursor: pointer;
				user-select: all;
			}
			.wstb-copy-icon {
				color: #2271b1;
				cursor: pointer;
				vertical-align: middle;
			}
			.wstb-embed-copy-row {
				display: flex;
				gap: 4px;
			}
			.wstb-shortcode-field {
				font-family: monospace;
				font-size: 12px;
			}
			.wstb-copy-btn .dashicons {
				vertical-align: middle;
			}
			.wstb-embed-instructions {
				margin-top: 12px;
			}
			.wstb-slug-description {
				margin-top: 8px;
			}
			.wstb-shortcode-example {
				font-size: 11px;
			}
			.wstb-toast {
				position: fixed;
				bottom: 30px;
				left: 50%;
				transform: translateX(-50%);
				background: #1d2327;
				color: #fff;
				padding: 10px 24px;
				border-radius: 4px;
				font-size: 13px;
				z-index: 999999;
				opacity: 0;
				transition: opacity 0.3s ease;
				pointer-events: none;
			}
			.wstb-toast.wstb-toast--visible {
				opacity: 1;
			}
			'
		);

		wp_register_script( 'wstb-admin-shortcode', false, array(), WSTB_VERSION, true );
		wp_enqueue_script( 'wstb-admin-shortcode' );

		$copied_message = wp_json_encode( __( 'Shortcode copied to clipboard.', 'wstech-table-builder' ) );
		$failed_message = wp_json_encode( __( 'Failed to copy. Please copy manually.', 'wstech-table-builder' ) );

		wp_add_inline_script(
			'wstb-admin-shortcode',
			sprintf(
				"
				(function() {
					'use strict';

					var copiedMessage = %1\$s;
					var failedMessage = %2\$s;

					function wstbShowToast( message ) {
						var existing = document.querySelector( '.wstb-toast' );
						if ( existing ) {
							existing.remove();
						}

						var toast = document.createElement( 'div' );
						toast.className = 'wstb-toast';
						toast.textContent = message;
						document.body.appendChild( toast );

						toast.offsetHeight;
						toast.classList.add( 'wstb-toast--visible' );

						setTimeout( function() {
							toast.classList.remove( 'wstb-toast--visible' );
							setTimeout( function() {
								toast.remove();
							}, 300 );
						}, 2000 );
					}

					function wstbFallbackCopy( text ) {
						var textarea = document.createElement( 'textarea' );
						textarea.value = text;
						textarea.style.position = 'fixed';
						textarea.style.opacity = '0';
						document.body.appendChild( textarea );
						textarea.select();
						try {
							document.execCommand( 'copy' );
							wstbShowToast( copiedMessage );
						} catch ( err ) {
							wstbShowToast( failedMessage );
						}
						document.body.removeChild( textarea );
					}

					function wstbCopyToClipboard( text ) {
						if ( navigator.clipboard && navigator.clipboard.writeText ) {
							navigator.clipboard.writeText( text ).then( function() {
								wstbShowToast( copiedMessage );
							} ).catch( function() {
								wstbFallbackCopy( text );
							} );
						} else {
							wstbFallbackCopy( text );
						}
					}

					document.addEventListener( 'click', function( event ) {
						var field = event.target.closest( '.wstb-shortcode-field' );
						var trigger = event.target.closest( '.wstb-copy-icon, .wstb-shortcode-code, .wstb-copy-btn, .wstb-copy-shortcode-link' );

						if ( field ) {
							field.select();
						}

						if ( trigger && trigger.dataset.shortcode ) {
							event.preventDefault();
							wstbCopyToClipboard( trigger.dataset.shortcode );
						}
					} );
				}());
				",
				$copied_message,
				$failed_message
			)
		);
	}
}
