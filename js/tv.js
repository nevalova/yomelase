const TV_ROOM_STORAGE_KEY = 'ymls_tv_room_v1';
let activeTvListenerRef = null;

function tvCurrentPhase() {
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    if (estadoSala === FASES.LOBBY || estadoSala === FASES.LISTA) return estadoSala;
    return estadoCache.fase || FASES.LOBBY;
}

function tvModeLabel(modo) {
    return modo === MODOS.DIFICIL ? t('tv.difficultyHard') : t('tv.difficultyEasy');
}

function tvSetSetupError(msg) {
    const el = document.getElementById('tv-setup-error');
    if (el) el.innerText = msg || '';
}

function tvShowSetup() {
    document.getElementById('tv-setup').classList.remove('hidden');
    document.getElementById('tv-app').classList.add('hidden');
}

function tvShowApp() {
    document.getElementById('tv-setup').classList.add('hidden');
    document.getElementById('tv-app').classList.remove('hidden');
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
        stageTitle.innerText = estadoCache.ganador ? t('summary.winner', { name: estadoCache.ganador }) : t('tv.finalTitle');
        stageSubtitle.innerText = tvResumenEstado(estadoCache, 'resumen_resultado') || t('tv.resultNote');
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
    const cancion = normalizarCarta(estadoCache.cancion_actual);
    const revealed = !!(estadoCache.revelar || fase === FASES.REVELANDO || fase === FASES.RESULTADO || fase === FASES.FINAL);
    const summary = [tvResumenEstado(estadoCache, 'resumen_resultado'), tvResumenEstado(estadoCache, 'resumen_votos')]
        .filter(Boolean)
        .join(' | ');

    kicker.innerText = fase === FASES.FINAL ? t('tv.finalTitle') : t('tv.revealTitle');

    if (!revealed || !cancion) {
        empty.innerText = fase === FASES.JUGANDO || fase === FASES.ESPERA_ROBO
            ? t('tv.revealWaiting')
            : t('tv.revealPending');
        empty.classList.remove('hidden');
        content.classList.add('hidden');
        return;
    }

    document.getElementById('tv-reveal-year').innerText = String(cancion.y || '');
    document.getElementById('tv-reveal-year').style.setProperty('--decade-rgb', colorDecada(cancion.y));
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
    badge.innerText = carta.base ? t('cards.base') : `${decadaDeYear(carta.y)}s`;

    const year = document.createElement('div');
    year.className = 'tv-timeline-year';
    year.innerText = String(carta.y);

    card.appendChild(badge);
    card.appendChild(year);

    if (!carta.base) {
        const title = document.createElement('div');
        title.className = 'tv-timeline-title';
        title.innerText = carta.t || t('cards.previous');

        const artist = document.createElement('div');
        artist.className = 'tv-timeline-artist';
        artist.innerText = carta.a || t('cards.noData');

        card.appendChild(title);
        card.appendChild(artist);
    }

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
    entities.forEach(({ entity, cartas, monedas }) => {
        const row = document.createElement('div');
        row.className = 'tv-score-row';
        row.style.setProperty('--team-rgb', entity.colorRgb || '255, 215, 0');
        if (current && current.key === entity.key) row.classList.add('active');

        const main = document.createElement('div');
        main.className = 'tv-score-main';

        const name = document.createElement('div');
        name.className = 'tv-score-name';
        name.innerText = entity.name;

        const sub = document.createElement('div');
        sub.className = 'tv-score-sub';
        sub.innerText = tvEntitySubtitle(entity);

        main.appendChild(name);
        main.appendChild(sub);

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
        row.appendChild(main);
        row.appendChild(stats);
        list.appendChild(row);
    });
}

function tvRenderAll() {
    tvRenderMeta();
    tvRenderStage();
    tvRenderReveal();
    tvRenderTimeline();
    tvRenderScore();
}

function connectTvRoom() {
    const input = document.getElementById('tv-room-input');
    const roomCode = String(input?.value || '').trim().toUpperCase();
    if (!roomCode) {
        tvSetSetupError(t('errors.joinCodeRequired'));
        return;
    }

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
        salaMetaCache = sala;
        jugadoresCache = sala.jugadores || {};
        estadoCache = sala.estado_juego || estadoJuegoBase(FASES.LOBBY);
        tvShowApp();
        tvRenderAll();
    });
}

window.connectTvRoom = connectTvRoom;

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
});
