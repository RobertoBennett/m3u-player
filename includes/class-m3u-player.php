<?php
class M3U_Player {
    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }

    public function enqueue_scripts() {
        // Enqueue HLS.js for M3U8 support
        wp_enqueue_script(
            'm3u-player-hls',
            '/wp-content/plugins/m3u-player/assets/js/hls.js',
            array(),
            '1.0.0',
            true
        );

        // Enqueue our custom player script
        wp_enqueue_script(
            'm3u-player-script',
            plugin_dir_url(dirname(__FILE__)) . 'assets/js/player.js',
            array('jquery', 'm3u-player-hls'),
            '1.0.0',
            true
        );

        // Enqueue player styles
        wp_enqueue_style(
            'm3u-player-style',
            plugin_dir_url(dirname(__FILE__)) . 'assets/css/player.css',
            array(),
            '1.0.0'
        );
    }
}