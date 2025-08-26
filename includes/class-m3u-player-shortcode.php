<?php
class M3U_Player_Shortcode {
    public function __construct() {
        add_shortcode('m3u_player', array($this, 'render_shortcode'));
    }

    public function render_shortcode($atts) {
        $atts = shortcode_atts(array(
            'url' => '',
            'width' => '100%',
            'height' => '400px',
            'autoplay' => 'false',
            'controls' => 'true',
            'show_playlist' => 'true'
        ), $atts);

        $player_id = 'm3u-player-' . uniqid();

        $output = sprintf(
            '<div class="m3u-player-container" style="width: %s;">
                <video id="%s" 
                    class="m3u-player" 
                    style="width: 100%%; height: %s;"
                    %s
                    %s>
                </video>
                %s
            </div>',
            esc_attr($atts['width']),
            esc_attr($player_id),
            esc_attr($atts['height']),
            $atts['controls'] === 'true' ? 'controls' : '',
            $atts['autoplay'] === 'true' ? 'autoplay' : '',
            $atts['show_playlist'] === 'true' ? sprintf('<div id="%s-playlist" class="m3u-playlist"></div>', esc_attr($player_id)) : ''
        );

        // Add initialization script
        $output .= sprintf(
            '<script>
                document.addEventListener("DOMContentLoaded", function() {
                    initM3UPlayer("%s", "%s");
                });
            </script>',
            esc_js($player_id),
            esc_js($atts['url'])
        );

        return $output;
    }
}