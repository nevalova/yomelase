function reproducirSpotify(spotifyId, force = false) {
    if (!spotifyId) return;
    if (force) audioGestureReady = true;
    pendingSpotifyTrack = spotifyId;
    if (!embedController) {
        setSpotifyMsg(t('audio.loadingSpotify'));
        return;
    }
    try {
        const mismaCancion = currentSpotifyTrack === spotifyId;
        if (!force && mismaCancion) return;

        if (!mismaCancion) {
            embedController.loadUri(`spotify:track:${spotifyId}`);
            currentSpotifyTrack = spotifyId;
            setSpotifyMsg(t('audio.loadingSong'));
        } else {
            setSpotifyMsg(t('audio.playing'));
        }

        if (!force) return;

        setTimeout(() => {
            try { embedController.play(); } catch (_) {}
        }, 250);
        setTimeout(() => {
            try { embedController.play(); } catch (_) {}
        }, 1100);
    } catch (_) {
        currentSpotifyTrack = '';
        setSpotifyMsg(t('audio.error'));
    }
}

function activarSpotify(){
    const spotifyId = pendingSpotifyTrack || estadoCache.cancion_actual?.spotifyId || '4uLU6hMCxmIqC3pqr0nu9I';
    audioGestureReady = true;
    reproducirSpotify(spotifyId, true);
}

function escucharCancionActual(){
    const spotifyId = estadoCache.cancion_actual?.spotifyId || pendingSpotifyTrack;
    if (!spotifyId) return setSpotifyMsg(t('audio.noActiveSong'));
    audioGestureReady = true;
    reproducirSpotify(spotifyId, true);
}

window.onSpotifyIframeApiReady = (IFrameAPI) => {
    IFrameAPI.createController(document.getElementById('embed-iframe'), { uri: 'spotify:track:4uLU6hMCxmIqC3pqr0nu9I' }, (controller) => {
        embedController = controller;
        setSpotifyMsg(t('audio.ready'));
        if (pendingSpotifyTrack) reproducirSpotify(pendingSpotifyTrack, false);
    });
};
