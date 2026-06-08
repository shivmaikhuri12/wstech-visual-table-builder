<?php
/**
 * Uninstall cleanup for WSTech Visual Table Builder.
 *
 * @package WSTech_Table_Builder
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

$wstb_posts = get_posts(
	array(
		'post_type'      => 'wstech_table',
		'post_status'    => 'any',
		'posts_per_page' => -1,
		'fields'         => 'ids',
		'no_found_rows'  => true,
	)
);

foreach ( $wstb_posts as $wstb_post_id ) {
	wp_delete_post( (int) $wstb_post_id, true );
}
