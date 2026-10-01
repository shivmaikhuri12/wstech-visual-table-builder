<?php
/** Focused integration tests. Run only against a disposable local WordPress site. */
if ( '1' !== getenv( 'WSTB_TEST_DISPOSABLE' ) || ! getenv( 'WSTB_TEST_WP_LOAD' ) ) {
	fwrite( STDERR, "Set WSTB_TEST_DISPOSABLE=1 and WSTB_TEST_WP_LOAD to a disposable site's wp-load.php.\n" );
	exit( 2 );
}
require getenv( 'WSTB_TEST_WP_LOAD' );
if ( 'local' !== wp_get_environment_type() || ! function_exists( 'wstb_sync_block_to_meta' ) ) {
	fwrite( STDERR, "Requires local WordPress with this plugin active.\n" );
	exit( 2 );
}
wp_set_current_user( (int) getenv( 'WSTB_TEST_USER_ID' ) ?: 1 );
if ( ! current_user_can( 'manage_options' ) ) {
	fwrite( STDERR, "Requires a test administrator.\n" );
	exit( 2 );
}
$failures = 0;
$checks = 0;
function b1_check( $condition, $label ) {
	global $failures, $checks;
	++$checks;
	if ( ! $condition ) {
		++$failures;
		fwrite( STDERR, "FAIL: $label\n" );
	}
}
function b1_cell( $value ) {
	return array( 'content' => $value, 'colspan' => 1, 'rowspan' => 1, 'hidden' => false, 'styles' => array(), 'meta' => array() );
}
function b1_content( $attrs ) {
	return serialize_block( array( 'blockName' => 'vtb/table-builder', 'attrs' => $attrs, 'innerBlocks' => array(), 'innerHTML' => '', 'innerContent' => array() ) );
}
function b1_meta( $id ) {
	return json_decode( get_post_meta( $id, '_wstech_table_data', true ), true );
}
function b1_text( $html ) {
	return html_entity_decode( wp_strip_all_tags( $html ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
}
$values = array( 'C:\\Users\\John\\Documents', '"Premium Plan"', 'He said "Hello"', 'C:\\folder\\"quoted"\\file', '{"name":"WSTech","path":"C:\\\\folder"}', "John's café — नमस्ते 日本語" );
$rows = array( array( b1_cell( 'Value' ) ) );
foreach ( $values as $value ) {
	$rows[] = array( b1_cell( $value ) );
}
$attrs = array( 'tableData' => $rows );
$type = WP_Block_Type_Registry::get_instance()->get_registered( 'vtb/table-builder' );
$id = wp_insert_post( wp_slash( array( 'post_type' => 'wstech_table', 'post_status' => 'publish', 'post_title' => 'B1 disposable regression', 'post_content' => b1_content( $attrs ) ) ) );
b1_check( $id > 0, 'create reusable table' );

// Exercise the real admin duplication handler in a separate invocation: it exits after redirect.
if ( 'duplicate' === ( $argv[1] ?? '' ) ) {
	$_GET['post'] = $id;
	$_GET['_wpnonce'] = wp_create_nonce( 'wstb_duplicate_' . $id );
	add_filter( 'wp_redirect', function ( $url ) use ( $id, $rows ) {
		parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $query );
		$copy = (int) ( $query['post'] ?? 0 );
		b1_check( $copy > 0 && $copy !== $id, 'duplicate created' );
		b1_check( get_post( $copy )->post_content === get_post( $id )->post_content, 'duplicate raw block content' );
		b1_check( ( b1_meta( $copy )['tableData'] ?? null ) === $rows, 'duplicate structured data' );
		b1_check( count( get_post_meta( $copy, '_wstech_table_data' ) ) === 1, 'one structured metadata value after duplication' );
		wstb_sync_block_to_meta( $copy );
		b1_check( ( b1_meta( $copy )['tableData'] ?? null ) === $rows, 'duplicate resave' );
		return false;
	} );
	register_shutdown_function( function () {
		global $checks, $failures;
		echo "Duplicate: $checks checks, $failures failures\n";
		if ( $failures ) { exit( 1 ); }
	} );
	wstb_duplicate_table();
}

foreach ( array( 'absent' => null, 'false' => false, 'true' => true ) as $label => $header ) {
	$case = $attrs;
	if ( null !== $header ) { $case['hasHeaderRow'] = $header; }
	$expected_header = $type->prepare_attributes_for_render( $case )['hasHeaderRow'];
	for ( $cycle = 1; $cycle <= 2; ++$cycle ) {
		wp_update_post( wp_slash( array( 'ID' => $id, 'post_content' => b1_content( $case ) ) ) );
		$reloaded = wstb_find_block( parse_blocks( get_post( $id )->post_content ), 'vtb/table-builder' );
		b1_check( $reloaded['attrs']['tableData'] === $rows, "$label/$cycle editor block content" );
		$data = b1_meta( $id );
		b1_check( ( $data['settings']['hasHeaderRow'] ?? null ) === $expected_header, "$label/$cycle header default parity" );
		b1_check( ( $data['tableData'] ?? null ) === $rows, "$label/$cycle structured round trip" );
		$html = do_shortcode( '[wstech_table id="' . $id . '"]' );
		b1_check( ( false !== strpos( $html, '<thead>' ) ) === $expected_header, "$label/$cycle shortcode header" );
		b1_check( ( false !== strpos( render_block( $reloaded ), '<thead>' ) ) === $expected_header, "$label/$cycle inline header" );
		foreach ( $values as $index => $value ) {
			b1_check( false !== strpos( b1_text( $html ), $value ), "$label/$cycle rendered value $index" );
		}
		$case = $reloaded['attrs'];
	}
}

// Restore content through WordPress's real revision implementation.
$original = get_post( $id )->post_content;
$revision = _wp_put_post_revision( $id );
wp_update_post( wp_slash( array( 'ID' => $id, 'post_content' => b1_content( array( 'tableData' => array( array( b1_cell( 'Changed' ) ) ) ) ) ) ) );
b1_check( wp_restore_post_revision( $revision ) === $id, 'revision restored' );
b1_check( get_post( $id )->post_content === $original, 'revision block content' );
b1_check( ( b1_meta( $id )['tableData'] ?? null ) === $rows, 'revision structured content' );

// Representative pre-existing 2.1.0 structured data; reading must not migrate it.
$legacy = '{"version":1,"tableData":[[{"content":"Legacy header","colspan":1,"rowspan":1,"hidden":false,"styles":{},"meta":{}}],[{"content":"Legacy value","colspan":1,"rowspan":1,"hidden":false,"styles":{},"meta":{}}]],"settings":{"hasHeaderRow":false},"styles":{"theme":"default"},"mergedCells":[],"metadata":[]}';
update_post_meta( $id, '_wstech_table_data', wp_slash( $legacy ) );
$legacy_html = do_shortcode( '[wstech_table id="' . $id . '"]' );
b1_check( false !== strpos( $legacy_html, 'Legacy value' ) && false === strpos( $legacy_html, '<thead>' ), '2.1.0 existing data renders with explicit false' );
b1_check( get_post_meta( $id, '_wstech_table_data', true ) === $legacy, 'reading existing metadata does not migrate it' );
echo "WordPress $wp_version: $checks checks, $failures failures\n";
exit( $failures ? 1 : 0 );
