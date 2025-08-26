<?php
/**
 * Plugin Name: M3U Player
 * Description: Video player for M3U/M3U8 playlists with shortcode support
 * Plugin URI: https://yoursite.com/
 * Version: 1.25.0
 * Author: Robbert Bennett
 * Text Domain: M3U Player
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once plugin_dir_path(__FILE__) . 'includes/class-m3u-player.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-m3u-player-shortcode.php';

// Initialize the plugin
function m3u_player_init() {
    new M3U_Player();
    new M3U_Player_Shortcode();
}
add_action('plugins_loaded', 'm3u_player_init');