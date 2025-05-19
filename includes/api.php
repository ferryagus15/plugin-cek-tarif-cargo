<?php
// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Fungsi untuk membuat tabel database
function tarif_cargo_create_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'tarif_cargo';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        kotaAwal varchar(100) NOT NULL,
        kotaTujuan varchar(100) NOT NULL,
        layanan varchar(20) NOT NULL,
        biaya bigint(20) NOT NULL,
        estimasi varchar(20) NOT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY unique_route (kotaAwal, kotaTujuan, layanan)
    ) $charset_collate;";

    require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
    dbDelta( $sql );
}

// API handler untuk CRUD data tarif cargo
add_action( 'wp_ajax_get_tarif_cargo', 'tarif_cargo_get_data' );
add_action( 'wp_ajax_nopriv_get_tarif_cargo', 'tarif_cargo_get_data' );

add_action( 'wp_ajax_add_tarif_cargo', 'tarif_cargo_add_data' );

add_action( 'wp_ajax_edit_tarif_cargo', 'tarif_cargo_edit_data' );

add_action( 'wp_ajax_delete_tarif_cargo', 'tarif_cargo_delete_data' );

function tarif_cargo_get_data() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'tarif_cargo';

    $results = $wpdb->get_results( "SELECT * FROM $table_name", ARRAY_A );
    wp_send_json_success( $results );
}

function tarif_cargo_add_data() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'tarif_cargo';

    $kotaAwal = sanitize_text_field( $_POST['kotaAwal'] ?? '' );
    $kotaTujuan = sanitize_text_field( $_POST['kotaTujuan'] ?? '' );
    $layanan = sanitize_text_field( $_POST['layanan'] ?? '' );
    $biaya = intval( $_POST['biaya'] ?? 0 );
    $estimasi = sanitize_text_field( $_POST['estimasi'] ?? '' );

    if ( empty($kotaAwal) || empty($kotaTujuan) || empty($layanan) || $biaya <= 0 || empty($estimasi) ) {
        wp_send_json_error( 'Data tidak lengkap atau tidak valid.' );
    }

    // Cek duplikat
    $exists = $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM $table_name WHERE kotaAwal = %s AND kotaTujuan = %s AND layanan = %s",
        $kotaAwal, $kotaTujuan, $layanan
    ) );

    if ( $exists > 0 ) {
        wp_send_json_error( 'Data dengan kombinasi Kota Awal, Kota Tujuan, dan Layanan sudah ada.' );
    }

    $inserted = $wpdb->insert(
        $table_name,
        [
            'kotaAwal' => $kotaAwal,
            'kotaTujuan' => $kotaTujuan,
            'layanan' => $layanan,
            'biaya' => $biaya,
            'estimasi' => $estimasi,
        ],
        [ '%s', '%s', '%s', '%d', '%s' ]
    );

    if ( $inserted ) {
        wp_send_json_success( 'Data berhasil ditambahkan.' );
    } else {
        wp_send_json_error( 'Gagal menambahkan data.' );
    }
}

function tarif_cargo_edit_data() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'tarif_cargo';

    $id = intval( $_POST['id'] ?? 0 );
    $kotaAwal = sanitize_text_field( $_POST['kotaAwal'] ?? '' );
    $kotaTujuan = sanitize_text_field( $_POST['kotaTujuan'] ?? '' );
    $layanan = sanitize_text_field( $_POST['layanan'] ?? '' );
    $biaya = intval( $_POST['biaya'] ?? 0 );
    $estimasi = sanitize_text_field( $_POST['estimasi'] ?? '' );

    if ( $id <= 0 || empty($kotaAwal) || empty($kotaTujuan) || empty($layanan) || $biaya <= 0 || empty($estimasi) ) {
        wp_send_json_error( 'Data tidak lengkap atau tidak valid.' );
    }

    // Cek duplikat kecuali id ini
    $exists = $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM $table_name WHERE kotaAwal = %s AND kotaTujuan = %s AND layanan = %s AND id != %d",
        $kotaAwal, $kotaTujuan, $layanan, $id
    ) );

    if ( $exists > 0 ) {
        wp_send_json_error( 'Data dengan kombinasi Kota Awal, Kota Tujuan, dan Layanan sudah ada.' );
    }

    $updated = $wpdb->update(
        $table_name,
        [
            'kotaAwal' => $kotaAwal,
            'kotaTujuan' => $kotaTujuan,
            'layanan' => $layanan,
            'biaya' => $biaya,
            'estimasi' => $estimasi,
        ],
        [ 'id' => $id ],
        [ '%s', '%s', '%s', '%d', '%s' ],
        [ '%d' ]
    );

    if ( $updated !== false ) {
        wp_send_json_success( 'Data berhasil diperbarui.' );
    } else {
        wp_send_json_error( 'Gagal memperbarui data.' );
    }
}

function tarif_cargo_delete_data() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'tarif_cargo';

    $id = intval( $_POST['id'] ?? 0 );
    if ( $id <= 0 ) {
        wp_send_json_error( 'ID data tidak valid.' );
    }

    $deleted = $wpdb->delete( $table_name, [ 'id' => $id ], [ '%d' ] );

    if ( $deleted ) {
        wp_send_json_success( 'Data berhasil dihapus.' );
    } else {
        wp_send_json_error( 'Gagal menghapus data.' );
    }
}
?>
