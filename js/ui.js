function renderLobby() {
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    const panel = document.getElementById('lobby-panel');
    const btnComenzar = document.getElementById('btn-comenzar');
    const btnIniciar = document.getElementById('btn-iniciar-partida');
    const msg = document.getElementById('lobby-msg');
    const playersValue = document.getElementById('playersCountV');
    const lobbyTitle = document.getElementById('lobby-title');

    panel.classList.toggle('hidden', !(estadoSala === FASES.LOBBY || estadoSala === FASES.LISTA));
    if (lobbyTitle) lobbyTitle.innerText = salaA ? t('game.roomWithCode', { room: salaA }) : t('game.lobbyReady');
    btnComenzar.classList.toggle('hidden', !(esHost && estadoSala === FASES.LOBBY));
    btnIniciar.classList.toggle('hidden', !(esHost && estadoSala === FASES.LISTA));
    btnComenzar.innerText = t('actions.lockRoom');
    btnIniciar.innerText = t('actions.startFirstRound');
    btnComenzar.disabled = totalJugadores() < 1;
    btnIniciar.disabled = totalJugadores() < 1;
    if (playersValue) playersValue.innerText = `${totalJugadores()}/${MAX_JUGADORES}`;

    let lobbyMsg = '';
    if (!esHost && estadoSala === FASES.LOBBY) lobbyMsg = t('lobby.guestOpen');
    if (!esHost && estadoSala === FASES.LISTA) lobbyMsg = t('lobby.guestReady');
    msg.innerText = lobbyMsg;
    msg.classList.toggle('hidden', !lobbyMsg);

    renderDifficultyUi(estadoSala);
    document.getElementById('btn-replay').classList.toggle('hidden', !esHost);
}

function renderDifficultyUi(estadoSala = salaMetaCache.estado_sala || FASES.LOBBY) {
    const modo = modoActual();
    const difficultyValue = document.getElementById('difficultyV');
    const note = document.getElementById('difficulty-note');
    const btnFacil = document.getElementById('btn-modo-facil');
    const btnDificil = document.getElementById('btn-modo-dificil');
    const editable = esHost && lobbyEditable(estadoSala);

    if (difficultyValue) difficultyValue.innerText = modo === MODOS.DIFICIL ? t('game.modeHard') : t('game.modeEasy');
    if (note) note.innerText = modo === MODOS.DIFICIL ? t('game.difficultyHardHint') : t('game.difficultyEasyHint');
    if (btnFacil) {
        btnFacil.classList.toggle('active', modo === MODOS.FACIL);
        btnFacil.disabled = !editable;
    }
    if (btnDificil) {
        btnDificil.classList.toggle('active', modo === MODOS.DIFICIL);
        btnDificil.disabled = !editable;
    }
}

function renderHostControls() {
    const panel = document.getElementById('host-controls');
    const playReveal = document.getElementById('host-play-reveal');
    const btnEscuchar = document.getElementById('btn-escuchar-cancion');
    const btnRevelar = document.getElementById('btn-revelar');
    const btnSiguiente = document.getElementById('btn-siguiente-cancion');
    const revealNote = document.getElementById('host-reveal-note');
    const fase = estadoCache.fase || FASES.LOBBY;
    const enPartida = (salaMetaCache.estado_sala || FASES.LOBBY) === ESTADO_EN_PARTIDA;
    const puedeRevelar = esHost && enPartida && (fase === FASES.JUGANDO || fase === FASES.ESPERA_ROBO) && !!estadoCache.cancion_actual;
    const puedeSiguiente = esHost && enPartida && (fase === FASES.REVELANDO || fase === FASES.RESULTADO) && !estadoCache.ganador;
    const esperaEleccion = puedeRevelar && !estadoCache.seleccion_turno;

    btnRevelar.innerText = t('actions.revealCard');
    btnSiguiente.innerText = t('actions.nextRound');
    panel.classList.toggle('hidden', !(puedeRevelar || puedeSiguiente));
    playReveal.classList.toggle('hidden', !puedeRevelar);
    btnEscuchar.classList.toggle('hidden', !puedeRevelar);
    btnRevelar.classList.toggle('hidden', !puedeRevelar);
    btnSiguiente.classList.toggle('hidden', !puedeSiguiente);
    if (revealNote) {
        revealNote.innerText = esperaEleccion ? t('status.hostNoSelectionYet') : '';
        revealNote.classList.toggle('hidden', !esperaEleccion);
    }
}

function renderStageShell() {
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    const enPartida = estadoSala === ESTADO_EN_PARTIDA;
    const solo = enPartida && esSolitario();
    const header = document.querySelector('.game-header');
    const statusPanel = document.getElementById('status-panel');
    const scorePanel = document.getElementById('score-panel');
    const audioOption = document.getElementById('audio-option-panel');

    if (header) header.classList.toggle('hidden', !enPartida);
    if (statusPanel) statusPanel.classList.toggle('hidden', !enPartida);
    if (scorePanel) {
        scorePanel.classList.toggle('hidden', solo);
        scorePanel.classList.toggle('lobby-roster-panel', !enPartida);
    }
    if (audioOption && !enPartida) audioOption.classList.add('hidden');
}

function renderBadge(contenedor, className, text) {
    const badge = document.createElement('span');
    badge.className = className;
    badge.textContent = text;
    contenedor.appendChild(badge);
}

function crearProgresoCartas(cartas, colorRgb = '68, 244, 255') {
    const progreso = document.createElement('div');
    progreso.className = 'score-progress';
    if (cartas <= 0) progreso.classList.add('empty');
    progreso.style.setProperty('--team-rgb', colorRgb);
    progreso.style.setProperty('--progress', `${Math.min(100, Math.max(0, (cartas / OBJETIVO_CARTAS) * 100))}%`);

    const bar = document.createElement('span');
    bar.className = 'score-progress-bar';

    const label = document.createElement('span');
    label.className = 'score-progress-label';
    label.textContent = `${cartas}/${OBJETIVO_CARTAS}`;

    progreso.appendChild(bar);
    progreso.appendChild(label);
    return progreso;
}

function toggleScorePanel() {
    scoreExpanded = !scoreExpanded;
    renderPlayers();
}

function scoreEntidad(entity) {
    return cartasEntidad(entity?.data || {}).length;
}

function liderMarcador(entities) {
    return [...(entities || [])].sort((a, b) => {
        const diffCartas = scoreEntidad(b) - scoreEntidad(a);
        if (diffCartas) return diffCartas;
        return (a.name || '').localeCompare(b.name || '');
    })[0] || null;
}

function puedeExpulsarJugador(playerId) {
    return !!(esHost && playerId && playerId !== miId && salaMetaCache.host_id !== playerId);
}

function crearBotonExpulsar(playerId, nombre) {
    const btn = document.createElement('button');
    btn.className = 'host-kick-btn';
    btn.type = 'button';
    btn.textContent = t('actions.kickPlayer');
    btn.onclick = (event) => {
        event.stopPropagation();
        expulsarJugador(playerId);
    };
    btn.setAttribute('aria-label', t('actions.kickPlayerNamed', { name: nombre || t('cards.player') }));
    return btn;
}

function renderSoloCard(playerId, player, options = {}) {
    const card = document.createElement('div');
    card.className = 'solo-card';
    card.style.setProperty('--team-rgb', '255, 215, 0');
    if (options.active) card.classList.add('active-team');
    if (options.turn) {
        card.classList.add('turn-team');
        card.dataset.turnLabel = t('game.turn');
    }
    if (player?.conectado === false) card.classList.add('offline-card');
    const cartas = cartasJugador(player).length;

    const header = document.createElement('div');
    header.className = 'team-header';

    const copy = document.createElement('div');
    copy.className = 'solo-name-wrap';
    const name = document.createElement('div');
    name.className = 'team-name';
    name.textContent = player?.nombre || t('cards.player');
    copy.appendChild(name);

    if (salaMetaCache.host_id === playerId) renderBadge(copy, 'host-badge', t('common.host'));

    const stats = document.createElement('div');
    stats.className = 'team-stats';
    const cards = document.createElement('div');
    pintarStatConIcono(cards, 'carta', `${cartas}/${OBJETIVO_CARTAS}`, t('cards.cardsAlt'));
    const tokens = document.createElement('div');
    pintarStatConIcono(tokens, 'moneda', esSolitario() ? '--' : String(Number(player?.tokens) || 0), t('cards.tokensAlt'));
    stats.appendChild(cards);
    stats.appendChild(tokens);

    header.appendChild(copy);
    header.appendChild(stats);
    card.appendChild(header);
    card.appendChild(crearProgresoCartas(cartas, '255, 215, 0'));
    if (puedeExpulsarJugador(playerId)) {
        const actions = document.createElement('div');
        actions.className = 'team-actions host-kick-actions';
        actions.appendChild(crearBotonExpulsar(playerId, player?.nombre || t('cards.player')));
        card.appendChild(actions);
    }

    return card;
}

function renderTeamCard(entity, enLobbyEditable, miTeamId, turnoEntity) {
    const { id: teamId, data: team, members, colorRgb } = entity;
    const card = document.createElement('div');
    card.className = 'team-card';
    card.style.setProperty('--team-rgb', colorRgb || '68, 244, 255');
    if (teamId === miTeamId) card.classList.add('active-team');
    if (turnoEntity && turnoEntity.type === 'team' && turnoEntity.id === teamId) {
        card.classList.add('turn-team');
        card.dataset.turnLabel = t('game.turn');
    }
    const cartas = cartasEntidad(team).length;

    const header = document.createElement('div');
    header.className = 'team-header';

    const nameWrap = document.createElement('div');
    nameWrap.className = 'team-name-wrap';
    const swatch = document.createElement('span');
    swatch.className = 'team-swatch';
    const copy = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'team-name';
    name.textContent = team.nombre || t('teams.teamFallback');
    const sub = document.createElement('div');
    sub.className = 'team-sub';
    sub.textContent = t('teams.memberCount', { count: members.length });
    copy.appendChild(name);
    copy.appendChild(sub);
    nameWrap.appendChild(swatch);
    nameWrap.appendChild(copy);

    const stats = document.createElement('div');
    stats.className = 'team-stats';
    const cards = document.createElement('div');
    pintarStatConIcono(cards, 'carta', `${cartas}/${OBJETIVO_CARTAS}`, t('cards.cardsAlt'));
    const tokens = document.createElement('div');
    pintarStatConIcono(tokens, 'moneda', esSolitario() ? '--' : String(Number(team?.tokens) || 0), t('cards.tokensAlt'));
    stats.appendChild(cards);
    stats.appendChild(tokens);

    header.appendChild(nameWrap);
    header.appendChild(stats);
    card.appendChild(header);
    card.appendChild(crearProgresoCartas(cartas, colorRgb || '68, 244, 255'));

    const membersWrap = document.createElement('div');
    membersWrap.className = 'team-members';
    members.forEach(([playerId, player]) => {
        const chip = document.createElement('div');
        chip.className = 'member-chip';
        if (turnoEntity && turnoEntity.type === 'team' && turnoEntity.id === teamId && estadoCache.turno_de === playerId) {
            chip.classList.add('active-player');
        }
        if (player?.conectado === false) chip.classList.add('offline-player');
        chip.style.setProperty('--team-rgb', colorRgb || '68, 244, 255');
        const label = document.createElement('span');
        label.className = 'member-chip-name';
        label.textContent = player?.nombre || t('cards.player');
        chip.appendChild(label);
        if (puedeExpulsarJugador(playerId)) {
            chip.appendChild(crearBotonExpulsar(playerId, player?.nombre || t('cards.player')));
        }
        membersWrap.appendChild(chip);
    });
    card.appendChild(membersWrap);

    if (enLobbyEditable) {
        const actions = document.createElement('div');
        actions.className = 'team-actions';
        const actionBtn = document.createElement('button');
        actionBtn.className = 'team-join-btn';
        if (teamId === miTeamId) {
            const soloInTeam = members.length <= 1;
            actionBtn.textContent = soloInTeam ? t('actions.cancelTeam') : t('actions.leaveTeam');
            actionBtn.onclick = () => salirDeMiEquipo();
        } else {
            actionBtn.textContent = t('actions.joinTeam');
            actionBtn.onclick = () => cambiarMiEquipo(teamId);
        }
        actions.appendChild(actionBtn);
        card.appendChild(actions);
    }

    return card;
}

function renderPlayers() {
    const cont = document.getElementById('jugadoresV');
    const title = document.getElementById('teams-title');
    const note = document.getElementById('teams-note');
    const btnCrearEquipo = document.getElementById('btn-crear-equipo');
    const btnToggleScore = document.getElementById('btn-toggle-score');
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    const enLobbyEditable = lobbyEditable(estadoSala);
    const enPartida = estadoSala === ESTADO_EN_PARTIDA;
    if (cont?.parentElement) cont.parentElement.classList.toggle('hidden', enPartida && esSolitario());
    const miTeamId = miEquipoId();
    const turnoEntity = entidadPorTurno(estadoCache);
    const entities = entidadesActivasLista();
    const activeTeams = totalEquiposActivos();
    const totalPlayers = totalJugadores();
    const offlineCount = Object.values(jugadoresCache || {}).filter((player) => player?.conectado === false).length;
    const marcadorCompacto = !enLobbyEditable && !scoreExpanded && entities.length > 1;
    const ocultarNotaMarcador = !enLobbyEditable && (!scoreExpanded || entities.length <= 1);
    const leader = liderMarcador(entities);
    const visibles = marcadorCompacto && leader ? [leader] : entities;

    if (title) title.innerText = enPartida ? t('game.scoreboard') : t('game.playersSetup');
    if (btnCrearEquipo) btnCrearEquipo.classList.toggle('hidden', !enLobbyEditable);
    if (btnToggleScore) {
        btnToggleScore.classList.toggle('hidden', enLobbyEditable || entities.length <= 1);
        btnToggleScore.innerText = scoreExpanded ? t('actions.hideFullScore') : t('actions.showFullScore');
        btnToggleScore.setAttribute('aria-expanded', scoreExpanded ? 'true' : 'false');
    }
    if (note) {
        const notas = [];
        if (ocultarNotaMarcador) {
            note.classList.add('hidden');
            note.innerText = '';
        } else {
            if (enLobbyEditable && totalPlayers >= MAX_JUGADORES) {
                notas.push(t('teams.lobbyFullNote', { players: totalPlayers, maxPlayers: MAX_JUGADORES }));
            } else {
                notas.push(activeTeams
                    ? (enLobbyEditable
                        ? t('teams.lobbyNote', { players: totalPlayers, maxPlayers: MAX_JUGADORES, teams: activeTeams, maxTeams: MAX_EQUIPOS })
                        : t('teams.gameNote', { teams: entities.length }))
                    : t('teams.lobbySoloNote', { players: totalPlayers, maxPlayers: MAX_JUGADORES }));
            }
            if (offlineCount) notas.push(t('teams.offlineNote', { count: offlineCount }));
            note.classList.remove('hidden');
            note.innerText = notas.join('\n');
        }
    }

    cont.innerHTML = '';
    if (!entities.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerText = t('teams.emptyScore');
        cont.appendChild(empty);
        return;
    }
    visibles.forEach((entity) => {
        if (entity.type === 'team') {
            cont.appendChild(renderTeamCard(entity, enLobbyEditable, miTeamId, turnoEntity));
        } else {
            const card = renderSoloCard(entity.id, entity.data, {
                active: entidadDeJugador(miId)?.key === entity.key,
                turn: turnoEntity?.key === entity.key,
                isMe: entity.id === miId
            });
            cont.appendChild(card);
        }
    });
}

function renderMyStats() {
    const miEntidad = entidadDeJugador(miId);
    const data = miEntidad?.data || {};
    misT = Number(data.tokens) || 0;
    miCartas = cartasEntidad(data);
    miL = lineaReferenciaEntidad(data);
    document.getElementById('tokensV').innerText = esSolitario() ? '--' : misT;
    document.getElementById('cartasV').innerText = `${miCartas.length}/${OBJETIVO_CARTAS}`;
    const tokensCard = document.getElementById('my-tokens-card');
    const cardsCard = document.getElementById('my-cards-card');
    if (tokensCard) tokensCard.classList.toggle('hidden', esSolitario());
    if (cardsCard) cardsCard.classList.toggle('solo-stat-card', esSolitario());

    const esTurnoMio = miEntidad && estadoCache.turno_entidad_tipo === miEntidad.type && estadoCache.turno_entidad_id === miEntidad.id && estadoCache.turno_de === miId;
    document.getElementById('zona-canje').classList.toggle(
        'hidden',
        esSolitario() || misT < 3 || estadoCache.fase !== FASES.JUGANDO || !esTurnoMio || !!estadoCache.revelar || !!estadoCache.seleccion_turno
    );
}

function renderFinalSummary() {
    const cont = document.getElementById('final-resumen');
    if (!cont) return;
    const entities = entidadesActivasLista()
        .map((entity) => ({
            nombre: entity.name,
            cartas: cartasEntidad(entity.data).length,
            monedas: Number(entity.data?.tokens) || 0
        }))
        .sort((a, b) => (b.cartas - a.cartas) || (b.monedas - a.monedas) || a.nombre.localeCompare(b.nombre));

    cont.innerHTML = '';
    entities.forEach((entity) => {
        const row = document.createElement('div');
        row.className = 'final-summary-row';

        const name = document.createElement('span');
        name.className = 'final-summary-name';
        name.textContent = entity.nombre;

        const stats = document.createElement('span');
        stats.className = 'final-summary-stats';
        stats.textContent = esSolitario()
            ? t('game.finalCardsOnly', { cards: entity.cartas })
            : t('game.finalCardsCoins', { cards: entity.cartas, coins: entity.monedas });

        row.appendChild(name);
        row.appendChild(stats);
        cont.appendChild(row);
    });
}

function nombreFase(fase) {
    const value = i18nValue(`phase.${fase || FASES.LOBBY}`, null);
    return value || fase || t('phase.LOBBY');
}

function nombreJugador(id, fallback = '') {
    return jugadoresCache[id]?.nombre || fallback || t('cards.player');
}

function slotLabel(slot) {
    if (!slot) return '';
    if (slot.left == null && slot.right == null) return t('slot.firstCardLabel');
    if (slot.left == null) return t('slot.beforeLabel', { right: slot.right });
    if (slot.right == null) return t('slot.afterLabel', { left: slot.left });
    return t('slot.betweenLabel', { left: slot.left, right: slot.right });
}

function labelSeleccion(sel) {
    if (!sel) return '';
    if (sel.canjeado) return t('summary.exchangedSelection');
    return slotLabel(sel.slot) || sel.label || '';
}

function textoI18n(info) {
    if (!info?.key) return '';
    const params = { ...(info.params || {}) };
    if (params.resultKey) params.result = t(params.resultKey, params.resultParams || {});
    return t(info.key, params);
}

function resumenEstado(e, campo) {
    return textoI18n(e?.[`${campo}_i18n`]) || e?.[campo] || '';
}

function setPhaseCue(msg) {
    const el = document.getElementById('phase-cue');
    if (el) el.innerText = msg || '';
}

function setNextActionCue(msg) {
    const el = document.getElementById('next-action-cue');
    if (!el) return;
    el.innerHTML = '';
    el.classList.toggle('hidden', !msg);
    if (!msg) return;

    const label = document.createElement('span');
    label.className = 'next-action-label';
    label.textContent = t('status.nextActionLabel');

    const copy = document.createElement('strong');
    copy.textContent = msg;

    el.appendChild(label);
    el.appendChild(copy);
}

function focusRevealMovil(e, panel) {
    if (!panel || !e?.revelar) return;
    const esPantallaMovil = !window.matchMedia || window.matchMedia('(max-width: 760px)').matches;
    if (!esPantallaMovil) return;
    const key = `${e.ronda_id || ''}:${e.cancion_idx ?? ''}:${e.cancion_actual?.spotifyId || e.cancion_actual?.year || e.cancion_actual?.y || ''}`;
    if (!key || revealFocusKey === key) return;
    revealFocusKey = key;
    window.setTimeout(() => {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
}

function estadoVisualJuego(fase, estadoSala, e, miEntidad, turnoEntidad, esMiTurnoEntidad, esJugadorActivo) {
    if (estadoSala === FASES.LOBBY) return 'lobby';
    if (estadoSala === FASES.LISTA) return 'ready';
    if (fase === FASES.FINAL) return 'final';
    if (fase === FASES.REVELANDO || fase === FASES.RESULTADO) return 'reveal';
    if (fase === FASES.PRE_RONDA) return 'prepare';
    if (fase === FASES.JUGANDO) {
        if (esMiTurnoEntidad && esJugadorActivo) return e.seleccion_turno ? 'bonus' : 'turn';
        if (esMiTurnoEntidad) return 'team';
        return 'waiting';
    }
    if (fase === FASES.ESPERA_ROBO) {
        if (esSolitario()) return 'reveal';
        if (!esMiTurnoEntidad && miEntidad && misT >= 1 && lineaReferenciaEntidad(turnoEntidad?.data || {}).length) return 'steal';
        if (esMiTurnoEntidad && esJugadorActivo && puedeBonusMoneda()) return 'bonus';
        return 'waiting';
    }
    return 'waiting';
}

function setEstadoVisualJuego(state) {
    const app = document.getElementById('app');
    if (app) app.dataset.state = state || 'waiting';
}

function syncAutoGuessUi(e) {
    const zona = document.getElementById('zona-autoguess');
    const flexInput = document.getElementById('guess-flex-input');
    const songInput = document.getElementById('guess-song-input');
    const artistInput = document.getElementById('guess-artist-input');
    const hardFields = document.getElementById('guess-hard-fields');
    const title = document.getElementById('autoguess-title');
    const btnGuardar = document.getElementById('btn-check-guess');
    const btnOmitir = document.getElementById('btn-skip-guess');
    const nota = document.getElementById('autoguess-note');
    const modo = modoActual();
    const respuestaGuardada = !!(e.respuesta_auto?.guess_text || e.respuesta_auto?.guess_song || e.respuesta_auto?.omitido);

    if (esSolitario()) {
        zona.classList.add('hidden');
        return;
    }

    zona.classList.remove('hidden');
    if (hardFields) hardFields.classList.toggle('hidden', modo !== MODOS.DIFICIL);
    if (flexInput) flexInput.classList.toggle('hidden', modo === MODOS.DIFICIL);
    if (title) title.innerText = modo === MODOS.DIFICIL ? t('game.autoGuessQuestionHard') : t('game.autoGuessQuestionEasy');

    if (flexInput) {
        if (flexInput.dataset.rondaId !== String(e.ronda_id || '')) {
            flexInput.value = '';
            flexInput.dataset.rondaId = String(e.ronda_id || '');
        }
        if (e.respuesta_auto?.guess_text && !flexInput.value) flexInput.value = e.respuesta_auto.guess_text;
        flexInput.disabled = respuestaGuardada;
    }
    if (songInput) {
        if (songInput.dataset.rondaId !== String(e.ronda_id || '')) {
            songInput.value = '';
            songInput.dataset.rondaId = String(e.ronda_id || '');
        }
        if (e.respuesta_auto?.guess_song && !songInput.value) songInput.value = e.respuesta_auto.guess_song;
        songInput.disabled = respuestaGuardada;
    }
    if (artistInput) {
        if (artistInput.dataset.rondaId !== String(e.ronda_id || '')) {
            artistInput.value = '';
            artistInput.dataset.rondaId = String(e.ronda_id || '');
        }
        if (e.respuesta_auto?.guess_artist && !artistInput.value) artistInput.value = e.respuesta_auto.guess_artist;
        artistInput.disabled = respuestaGuardada;
    }
    if (btnGuardar) btnGuardar.disabled = respuestaGuardada;
    if (btnOmitir) btnOmitir.disabled = respuestaGuardada;
    if (nota) {
        if (e.respuesta_auto?.guess_text || e.respuesta_auto?.guess_song) {
            nota.innerText = t('status.autoGuessSaved');
        } else if (e.respuesta_auto?.omitido) {
            nota.innerText = t('status.autoGuessSkipped');
        } else {
            nota.innerText = modo === MODOS.DIFICIL ? t('game.autoGuessHintHard') : t('game.autoGuessHintEasy');
        }
    }
}

function textoTurno(e, fase) {
    if (fase === FASES.LOBBY) return t('status.waitingPlayers');
    const entityName = e.nombre_entidad_turno || '';
    const playerName = e.nombre_turno || '';
    if (e.turno_entidad_tipo === 'team' && entityName && playerName) return `${entityName} - ${playerName}`;
    return entityName || playerName || t('game.waiting');
}

function renderEstado() {
    const e = estadoCache || estadoJuegoBase(FASES.LOBBY);
    const fase = ((salaMetaCache.estado_sala === FASES.LOBBY) || (salaMetaCache.estado_sala === FASES.LISTA)) ? salaMetaCache.estado_sala : (e.fase || FASES.LOBBY);
    const miEntidad = entidadDeJugador(miId);
    const turnoEntidad = entidadPorTurno(e) || (e.turno_de ? entidadDeJugador(e.turno_de) : null);
    const esMiTurnoEntidad = !!(miEntidad && turnoEntidad && miEntidad.type === turnoEntidad.type && miEntidad.id === turnoEntidad.id);
    const esJugadorActivo = e.turno_de === miId;

    document.getElementById('faseV').innerText = nombreFase(fase);
    document.getElementById('turnoV').innerText = textoTurno(e, fase);
    renderDifficultyUi(salaMetaCache.estado_sala || FASES.LOBBY);

    const extra = document.getElementById('estadoExtra');
    const resultadoPanel = document.getElementById('resultado-panel');
    const finalPanel = document.getElementById('final-panel');
    const zonaPos = document.getElementById('zona-posicion');
    const zonaRobo = document.getElementById('zona-robo');
    const zonaCancelarRobo = document.getElementById('zona-cancelar-robo');
    const zonaAutoGuess = document.getElementById('zona-autoguess');
    const zonaPasarTurno = document.getElementById('zona-pasar-turno');
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    renderStageShell();
    setEstadoVisualJuego(estadoVisualJuego(fase, estadoSala, e, miEntidad, turnoEntidad, esMiTurnoEntidad, esJugadorActivo));
    setNextActionCue('');

    zonaPos.classList.add('hidden');
    zonaRobo.classList.add('hidden');
    zonaCancelarRobo.classList.add('hidden');
    zonaAutoGuess.classList.add('hidden');
    zonaPasarTurno.classList.add('hidden');
    resultadoPanel.classList.add('hidden');
    finalPanel.classList.add('hidden');

    if (estadoSala === FASES.LOBBY) {
        updateStatus(t('status.waitingStart'));
        setPhaseCue(t('status.cueLobby'));
        setNextActionCue(esHost ? t('status.nextActionHostLockRoom') : t('status.nextActionGuestWaitHost'));
        setEleccion('');
        extra.innerText = t('status.playersCanJoin');
        return;
    }
    if (estadoSala === FASES.LISTA) {
        updateStatus(esHost ? t('status.hostStart') : t('status.waitingHostStart'));
        setPhaseCue(esHost ? t('status.cueLobbyReadyHost') : t('status.cueLobbyReadyGuest'));
        setNextActionCue(esHost ? t('status.nextActionHostStartGame') : t('status.nextActionGuestWaitHost'));
        setEleccion('');
        extra.innerText = t('status.roomClosed');
        return;
    }

    const seleccionTurnoLabel = labelSeleccion(e.seleccion_turno);
    setEleccion(seleccionTurnoLabel ? t('status.currentSelection', { label: seleccionTurnoLabel }) : '');

    if (fase === FASES.PRE_RONDA) {
        updateStatus(esMiTurnoEntidad ? (miEntidad?.type === 'team' ? t('status.prepareTeamTurn') : t('status.prepareTurn')) : t('status.prepareNextSong'));
        setPhaseCue(esMiTurnoEntidad ? t('status.cueYourTurn') : t('status.cueOtherTurn'));
        setNextActionCue(esMiTurnoEntidad ? t('status.nextActionPlaceCard') : t('status.nextActionWaitTurn'));
        extra.innerText = t('status.songStarting');
    }

    if (fase === FASES.JUGANDO) {
        if (esMiTurnoEntidad && esJugadorActivo) {
            updateStatus(e.seleccion_turno
                ? (esSolitario() ? t('status.choiceSavedSolo') : t('status.choiceSaved'))
                : (miEntidad?.type === 'team' ? t('status.yourTeamTurn') : t('status.yourTurn')));
            setPhaseCue(e.seleccion_turno && puedeBonusMoneda() ? t('status.cueGuessBonus') : t('status.cueYourTurn'));
            setNextActionCue(e.seleccion_turno && puedeBonusMoneda() ? t('status.nextActionGuessBonus') : t('status.nextActionPlaceCard'));
            extra.innerText = e.seleccion_turno
                ? (esSolitario() ? t('status.hostCanRevealSolo') : t('status.othersCanSteal'))
                : t('status.placeBeforeReveal');
            dibujarL(miL, { modo: 'turno', disabled: !!e.seleccion_turno, focusIdx: e.seleccion_turno?.idx });
            if (!e.revelar && puedeBonusMoneda()) syncAutoGuessUi(e);
            if (miEntidad?.type === 'team' && (miEntidad.members?.length || 0) > 1 && !e.seleccion_turno) {
                zonaPasarTurno.classList.remove('hidden');
            }
        } else if (esMiTurnoEntidad) {
            updateStatus(t('status.teamTurnBy', { team: e.nombre_entidad_turno || '', player: e.nombre_turno || '' }));
            setPhaseCue(t('status.cueTeammateTurn'));
            setNextActionCue(t('status.nextActionWaitTurn'));
            extra.innerText = t('status.waitTeammateChoice');
        } else {
            updateStatus(t('status.waitYourTurn'));
            setPhaseCue(t('status.cueOtherTurn'));
            setNextActionCue(esHost ? t('status.nextActionHostReveal') : t('status.nextActionWaitTurn'));
            extra.innerText = e.seleccion_turno ? t('status.waitStealPhase') : t('status.waitPlayerChoice');
        }
    }

    if (fase === FASES.ESPERA_ROBO) {
        if (esSolitario()) {
            updateStatus(t('status.preparingReveal'));
            setPhaseCue(t('status.cueRevealGuest'));
            setNextActionCue(esHost ? t('status.nextActionHostReveal') : t('status.nextActionReview'));
            extra.innerText = '';
        } else if (esMiTurnoEntidad) {
            updateStatus(esJugadorActivo ? t('status.turnRegistered') : t('status.entityTurnLocked', { player: e.nombre_turno || '' }));
            setPhaseCue(esJugadorActivo && puedeBonusMoneda() ? t('status.cueGuessBonus') : t('status.cueTeammateTurn'));
            setNextActionCue(esJugadorActivo && puedeBonusMoneda() ? t('status.nextActionGuessBonus') : t('status.nextActionWaitTurn'));
            extra.innerText = t('status.othersDecideSteal');
            if (esJugadorActivo && !e.revelar && puedeBonusMoneda()) syncAutoGuessUi(e);
        } else if (miEntidad) {
            const miRobo = e.robos?.[miEntidad.key];
            const roboLabel = labelSeleccion(miRobo);
            if (miRobo?.slot || miRobo?.label) {
                updateStatus(t('status.yourSteal', { label: roboLabel }));
                setPhaseCue(t('status.cueStealPick'));
                setNextActionCue(esHost ? t('status.nextActionHostReveal') : t('status.nextActionReview'));
                extra.innerText = t('status.stealSaved');
                zonaCancelarRobo.classList.remove('hidden');
            } else if (miRobo?.pagado) {
                updateStatus(t('status.chooseSteal'));
                setPhaseCue(t('status.cueStealPick'));
                setNextActionCue(t('status.nextActionChooseSteal'));
                extra.innerText = t('status.avoidTurnSlot');
                zonaCancelarRobo.classList.remove('hidden');
                dibujarL(lineaReferenciaEntidad(turnoEntidad?.data || {}), { modo: 'robo', bloqueadoIdx: e.seleccion_turno?.idx, focusIdx: miRobo?.idx });
            } else if (!lineaReferenciaEntidad(turnoEntidad?.data || {}).length) {
                updateStatus(t('status.noStealAvailable'));
                setPhaseCue(t('status.cueOtherTurn'));
                setNextActionCue(t('status.nextActionWaitTurn'));
                extra.innerText = t('status.noBaseToSteal');
            } else if (misT >= 1) {
                updateStatus(t('status.wantSteal'));
                setPhaseCue(t('status.cueStealOffer'));
                setNextActionCue(t('status.nextActionSteal'));
                extra.innerText = seleccionTurnoLabel ? t('status.chose', { label: seleccionTurnoLabel }) : '';
                zonaRobo.classList.remove('hidden');
            } else {
                updateStatus(t('status.noTokensSteal'));
                setPhaseCue(t('status.cueOtherTurn'));
                setNextActionCue(t('status.nextActionWaitTurn'));
                extra.innerText = t('status.needToken');
            }
        }
    }

    if (fase === FASES.REVELANDO || fase === FASES.RESULTADO || fase === FASES.FINAL) {
        const resumenResultado = resumenEstado(e, 'resumen_resultado');
        const resumenVotos = resumenEstado(e, 'resumen_votos');
        resultadoPanel.classList.remove('hidden');
        document.getElementById('resultadoV').innerText = resumenResultado || t('status.reviewingResult');
        renderCancionRevelada(e.cancion_actual);
        focusRevealMovil(e, resultadoPanel);
        if (fase !== FASES.FINAL) {
            updateStatus(resumenResultado || t('status.revealingSong'));
            setPhaseCue(esHost ? t('status.cueRevealHost') : t('status.cueRevealGuest'));
            setNextActionCue(esHost ? t('status.nextActionHostNext') : t('status.nextActionReview'));
            extra.innerText = resumenVotos ? `${resumenVotos}${esHost ? ' / ' + t('status.pressNext') : ''}` : (esHost ? t('status.pressNext') : t('status.waitingNext'));
        }
    }

    if (fase === FASES.FINAL) {
        const sinCanciones = e.resumen_resultado_i18n?.key === 'summary.noSongs' || resumenEstado(e, 'resumen_resultado') === t('summary.noSongs');
        const finalText = sinCanciones ? t('status.noSongsFinal') : (e.ganador ? textoGanador(e.ganador) : t('status.gameOver'));
        finalPanel.classList.remove('hidden');
        document.getElementById('ganadorV').innerText = finalText;
        renderFinalSummary();
        updateStatus(finalText);
        setPhaseCue(sinCanciones ? (esHost ? t('status.noSongsHost') : t('status.noSongsGuest')) : (esHost ? t('status.cueFinalHost') : t('status.cueFinalGuest')));
        setNextActionCue(esHost ? t('status.cueFinalHost') : t('status.cueFinalGuest'));
        extra.innerText = sinCanciones ? (esHost ? t('status.noSongsHost') : t('status.noSongsGuest')) : t('status.hostReplay');
        document.getElementById('btn-replay').classList.toggle('hidden', !esHost);
        if (!sinCanciones && e.ganador) lanzarConfetiGanador(e.ganador, `${e.ronda_id || ''}:${e.ganador}`, 'mobile');
    }
}
