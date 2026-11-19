#!/usr/bin/env bash
# Headless Firefox only starts an AudioContext when the machine has an audio server; a Linux box with no sound card
# has none, and every Play would hang on "Fading in". Start a silent PulseAudio null sink when nothing is running.
# Macs and desktops with sound already have one, so this does nothing there.
set -euo pipefail
[[ "$(uname)" == Linux ]] || exit 0
command -v pulseaudio >/dev/null || { echo "audio-sink: no audio server and no pulseaudio; install it (apt install pulseaudio) for the Firefox project" >&2; exit 1; }
pulseaudio --check 2>/dev/null && exit 0
pulseaudio -D --exit-idle-time=-1 -n --load="module-null-sink sink_name=ft_null" --load="module-native-protocol-unix"
pulseaudio --check
