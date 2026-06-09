<?php
/**
 * WSTech Table Renderer — shared rendering engine.
 *
 * Used by both the block render_callback and the [wstech_table] shortcode
 * to produce identical frontend HTML.
 *
 * @package WSTech_Table_Builder
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Renders a WSTech table from structured data into HTML.
 */
class WSTech_Table_Renderer {

	/**
	 * Render a table to HTML.
	 *
	 * @param array $table_data Rows and cells data.
	 * @param array $settings   Table behavior settings.
	 * @param array $styles     Table visual styles.
	 * @return string Complete HTML output with dynamic values escaped.
	 */
	public static function render( $table_data, $settings, $styles ) {
		$table_data = self::normalize_table_data( $table_data );

		if ( empty( $table_data ) ) {
			return '';
		}

		// Normalize settings with defaults.
		$settings = wp_parse_args(
			$settings,
			array(
				'hasHeaderRow'      => false,
				'hasFooterRow'      => false,
				'sortable'          => false,
				'searchable'        => false,
				'pagination'        => false,
				'pageSize'          => 10,
				'frontendCsvExport' => false,
				'firstColumnHeader' => false,
				'hoverHighlight'    => false,
				'responsive'        => 'scroll',
				'caption'           => '',
			)
		);

		// Normalize styles with defaults.
		$styles = wp_parse_args(
			$styles,
			array(
				'theme'       => 'default',
				'borderColor' => '#dee2e6',
				'borderWidth' => 1,
				'borderStyle' => 'solid',
				'tableWidth'  => '100%',
			)
		);

		$has_header = ! empty( $settings['hasHeaderRow'] );
		$has_footer = ! empty( $settings['hasFooterRow'] );
		$total_rows = count( $table_data );

		// Determine row sections.
		$header_rows = array();
		$footer_rows = array();
		$body_rows   = array();

		if ( $has_header && $total_rows > 0 ) {
			$header_rows = array( $table_data[0] );
		}

		$min_rows_for_footer = $has_header ? 2 : 1;

		if ( $has_footer && $total_rows > $min_rows_for_footer ) {
			$footer_rows = array( $table_data[ $total_rows - 1 ] );
		}

		$body_start = $has_header ? 1 : 0;
		$body_end   = ! empty( $footer_rows ) ? $total_rows - 1 : $total_rows;

		for ( $i = $body_start; $i < $body_end; $i++ ) {
			$body_rows[] = $table_data[ $i ];
		}

		// Build header labels for data-vtb-label attributes.
		$header_labels = array();
		if ( $has_header && ! empty( $header_rows[0] ) ) {
			foreach ( $header_rows[0] as $cell ) {
				$content         = isset( $cell['content'] ) ? $cell['content'] : '';
				$header_labels[] = wp_strip_all_tags( $content );
			}
		}

		// Responsive class.
		$responsive_class = 'scroll' === $settings['responsive'] ? 'vtb-scroll' : 'vtb-stack';

		// Theme class.
		$theme_class = 'vtb-theme-' . sanitize_html_class( $styles['theme'], 'default' );

		// Build output.
		$output = '';

		// Outer wrapper.
		$output .= '<div class="vtb-block">';
		$output .= '<div class="vtb-wrapper ' . esc_attr( $theme_class ) . ' ' . esc_attr( $responsive_class ) . '">';

		// Search bar.
		if ( ! empty( $settings['searchable'] ) ) {
			$output .= '<div class="vtb-search-bar">';
			$output .= '<input type="text" class="vtb-search-input" placeholder="' . esc_attr__( 'Search table…', 'wstech-table-builder' ) . '" aria-label="' . esc_attr__( 'Search table', 'wstech-table-builder' ) . '" />';
			$output .= '</div>';
		}

		// Table container.
		$output .= '<div class="vtb-table-container">';

		// Table element.
		$table_width  = self::sanitize_table_width( $styles['tableWidth'] );
		$border_color = self::sanitize_css_color( $styles['borderColor'], '#dee2e6' );
		$border_width = self::sanitize_int_range( $styles['borderWidth'], 0, 5, 1 );
		$border_style = self::sanitize_choice(
			$styles['borderStyle'],
			array( 'solid', 'dashed', 'dotted', 'double', 'none' ),
			'solid'
		);

		$table_style = sprintf(
			'width:%s;--vtb-border-color:%s;--vtb-border-width:%spx;--vtb-border-style:%s',
			esc_attr( $table_width ),
			esc_attr( $border_color ),
			esc_attr( $border_width ),
			esc_attr( $border_style )
		);

		$table_attrs = ' class="vtb-table" style="' . esc_attr( $table_style ) . '"';

		if ( ! empty( $settings['sortable'] ) ) {
			$table_attrs .= ' data-vtb-sortable="true"';
		}
		if ( ! empty( $settings['searchable'] ) ) {
			$table_attrs .= ' data-vtb-searchable="true"';
		}
		if ( ! empty( $settings['pagination'] ) ) {
			$table_attrs .= ' data-vtb-pagination="true"';
			$table_attrs .= ' data-vtb-page-size="' . esc_attr( (int) $settings['pageSize'] ) . '"';
		}
		if ( ! empty( $settings['frontendCsvExport'] ) ) {
			$table_attrs .= ' data-vtb-csv="true"';
		}
		if ( ! empty( $settings['hoverHighlight'] ) ) {
			$table_attrs .= ' data-vtb-hover="true"';
		}
		if ( ! empty( $settings['firstColumnHeader'] ) ) {
			$table_attrs .= ' data-vtb-first-col="true"';
		}

		$output .= '<table' . $table_attrs . '>';

		// Caption.
		if ( ! empty( $settings['caption'] ) ) {
			$output .= '<caption class="vtb-caption">' . esc_html( $settings['caption'] ) . '</caption>';
		}

		// Thead.
		if ( ! empty( $header_rows ) ) {
			$output .= '<thead>';
			foreach ( $header_rows as $row ) {
				$output .= self::render_row( $row, 'header', $header_labels, $settings );
			}
			$output .= '</thead>';
		}

		// Tbody.
		if ( ! empty( $body_rows ) ) {
			$output .= '<tbody>';
			foreach ( $body_rows as $row ) {
				$output .= self::render_row( $row, 'body', $header_labels, $settings );
			}
			$output .= '</tbody>';
		}

		// Tfoot.
		if ( ! empty( $footer_rows ) ) {
			$output .= '<tfoot>';
			foreach ( $footer_rows as $row ) {
				$output .= self::render_row( $row, 'footer', $header_labels, $settings );
			}
			$output .= '</tfoot>';
		}

		$output .= '</table>';
		$output .= '</div>'; // .vtb-table-container

		// Footer bar (pagination and/or CSV export).
		if ( ! empty( $settings['pagination'] ) || ! empty( $settings['frontendCsvExport'] ) ) {
			$output .= '<div class="vtb-footer-bar">';

			if ( ! empty( $settings['pagination'] ) ) {
				$output .= '<div class="vtb-pagination">';
				$output .= '<button class="vtb-page-btn vtb-prev" aria-label="' . esc_attr__( 'Previous page', 'wstech-table-builder' ) . '">' . esc_html__( '← Prev', 'wstech-table-builder' ) . '</button>';
				$output .= '<span class="vtb-page-info" aria-live="polite"></span>';
				$output .= '<button class="vtb-page-btn vtb-next" aria-label="' . esc_attr__( 'Next page', 'wstech-table-builder' ) . '">' . esc_html__( 'Next →', 'wstech-table-builder' ) . '</button>';
				$output .= '</div>';
			}

			if ( ! empty( $settings['frontendCsvExport'] ) ) {
				$output .= '<button class="vtb-csv-btn" aria-label="' . esc_attr__( 'Export table as CSV', 'wstech-table-builder' ) . '">' . esc_html__( '⬇ Export CSV', 'wstech-table-builder' ) . '</button>';
			}

			$output .= '</div>'; // .vtb-footer-bar
		}

		$output .= '</div>'; // .vtb-wrapper
		$output .= '</div>'; // .vtb-block

		return $output;
	}

	/**
	 * Render a table and pass the final HTML through a strict KSES allow-list.
	 *
	 * The renderer escapes attributes as it builds the table and uses
	 * wp_kses_post() for RichText cell content. This final pass keeps the
	 * render_callback and shortcode return values explicitly KSES-filtered for
	 * repository review.
	 *
	 * @param array $table_data Rows and cells data.
	 * @param array $settings   Table behavior settings.
	 * @param array $styles     Table visual styles.
	 * @return string KSES-filtered table HTML.
	 */
	public static function render_safe( $table_data, $settings, $styles ) {
		return wp_kses( self::render( $table_data, $settings, $styles ), self::get_allowed_html() );
	}

	/**
	 * Get the HTML tags and attributes allowed in rendered table markup.
	 *
	 * @return array Allowed HTML tags and attributes for wp_kses().
	 */
	private static function get_allowed_html() {
		$allowed_html = wp_kses_allowed_html( 'post' );

		$common_attributes = array(
			'class'      => true,
			'id'         => true,
			'role'       => true,
			'style'      => true,
			'title'      => true,
			'aria-label' => true,
			'aria-live'  => true,
		);

		foreach ( array( 'div', 'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'input', 'button', 'span' ) as $tag ) {
			$allowed_html[ $tag ] = array_merge(
				isset( $allowed_html[ $tag ] ) ? $allowed_html[ $tag ] : array(),
				$common_attributes
			);
		}

		$allowed_html['table'] = array_merge(
			$allowed_html['table'],
			array(
				'data-vtb-sortable'   => true,
				'data-vtb-searchable' => true,
				'data-vtb-pagination' => true,
				'data-vtb-page-size'  => true,
				'data-vtb-csv'        => true,
				'data-vtb-hover'      => true,
				'data-vtb-first-col'  => true,
			)
		);

		foreach ( array( 'th', 'td' ) as $cell_tag ) {
			$allowed_html[ $cell_tag ] = array_merge(
				$allowed_html[ $cell_tag ],
				array(
					'colspan'        => true,
					'rowspan'        => true,
					'scope'          => true,
					'data-vtb-label' => true,
				)
			);
		}

		$allowed_html['input'] = array_merge(
			$allowed_html['input'],
			array(
				'type'        => true,
				'name'        => true,
				'value'       => true,
				'placeholder' => true,
				'readonly'    => true,
				'disabled'    => true,
			)
		);

		$allowed_html['button'] = array_merge(
			$allowed_html['button'],
			array(
				'type'     => true,
				'disabled' => true,
			)
		);

		return $allowed_html;
	}

	/**
	 * Normalize table data into a 2-D array of cell arrays.
	 *
	 * @param mixed $table_data Raw table data.
	 * @return array Normalized table data.
	 */
	private static function normalize_table_data( $table_data ) {
		if ( is_array( $table_data ) && isset( $table_data['rows'] ) && is_array( $table_data['rows'] ) ) {
			$table_data = $table_data['rows'];
		}

		if ( ! is_array( $table_data ) ) {
			return array();
		}

		$normalized = array();

		foreach ( $table_data as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}

			$normalized_row = array();

			foreach ( $row as $cell ) {
				$normalized_row[] = self::normalize_cell( $cell );
			}

			if ( ! empty( $normalized_row ) ) {
				$normalized[] = $normalized_row;
			}
		}

		return $normalized;
	}

	/**
	 * Normalize a single cell into the current data shape.
	 *
	 * @param mixed $cell Raw cell data.
	 * @return array Normalized cell.
	 */
	private static function normalize_cell( $cell ) {
		$default_styles = array(
			'backgroundColor' => '',
			'color'           => '',
			'fontSize'        => '',
			'fontWeight'      => 'normal',
			'fontStyle'       => 'normal',
			'textDecoration'  => 'none',
			'textAlign'       => 'left',
			'verticalAlign'   => 'middle',
			'paddingTop'      => '10',
			'paddingRight'    => '14',
			'paddingBottom'   => '10',
			'paddingLeft'     => '14',
		);

		if ( is_string( $cell ) || is_numeric( $cell ) ) {
			return array(
				'content' => (string) $cell,
				'colspan' => 1,
				'rowspan' => 1,
				'hidden'  => false,
				'styles'  => $default_styles,
				'meta'    => array(),
			);
		}

		if ( ! is_array( $cell ) ) {
			$cell = array();
		}

		$styles = isset( $cell['styles'] ) && is_array( $cell['styles'] ) ? $cell['styles'] : array();
		$meta   = isset( $cell['meta'] ) && is_array( $cell['meta'] ) ? $cell['meta'] : array();

		return array(
			'content' => isset( $cell['content'] ) ? $cell['content'] : '',
			'colspan' => max( 1, isset( $cell['colspan'] ) ? (int) $cell['colspan'] : ( isset( $cell['colSpan'] ) ? (int) $cell['colSpan'] : 1 ) ),
			'rowspan' => max( 1, isset( $cell['rowspan'] ) ? (int) $cell['rowspan'] : ( isset( $cell['rowSpan'] ) ? (int) $cell['rowSpan'] : 1 ) ),
			'hidden'  => ! empty( $cell['hidden'] ),
			'styles'  => wp_parse_args( $styles, $default_styles ),
			'meta'    => $meta,
		);
	}

	/**
	 * Render a single table row.
	 *
	 * @param array  $row           Array of cell data for this row.
	 * @param string $section       One of 'header', 'body', or 'footer'.
	 * @param array  $header_labels Plain-text header labels for data-vtb-label.
	 * @param array  $settings      Table settings.
	 * @return string Row HTML.
	 */
	private static function render_row( $row, $section, $header_labels, $settings ) {
		if ( ! is_array( $row ) ) {
			return '';
		}

		$output = '<tr>';

		foreach ( $row as $col_index => $cell ) {
			if ( ! is_array( $cell ) ) {
				continue;
			}

			// Skip hidden cells (covered by a merge).
			if ( ! empty( $cell['hidden'] ) ) {
				continue;
			}

			$is_header_cell      = ( 'header' === $section );
			$is_first_col_header = ( ! empty( $settings['firstColumnHeader'] ) && 0 === $col_index && 'header' !== $section );
			$use_th              = $is_header_cell || $is_first_col_header;

			$tag = $use_th ? 'th' : 'td';

			// Build attributes.
			$attrs = '';

			// Scope.
			if ( $is_header_cell ) {
				$attrs .= ' scope="col"';
			} elseif ( $is_first_col_header ) {
				$attrs .= ' scope="row"';
			}

			// Cell style.
			$cell_style = self::build_cell_style( $cell );
			if ( ! empty( $cell_style ) ) {
				$attrs .= ' style="' . esc_attr( $cell_style ) . '"';
			}

			// Colspan and rowspan (lowercase in JS data model).
			$colspan = isset( $cell['colspan'] ) ? (int) $cell['colspan'] : 1;
			$rowspan = isset( $cell['rowspan'] ) ? (int) $cell['rowspan'] : 1;

			if ( $colspan > 1 ) {
				$attrs .= ' colspan="' . esc_attr( $colspan ) . '"';
			}
			if ( $rowspan > 1 ) {
				$attrs .= ' rowspan="' . esc_attr( $rowspan ) . '"';
			}

			// data-vtb-label for body and footer cells (for responsive stacking).
			if ( 'header' !== $section && ! $is_first_col_header && ! empty( $header_labels ) ) {
				$label = isset( $header_labels[ $col_index ] ) ? $header_labels[ $col_index ] : '';
				if ( '' !== $label ) {
					$attrs .= ' data-vtb-label="' . esc_attr( $label ) . '"';
				}
			}

			// Cell content may contain RichText HTML; allow only safe post HTML.
			$content = isset( $cell['content'] ) ? $cell['content'] : '';

			$output .= '<' . $tag . $attrs . '>' . wp_kses_post( $content ) . '</' . $tag . '>';
		}

		$output .= '</tr>';

		return $output;
	}

	/**
	 * Build inline CSS style string for a cell.
	 *
	 * @param array $cell Cell data array.
	 * @return string CSS style string (without surrounding quotes).
	 */
	private static function build_cell_style( $cell ) {
		$parts = array();

		// Cell styles are nested under cell['styles'] in the JS data model.
		$s = isset( $cell['styles'] ) && is_array( $cell['styles'] ) ? $cell['styles'] : array();

		if ( ! empty( $s['backgroundColor'] ) ) {
			$background_color = self::sanitize_css_color( $s['backgroundColor'] );
			if ( '' !== $background_color ) {
				$parts[] = 'background-color:' . $background_color;
			}
		}

		if ( ! empty( $s['color'] ) ) {
			$text_color = self::sanitize_css_color( $s['color'] );
			if ( '' !== $text_color ) {
				$parts[] = 'color:' . $text_color;
			}
		}

		if ( ! empty( $s['fontSize'] ) ) {
			$parts[] = 'font-size:' . self::sanitize_int_range( $s['fontSize'], 8, 72, 14 ) . 'px';
		}

		if ( ! empty( $s['fontWeight'] ) && 'normal' !== $s['fontWeight'] ) {
			$font_weight = self::sanitize_choice(
				$s['fontWeight'],
				array( 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900' ),
				''
			);
			if ( '' !== $font_weight ) {
				$parts[] = 'font-weight:' . $font_weight;
			}
		}

		if ( ! empty( $s['fontStyle'] ) && 'normal' !== $s['fontStyle'] ) {
			$font_style = self::sanitize_choice( $s['fontStyle'], array( 'italic', 'oblique' ), '' );
			if ( '' !== $font_style ) {
				$parts[] = 'font-style:' . $font_style;
			}
		}

		if ( ! empty( $s['textDecoration'] ) && 'none' !== $s['textDecoration'] ) {
			$text_decoration = self::sanitize_choice( $s['textDecoration'], array( 'underline', 'line-through' ), '' );
			if ( '' !== $text_decoration ) {
				$parts[] = 'text-decoration:' . $text_decoration;
			}
		}

		if ( ! empty( $s['textAlign'] ) ) {
			$parts[] = 'text-align:' . self::sanitize_choice( $s['textAlign'], array( 'left', 'center', 'right', 'justify' ), 'left' );
		}

		if ( ! empty( $s['verticalAlign'] ) ) {
			$parts[] = 'vertical-align:' . self::sanitize_choice( $s['verticalAlign'], array( 'top', 'middle', 'bottom', 'baseline' ), 'middle' );
		}

		// Padding — defaults: top=10, right=14, bottom=10, left=14.
		$pt = self::sanitize_int_range( isset( $s['paddingTop'] ) ? $s['paddingTop'] : 10, 0, 80, 10 );
		$pr = self::sanitize_int_range( isset( $s['paddingRight'] ) ? $s['paddingRight'] : 14, 0, 80, 14 );
		$pb = self::sanitize_int_range( isset( $s['paddingBottom'] ) ? $s['paddingBottom'] : 10, 0, 80, 10 );
		$pl = self::sanitize_int_range( isset( $s['paddingLeft'] ) ? $s['paddingLeft'] : 14, 0, 80, 14 );

		$parts[] = 'padding:' . $pt . 'px ' . $pr . 'px ' . $pb . 'px ' . $pl . 'px';

		return implode( ';', $parts );
	}

	/**
	 * Sanitize a color value used in inline CSS.
	 *
	 * @param mixed  $value    Raw color value.
	 * @param string $fallback Fallback color.
	 * @return string Safe color value or fallback.
	 */
	private static function sanitize_css_color( $value, $fallback = '' ) {
		$value = is_string( $value ) ? trim( $value ) : '';

		if ( '' === $value ) {
			return $fallback;
		}

		$hex = sanitize_hex_color( $value );
		if ( $hex ) {
			return $hex;
		}

		return $fallback;
	}

	/**
	 * Sanitize table width.
	 *
	 * @param mixed $value Raw width value.
	 * @return string Safe width.
	 */
	private static function sanitize_table_width( $value ) {
		$value = is_string( $value ) ? strtolower( trim( $value ) ) : '';

		if ( 'auto' === $value ) {
			return 'auto';
		}

		if ( preg_match( '/\A(?:100|[1-9]?[0-9])%\z/', $value ) ) {
			return $value;
		}

		return '100%';
	}

	/**
	 * Sanitize a value against an allow-list.
	 *
	 * @param mixed  $value    Raw value.
	 * @param array  $allowed  Allowed values.
	 * @param string $fallback Fallback value.
	 * @return string Safe value.
	 */
	private static function sanitize_choice( $value, $allowed, $fallback ) {
		$value = is_scalar( $value ) ? strtolower( trim( (string) $value ) ) : '';

		return in_array( $value, $allowed, true ) ? $value : $fallback;
	}

	/**
	 * Sanitize an integer with minimum and maximum bounds.
	 *
	 * @param mixed $value    Raw value.
	 * @param int   $min      Minimum value.
	 * @param int   $max      Maximum value.
	 * @param int   $fallback Fallback value.
	 * @return int Safe integer.
	 */
	private static function sanitize_int_range( $value, $min, $max, $fallback ) {
		if ( ! is_numeric( $value ) ) {
			return $fallback;
		}

		return min( $max, max( $min, (int) $value ) );
	}
}
