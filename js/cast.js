const TV_ROOM_STORAGE_KEY = 'ymls_tv_room_v1';
let activeTvListenerRef = null;
let tvSpotifyController = null;
let tvPendingSpotifyTrack = '';
let tvCurrentSpotifyTrack = '';
let tvAudioGestureReady = false;

function tvCurrentPhase() {
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    if (estadoSala === FASES.LOBBY || estadoSala === FASES.LISTA) return estadoSala;
    return estadoCache.fase || FASES.LOBBY;
}

function tvVisualState() {
    const fase = tvCurrentPhase();
    if (fase === FASES.FINAL) return 'final';
    if (fase === FASES.REVELANDO || fase === FASES.RESULTADO) return 'reveal';
    if (fase === FASES.ESPERA_ROBO) return 'steal';
    if (fase === FASES.JUGANDO) return 'turn';
    if (fase === FASES.LISTA) return 'ready';
    return 'lobby';
}

function tvModeLabel(modo) {
    return modo === MODOS.DIFICIL ? t('tv.difficultyHard') : t('tv.difficultyEasy');
}

function tvSetSetupError(msg) {
    const el = document.getElementById('tv-setup-error');
    if (el) el.innerText = msg || '';
}

function tvSetAudioStatus(msg) {
    const el = document.getElementById('tv-audio-status');
    if (el) el.innerText = msg || '';
}

function tvSyncAudioUi() {
    const btn = document.getElementById('tv-audio-btn');
    const stage = document.getElementById('tv-audio-stage');
    if (btn) {
        btn.classList.toggle('active', tvAudioGestureReady);
        btn.innerText = tvAudioGestureReady ? t('tv.audioReady') : t('tv.audioActivate');
    }
    if (stage) stage.classList.toggle('active', tvAudioGestureReady);
}

function tvShowSetup() {
    document.getElementById('tv-setup').classList.remove('hidden');
    document.getElementById('tv-app').classList.add('hidden');
}

function tvShowApp() {
    document.getElementById('tv-setup').classList.add('hidden');
    document.getElementById('tv-app').classList.remove('hidden');
    tvSyncAudioUi();
}

function tvRememberRoom(roomCode) {
    if (roomCode) localStorage.setItem(TV_ROOM_STORAGE_KEY, roomCode);
}

function tvRememberedRoom() {
    return localStorage.getItem(TV_ROOM_STORAGE_KEY) || '';
}

function tvTextoI18n(info) {
    if (!info?.key) return '';
    const params = { ...(info.params || {}) };
    if (params.resultKey) params.result = t(params.resultKey, params.resultParams || {});
    return t(info.key, params);
}

function tvResumenEstado(estado, campo) {
    return tvTextoI18n(estado?.[`${campo}_i18n`]) || estado?.[campo] || '';
}

function tvPhaseName(fase) {
    return i18nValue(`phase.${fase || FASES.LOBBY}`, fase || FASES.LOBBY);
}

function tvSlotLabel(slot) {
    if (!slot) return '';
    if (slot.left == null && slot.right == null) return t('slot.firstCardLabel');
    if (slot.left == null) return t('slot.beforeLabel', { right: slot.right });
    if (slot.right == null) return t('slot.afterLabel', { left: slot.left });
    return t('slot.betweenLabel', { left: slot.left, right: slot.right });
}

function tvSelectionLabel(seleccion) {
    if (!seleccion) return '';
    if (seleccion.canjeado) return t('summary.exchangedSelection');
    return tvSlotLabel(seleccion.slot) || seleccion.label || '';
}

function tvCatalogoCanciones() {
    try {
        if (typeof CANCIONES !== 'undefined' && Array.isArray(CANCIONES)) return CANCIONES;
    } catch (_) {}
    return [];
}

function tvCancionCatalogo(carta) {
    const canciones = tvCatalogoCanciones();
    if (!canciones.length) return null;

    const idx = Number(estadoCache.cancion_idx);
    if (Number.isInteger(idx) && canciones[idx]) return normalizarCarta(canciones[idx]);

    if (carta?.spotifyId) {
        const porSpotify = canciones.find((item) => normalizarCarta(item)?.spotifyId === carta.spotifyId);
        if (porSpotify) return normalizarCarta(porSpotify);
    }

    const titulo = (carta?.t || '').toLowerCase();
    const artista = (carta?.a || '').toLowerCase();
    if (titulo && artista) {
        const porTexto = canciones.find((item) => {
            const normalizada = normalizarCarta(item);
            return normalizada?.t?.toLowerCase() === titulo && normalizada?.a?.toLowerCase() === artista;
        });
        if (porTexto) return normalizarCarta(porTexto);
    }

    return null;
}

function tvCancionActual() {
    const actual = normalizarCarta(estadoCache.cancion_actual);
    const catalogo = tvCancionCatalogo(actual);
    if (!actual && !catalogo) return null;
    return {
        ...(catalogo || {}),
        ...(actual || {}),
        coverUrl: actual?.coverUrl || catalogo?.coverUrl || ''
    };
}

function tvTurnEntity() {
    return entidadPorTurno(estadoCache, jugadoresCache, equiposCache())
        || (estadoCache.turno_de ? entidadDeJugador(estadoCache.turno_de, jugadoresCache, equiposCache()) : null);
}

function tvTurnLine(turnEntity) {
    if (!turnEntity) return '';
    if (turnEntity.type === 'team') {
        return t('tv.turnTeam', {
            team: turnEntity.name,
            player: estadoCache.nombre_turno || turnEntity.members?.[0]?.[1]?.nombre || t('cards.player')
        });
    }
    return t('tv.turnSolo', { player: estadoCache.nombre_turno || turnEntity.name || t('cards.player') });
}

function tvConnectUrlState(roomCode) {
    const url = new URL(window.location.href);
    url.searchParams.set('sala', roomCode);
    window.history.replaceState({}, '', url.toString());
}

function tvDisconnectListener() {
    if (activeTvListenerRef) activeTvListenerRef.off('value');
    activeTvListenerRef = null;
}

function tvResetState() {
    jugadoresCache = {};
    estadoCache = estadoJuegoBase(FASES.LOBBY);
    salaMetaCache = {};
}

function tvHandleMissingRoom() {
    tvDisconnectListener();
    tvResetState();
    localStorage.removeItem(TV_ROOM_STORAGE_KEY);
    tvShowSetup();
    tvSetSetupError(t('tv.roomNotFound'));
}

function tvRenderMeta() {
    const fase = tvCurrentPhase();
    const modo = salaMetaCache.modo_dificultad || MODOS.FACIL;
    document.getElementById('tv-room-pill').innerText = t('tv.roomCode', { room: salaA });
    document.getElementById('tv-phase-pill').innerText = tvPhaseName(fase);
    document.getElementById('tv-mode-pill').innerText = tvModeLabel(modo);
    document.getElementById('tv-players-pill').innerText = t('tv.players', { count: totalJugadores() });
}

function tvRenderMembers(turnEntity) {
    const panel = document.getElementById('tv-members-panel');
    const list = document.getElementById('tv-members-list');
    if (!turnEntity || turnEntity.type !== 'team' || !turnEntity.members?.length) {
        panel.classList.add('hidden');
        list.innerHTML = '';
        return;
    }

    list.innerHTML = '';
    turnEntity.members.forEach(([playerId, player]) => {
        const chip = document.createElement('div');
        chip.className = 'tv-member-chip';
        chip.style.setProperty('--team-rgb', turnEntity.colorRgb || '68, 244, 255');
        if (playerId === estadoCache.turno_de) chip.classList.add('active');
        chip.textContent = player?.nombre || t('cards.player');
        list.appendChild(chip);
    });
    panel.classList.remove('hidden');
}

function tvRenderStage() {
    const fase = tvCurrentPhase();
    const stageKicker = document.getElementById('tv-stage-kicker');
    const stageTitle = document.getElementById('tv-stage-title');
    const stageSubtitle = document.getElementById('tv-stage-subtitle');
    const selectionChip = document.getElementById('tv-selection-chip');
    const turnEntity = tvTurnEntity();
    const selectionText = tvSelectionLabel(estadoCache.seleccion_turno);

    selectionChip.classList.add('hidden');
    selectionChip.innerText = '';

    if (fase === FASES.LOBBY) {
        stageKicker.innerText = t('tv.roomCode', { room: salaA });
        stageTitle.innerText = t('tv.lobbyTitle');
        stageSubtitle.innerText = t('tv.lobbyNote');
        tvRenderMembers(null);
        return;
    }

    if (fase === FASES.LISTA) {
        stageKicker.innerText = t('tv.roomCode', { room: salaA });
        stageTitle.innerText = t('tv.readyTitle');
        stageSubtitle.innerText = t('tv.readyNote');
        tvRenderMembers(null);
        return;
    }

    if (fase === FASES.FINAL) {
        stageKicker.innerText = t('tv.finalTitle');
        stageTitle.innerText = estadoCache.ganador ? textoGanador(estadoCache.ganador) : t('tv.finalTitle');
        stageSubtitle.innerText = tvResumenEstado(estadoCache, 'resumen_resultado') || t('tv.resultNote');
        if (estadoCache.ganador) lanzarConfetiGanador(estadoCache.ganador, `${estadoCache.ronda_id || ''}:${estadoCache.ganador}`, 'tv');
    } else {
        stageKicker.innerText = t('tv.turnTitle');
        stageTitle.innerText = tvTurnLine(turnEntity) || t('tv.waitingRoom');
        if (fase === FASES.ESPERA_ROBO) {
            stageSubtitle.innerText = estadoCache.seleccion_turno
                ? t('tv.stealNote')
                : t('tv.playingNote');
        } else if (fase === FASES.REVELANDO || fase === FASES.RESULTADO) {
            stageSubtitle.innerText = tvResumenEstado(estadoCache, 'resumen_resultado') || t('tv.resultNote');
        } else {
            stageSubtitle.innerText = t('tv.playingNote');
        }
    }

    if (selectionText) {
        selectionChip.innerText = t('tv.selectionLabel', { label: selectionText });
        selectionChip.classList.remove('hidden');
    }
    tvRenderMembers(turnEntity);
}

function tvRenderReveal() {
    const fase = tvCurrentPhase();
    const kicker = document.getElementById('tv-reveal-kicker');
    const empty = document.getElementById('tv-reveal-empty');
    const content = document.getElementById('tv-reveal-content');
    const card = document.querySelector('.tv-reveal-card');
    const cancion = tvCancionActual();
    const revealed = !!(estadoCache.revelar || fase === FASES.REVELANDO || fase === FASES.RESULTADO || fase === FASES.FINAL);
    const summary = [tvResumenEstado(estadoCache, 'resumen_resultado'), tvResumenEstado(estadoCache, 'resumen_votos')]
        .filter(Boolean)
        .join(' | ');

    kicker.innerText = fase === FASES.FINAL ? t('tv.finalTitle') : t('tv.revealTitle');
    if (card) card.style.setProperty('--decade-rgb', cancion?.y ? colorDecada(cancion.y) : '68, 244, 255');

    if (!revealed || !cancion) {
        empty.innerText = fase === FASES.JUGANDO || fase === FASES.ESPERA_ROBO
            ? t('tv.revealWaiting')
            : t('tv.revealPending');
        empty.classList.remove('hidden');
        content.classList.add('hidden');
        content.dataset.revealKey = '';
        return;
    }

    const revealKey = `${estadoCache.ronda_id || ''}:${cancion.spotifyId || cancion.y || ''}`;
    const cover = document.getElementById('tv-reveal-cover');
    const flip = document.getElementById('tv-reveal-flip');
    const coverUrl = coverUrlCarta(cancion);
    if (cover) {
        if (cover.src !== coverUrl) cover.src = coverUrl;
        cover.loading = 'eager';
        cover.fetchPriority = 'high';
        cover.decoding = 'async';
    }
    if (content.dataset.revealKey !== revealKey) {
        content.dataset.revealKey = revealKey;
        if (coverUrl) {
            const preload = new Image();
            preload.src = coverUrl;
        }
        if (flip) {
            flip.style.animation = 'none';
            void flip.offsetHeight;
            flip.style.animation = '';
        }
    }

    document.getElementById('tv-reveal-year').innerText = String(cancion.y || '');
    document.getElementById('tv-reveal-year').style.setProperty('--decade-rgb', colorDecada(cancion.y));
    document.getElementById('tv-reveal-decade').innerText = textoDecadaCorta(cancion.y);
    document.getElementById('tv-reveal-title').innerText = cancion.t || t('cards.song');
    document.getElementById('tv-reveal-artist').innerText = cancion.a || t('cards.artist');
    document.getElementById('tv-reveal-summary').innerText = summary;
    empty.classList.add('hidden');
    content.classList.remove('hidden');
}

function tvTimelineCard(item) {
    const carta = normalizarCarta(item);
    const card = document.createElement('div');
    card.className = 'tv-timeline-item';
    if (!carta) return card;
    if (carta.base) card.classList.add('base');
    card.style.setProperty('--decade-rgb', colorDecada(carta.y));

    const badge = document.createElement('div');
    badge.className = 'tv-timeline-badge';
    badge.innerText = carta.base ? t('cards.base') : textoDecadaCorta(carta.y);

    const year = document.createElement('div');
    year.className = 'tv-timeline-year';
    year.innerText = String(carta.y);

    if (carta.base) {
        card.appendChild(badge);
        card.appendChild(year);
        return card;
    }

    card.classList.add('has-cover');

    const title = document.createElement('div');
    title.className = 'tv-timeline-title';
    title.innerText = carta.t || t('cards.previous');

    const artist = document.createElement('div');
    artist.className = 'tv-timeline-artist';
    artist.innerText = carta.a || t('cards.noData');

    const flip = document.createElement('div');
    flip.className = 'tv-timeline-card-flip';

    const front = document.createElement('div');
    front.className = 'tv-timeline-card-face tv-timeline-card-front';
    front.appendChild(badge);
    front.appendChild(year);
    front.appendChild(title);
    front.appendChild(artist);

    const back = document.createElement('div');
    back.className = 'tv-timeline-card-face tv-timeline-card-back';
    back.style.setProperty('--decade-rgb', colorDecada(carta.y));

    const cover = document.createElement('img');
    cover.className = 'tv-timeline-card-cover';
    cover.src = coverUrlCarta(carta);
    cover.alt = '';
    cover.loading = 'eager';
    cover.fetchPriority = 'high';
    cover.decoding = 'async';
    back.appendChild(cover);

    flip.appendChild(front);
    flip.appendChild(back);
    card.appendChild(flip);
    return card;
}

function tvRenderTimeline() {
    const turnEntity = tvTurnEntity();
    const list = document.getElementById('tv-timeline-list');
    list.innerHTML = '';

    if (!turnEntity) {
        const empty = document.createElement('div');
        empty.className = 'tv-empty-line';
        empty.innerText = t('tv.noTimeline');
        list.appendChild(empty);
        return;
    }

    const items = lineaReferenciaEntidad(turnEntity.data || {});
    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'tv-empty-line';
        empty.innerText = t('tv.noTimeline');
        list.appendChild(empty);
        return;
    }

    items.forEach((item) => list.appendChild(tvTimelineCard(item)));
}

function tvEntitySubtitle(entity) {
    if (!entity) return '';
    if (entity.type === 'team') return entity.members.map(([, player]) => player?.nombre || t('cards.player')).join(' / ');
    return t('game.soloPlayer');
}

function tvRenderScore() {
    const list = document.getElementById('tv-score-list');
    const current = tvTurnEntity();
    const entities = entidadesActivasLista(jugadoresCache, equiposCache())
        .map((entity) => ({
            entity,
            cartas: cartasEntidad(entity.data).length,
            monedas: Number(entity.data?.tokens) || 0
        }))
        .sort((a, b) => (b.cartas - a.cartas) || (b.monedas - a.monedas) || a.entity.name.localeCompare(b.entity.name));

    list.innerHTML = '';
    if (!entities.length) {
        const empty = document.createElement('div');
        empty.className = 'tv-empty-line';
        empty.innerText = t('tv.emptyScore');
        list.appendChild(empty);
        return;
    }
    entities.forEach(({ entity, cartas, monedas }, index) => {
        const row = document.createElement('div');
        row.className = 'tv-score-row';
        row.style.setProperty('--team-rgb', entity.colorRgb || '255, 215, 0');
        row.style.setProperty('--progress', `${Math.min(100, Math.max(0, (cartas / OBJETIVO_CARTAS) * 100))}%`);
        if (current && current.key === entity.key) row.classList.add('active');
        if (index === 0) row.classList.add('leader');

        const rank = document.createElement('div');
        rank.className = 'tv-score-rank';
        rank.innerText = String(index + 1);

        const main = document.createElement('div');
        main.className = 'tv-score-main';

        const name = document.createElement('div');
        name.className = 'tv-score-name';
        name.innerText = entity.name;

        const sub = document.createElement('div');
        sub.className = 'tv-score-sub';
        sub.innerText = tvEntitySubtitle(entity);

        const progress = document.createElement('div');
        progress.className = 'tv-score-progress';
        progress.appendChild(document.createElement('span'));

        main.appendChild(name);
        main.appendChild(sub);
        main.appendChild(progress);

        const stats = document.createElement('div');
        stats.className = 'tv-score-stats';

        const cards = document.createElement('div');
        cards.className = 'tv-score-cards';
        cards.innerText = t('tv.cards', { cards: cartas });

        const coins = document.createElement('div');
        coins.className = 'tv-score-coins';
        coins.innerText = totalEntidadesActivas(jugadoresCache, equiposCache()) <= 1
            ? t('tv.soloStat', { cards: cartas })
            : t('tv.coins', { coins: monedas });

        stats.appendChild(cards);
        stats.appendChild(coins);
        row.appendChild(rank);
        row.appendChild(main);
        row.appendChild(stats);
        list.appendChild(row);
    });
}

function tvRenderAll() {
    document.body.dataset.tvState = tvVisualState();
    tvRenderMeta();
    tvRenderStage();
    tvRenderReveal();
    tvRenderTimeline();
    tvRenderScore();
    tvSyncAudioFromState();
}

function tvPlaySpotify(spotifyId, forcePlay = false) {
    if (!spotifyId) {
        tvSetAudioStatus(t('tv.audioNoSong'));
        return;
    }

    tvPendingSpotifyTrack = spotifyId;
    if (!tvSpotifyController) {
        tvSetAudioStatus(t('tv.audioLoading'));
        return;
    }

    try {
        const sameTrack = tvCurrentSpotifyTrack === spotifyId;
        if (!sameTrack) {
            tvSpotifyController.loadUri(`spotify:track:${spotifyId}`);
            tvCurrentSpotifyTrack = spotifyId;
            tvSetAudioStatus(t('tv.audioLoading'));
        }

        if (!forcePlay) return;

        setTimeout(() => {
            try { tvSpotifyController.play(); } catch (_) {}
        }, 250);
        setTimeout(() => {
            try { tvSpotifyController.play(); } catch (_) {}
        }, 1100);
        tvSetAudioStatus(t('tv.audioPlaying'));
    } catch (_) {
        tvCurrentSpotifyTrack = '';
        tvSetAudioStatus(t('tv.audioError'));
    }
}

function tvSyncAudioFromState() {
    tvSyncAudioUi();
    const spotifyId = estadoCache.cancion_actual?.spotifyId || '';
    const inGame = (salaMetaCache.estado_sala || FASES.LOBBY) === ESTADO_EN_PARTIDA;
    if (!inGame || !spotifyId) {
        tvSetAudioStatus(tvAudioGestureReady ? t('tv.audioReady') : t('tv.audioNeedsTap'));
        return;
    }

    if (!tvAudioGestureReady) {
        tvPendingSpotifyTrack = spotifyId;
        tvSetAudioStatus(t('tv.audioNeedsTap'));
        return;
    }

    tvPlaySpotify(spotifyId, tvCurrentSpotifyTrack !== spotifyId);
}

function tvActivateAudio() {
    tvAudioGestureReady = true;
    tvSyncAudioUi();
    const spotifyId = estadoCache.cancion_actual?.spotifyId || tvPendingSpotifyTrack || '';
    if (!spotifyId) {
        tvSetAudioStatus(t('tv.audioNoSong'));
        return;
    }
    tvPlaySpotify(spotifyId, true);
}

async function connectTvRoom() {
    const input = document.getElementById('tv-room-input');
    const roomCode = String(input?.value || '').trim().toUpperCase();
    if (!roomCode) {
        tvSetSetupError(t('errors.joinCodeRequired'));
        return;
    }

    try {
        await ensureAuth();
        salaA = roomCode;
        tvRememberRoom(roomCode);
        tvConnectUrlState(roomCode);
        tvSetSetupError('');
        tvDisconnectListener();
        activeTvListenerRef = salaRef();
        activeTvListenerRef.on('value', (snap) => {
            if (!snap.exists()) {
                tvHandleMissingRoom();
                return;
            }
            const sala = snap.val() || {};
            if (!sala.host_uid || !sala.uid_to_player) {
                tvHandleMissingRoom();
                return;
            }
            salaMetaCache = sala;
            jugadoresCache = sala.jugadores || {};
            estadoCache = sala.estado_juego || estadoJuegoBase(FASES.LOBBY);
            tvShowApp();
            tvRenderAll();
        }, (err) => {
            tvShowSetup();
            tvSetSetupError(friendlyFirebaseError(err, t('errors.connectionLost')));
        });
    } catch (err) {
        tvSetSetupError(friendlyFirebaseError(err, t('tv.roomNotFound')));
    }
}

window.connectTvRoom = connectTvRoom;
window.tvActivateAudio = tvActivateAudio;
window.onSpotifyIframeApiReady = (IFrameAPI) => {
    IFrameAPI.createController(
        document.getElementById('tv-spotify-iframe'),
        { uri: 'spotify:track:4uLU6hMCxmIqC3pqr0nu9I' },
        (controller) => {
            tvSpotifyController = controller;
            tvSyncAudioUi();
            tvSetAudioStatus(tvAudioGestureReady ? t('tv.audioReady') : t('tv.audioNeedsTap'));
            if (tvPendingSpotifyTrack) tvPlaySpotify(tvPendingSpotifyTrack, tvAudioGestureReady);
        }
    );
};

window.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('tv-room-input');
    const params = new URLSearchParams(window.location.search);
    const fromUrl = String(params.get('sala') || '').trim().toUpperCase();
    const remembered = tvRememberedRoom().toUpperCase();
    const initialRoom = fromUrl || remembered;

    if (input) {
        input.value = initialRoom;
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') connectTvRoom();
        });
    }

    if (initialRoom) {
        connectTvRoom();
    } else {
        tvShowSetup();
    }
    tvSyncAudioUi();
});
