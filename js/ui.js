function renderLobby(){
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    const panel = document.getElementById('lobby-panel');
    const btnComenzar = document.getElementById('btn-comenzar');
    const btnIniciar = document.getElementById('btn-iniciar-partida');
    const msg = document.getElementById('lobby-msg');
    const totalTeams = totalEquiposActivos();
    const puedeIniciar = totalJugadores() === 1 || totalTeams >= 2;
    panel.classList.toggle('hidden', !(estadoSala === FASES.LOBBY || estadoSala === FASES.LISTA));
    btnComenzar.classList.toggle('hidden', !(esHost && estadoSala === FASES.LOBBY));
    btnIniciar.classList.toggle('hidden', !(esHost && estadoSala === FASES.LISTA));
    btnComenzar.disabled = !totalJugadores() || !puedeIniciar;
    btnIniciar.disabled = !totalJugadores() || !puedeIniciar;

    if (!puedeIniciar && totalJugadores() > 1) {
        msg.innerText = t('lobby.needTwoTeams');
    } else if (estadoSala === FASES.LOBBY) {
        msg.innerText = esHost ? t('lobby.hostOpen') : t('lobby.guestOpen');
    } else if (estadoSala === FASES.LISTA) {
        msg.innerText = esHost ? t('lobby.hostReady') : t('lobby.guestReady');
    } else {
        msg.innerText = '';
    }
    document.getElementById('btn-replay').classList.toggle('hidden', !esHost);
}

function renderHostControls(){
    const panel = document.getElementById('host-controls');
    const playReveal = document.getElementById('host-play-reveal');
    const btnEscuchar = document.getElementById('btn-escuchar-cancion');
    const btnRevelar = document.getElementById('btn-revelar');
    const btnSiguiente = document.getElementById('btn-siguiente-cancion');
    const fase = estadoCache.fase || FASES.LOBBY;
    const enPartida = (salaMetaCache.estado_sala || FASES.LOBBY) === ESTADO_EN_PARTIDA;
    const puedeRevelar = esHost && enPartida && (fase === FASES.JUGANDO || fase === FASES.ESPERA_ROBO) && !!estadoCache.cancion_actual;
    const puedeSiguiente = esHost && enPartida && (fase === FASES.REVELANDO || fase === FASES.RESULTADO) && !estadoCache.ganador;
    btnSiguiente.innerText = t('actions.nextSong');
    panel.classList.toggle('hidden', !(puedeRevelar || puedeSiguiente));
    playReveal.classList.toggle('hidden', !puedeRevelar);
    btnEscuchar.classList.toggle('hidden', !puedeRevelar);
    btnRevelar.classList.toggle('hidden', !puedeRevelar);
    btnSiguiente.classList.toggle('hidden', !puedeSiguiente);
}

function renderPlayers(){
    const cont = document.getElementById('jugadoresV');
    const title = document.getElementById('teams-title');
    const note = document.getElementById('teams-note');
    const btnCrearEquipo = document.getElementById('btn-crear-equipo');
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    const enLobbyEditable = estadoSala === FASES.LOBBY || estadoSala === FASES.LISTA;
    const teams = equipoOrdenadoLista();
    const myTeam = miEquipoId();

    if (title) title.innerText = enLobbyEditable ? t('game.teams') : t('game.scoreboard');
    if (btnCrearEquipo) btnCrearEquipo.classList.toggle('hidden', !enLobbyEditable || totalEquiposActivos() >= MAX_EQUIPOS);
    if (note) {
        note.classList.remove('hidden');
        note.innerText = enLobbyEditable
            ? t('teams.lobbyNote', { players: totalJugadores(), maxPlayers: MAX_JUGADORES, teams: totalEquiposActivos(), maxTeams: MAX_EQUIPOS })
            : t('teams.gameNote', { teams: totalEquiposActivos() });
    }

    cont.innerHTML = '';
    teams.forEach(([teamId, team]) => {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.style.setProperty('--team-rgb', colorEquipoRgb(teamId));
        if (teamId === myTeam) card.classList.add('active-team');
        if (estadoCache.turno_equipo_id === teamId) card.classList.add('turn-team');

        const members = miembrosEquipo(teamId);
        const activeMemberId = estadoCache.turno_equipo_id === teamId ? estadoCache.turno_de : '';
        const teamCards = cartasEquipo(team);
        const teamTokens = Number(team?.tokens) || 0;

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
        pintarStatConIcono(cards, 'carta', `${teamCards.length}/${OBJETIVO_CARTAS}`, t('cards.cardsAlt'));
        const tokens = document.createElement('div');
        pintarStatConIcono(tokens, 'moneda', esSolitario() ? '--' : String(teamTokens), t('cards.tokensAlt'));
        stats.appendChild(cards);
        stats.appendChild(tokens);

        header.appendChild(nameWrap);
        header.appendChild(stats);
        card.appendChild(header);

        const membersWrap = document.createElement('div');
        membersWrap.className = 'team-members';
        members.forEach(([playerId, player]) => {
            const chip = document.createElement('div');
            chip.className = 'member-chip';
            if (playerId === activeMemberId) chip.classList.add('active-player');
            if (player.conectado === false) chip.classList.add('offline-player');
            chip.style.setProperty('--team-rgb', colorEquipoRgb(teamId));
            chip.textContent = player.nombre || t('cards.player');
            membersWrap.appendChild(chip);
        });
        card.appendChild(membersWrap);

        if (enLobbyEditable) {
            const actions = document.createElement('div');
            actions.className = 'team-actions';
            const joinBtn = document.createElement('button');
            joinBtn.className = 'team-join-btn';
            if (teamId === myTeam) {
                joinBtn.disabled = true;
                joinBtn.textContent = t('teams.myTeam');
            } else {
                joinBtn.textContent = t('teams.joinTeam');
                joinBtn.onclick = () => cambiarMiEquipo(teamId);
            }
            actions.appendChild(joinBtn);
            card.appendChild(actions);
        }

        cont.appendChild(card);
    });
}

function renderMyStats(){
    const myTeam = equipoActivoActual() || {};
    misT = Number(myTeam.tokens) || 0;
    miCartas = cartasEquipo(myTeam);
    miL = lineaReferenciaEquipo(myTeam);
    document.getElementById('tokensV').innerText = esSolitario() ? '--' : misT;
    document.getElementById('cartasV').innerText = `${miCartas.length}/${OBJETIVO_CARTAS}`;
    const esJugadorActivo = estadoCache.turno_de === miId;
    const esMiTurnoEquipo = estadoCache.turno_equipo_id === miEquipoId();
    document.getElementById('btn-canje').classList.toggle('hidden', esSolitario() || misT < 3 || estadoCache.fase !== FASES.JUGANDO || !esMiTurnoEquipo || !esJugadorActivo || !!estadoCache.revelar || !!estadoCache.seleccion_turno);
}

function nombreFase(fase){
    const value = i18nValue(`phase.${fase || FASES.LOBBY}`, null);
    return value || fase || t('phase.LOBBY');
}

function nombreJugador(id, fallback = ''){
    return jugadoresCache[id]?.nombre || fallback || t('cards.player');
}

function slotLabel(slot){
    if (!slot) return '';
    if (slot.left == null && slot.right == null) return t('slot.firstCardLabel');
    if (slot.left == null) return t('slot.beforeLabel', { right: slot.right });
    if (slot.right == null) return t('slot.afterLabel', { left: slot.left });
    return t('slot.betweenLabel', { left: slot.left, right: slot.right });
}

function labelSeleccion(sel){
    if (!sel) return '';
    if (sel.canjeado) return t('summary.exchangedSelection');
    return slotLabel(sel.slot) || sel.label || '';
}

function textoI18n(info){
    if (!info?.key) return '';
    const params = { ...(info.params || {}) };
    if (params.resultKey) {
        params.result = t(params.resultKey, params.resultParams || {});
    }
    return t(info.key, params);
}

function resumenEstado(e, campo){
    return textoI18n(e?.[`${campo}_i18n`]) || e?.[campo] || '';
}

function syncAutoGuessUi(e){
    const zona = document.getElementById('zona-autoguess');
    const songInput = document.getElementById('guess-song-input');
    const artistInput = document.getElementById('guess-artist-input');
    const btnGuardar = document.getElementById('btn-check-guess');
    const btnOmitir = document.getElementById('btn-skip-guess');
    const nota = document.getElementById('autoguess-note');
    const respuestaGuardada = !!(e.respuesta_auto?.song_guess || e.respuesta_auto?.artist_guess || e.respuesta_auto?.omitido);

    zona.classList.remove('hidden');
    [songInput, artistInput].forEach((input) => {
        if (!input) return;
        if (input.dataset.rondaId !== String(e.ronda_id || '')) {
            input.value = '';
            input.dataset.rondaId = String(e.ronda_id || '');
        }
        input.disabled = respuestaGuardada;
    });
    if (songInput && e.respuesta_auto?.song_guess && !songInput.value) songInput.value = e.respuesta_auto.song_guess;
    if (artistInput && e.respuesta_auto?.artist_guess && !artistInput.value) artistInput.value = e.respuesta_auto.artist_guess;
    if (btnGuardar) btnGuardar.disabled = respuestaGuardada;
    if (btnOmitir) btnOmitir.disabled = respuestaGuardada;
    if (nota) {
        if (e.respuesta_auto?.song_guess || e.respuesta_auto?.artist_guess) {
            const songPct = Math.max(0, Math.round((Number(e.respuesta_auto.song_score) || 0) * 100));
            const artistPct = Math.max(0, Math.round((Number(e.respuesta_auto.artist_score) || 0) * 100));
            nota.innerText = `${t('status.autoGuessSaved')} / ${t('summary.autoGuessGuessScore', { song: songPct, artist: artistPct })}`;
        } else if (e.respuesta_auto?.omitido) {
            nota.innerText = t('status.autoGuessSkipped');
        } else {
            nota.innerText = t('game.autoGuessHint');
        }
    }
}

function renderEstado(){
    const e = estadoCache;
    const fase = ((salaMetaCache.estado_sala === FASES.LOBBY) || (salaMetaCache.estado_sala === FASES.LISTA)) ? (salaMetaCache.estado_sala) : (e.fase || FASES.LOBBY);
    document.getElementById('faseV').innerText = nombreFase(fase);
    document.getElementById('turnoV').innerText = e.nombre_equipo_turno || e.nombre_turno || (fase === FASES.LOBBY ? t('status.waitingPlayers') : t('game.waiting'));
    const extra = document.getElementById('estadoExtra');
    const resultadoPanel = document.getElementById('resultado-panel');
    const finalPanel = document.getElementById('final-panel');
    const zonaPos = document.getElementById('zona-posicion');
    const zonaRobo = document.getElementById('zona-robo');
    const zonaCancelarRobo = document.getElementById('zona-cancelar-robo');
    const zonaAutoGuess = document.getElementById('zona-autoguess');
    const zonaPasarTurno = document.getElementById('zona-pasar-turno');
    zonaPos.classList.add('hidden');
    zonaRobo.classList.add('hidden');
    zonaCancelarRobo.classList.add('hidden');
    zonaAutoGuess.classList.add('hidden');
    zonaPasarTurno.classList.add('hidden');
    resultadoPanel.classList.add('hidden');
    finalPanel.classList.add('hidden');

    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    if (estadoSala === FASES.LOBBY) {
        updateStatus(t('status.waitingStart'));
        setEleccion('');
        extra.innerText = t('status.playersCanJoin');
        return;
    }
    if (estadoSala === FASES.LISTA) {
        updateStatus(esHost ? t('status.hostStart') : t('status.waitingHostStart'));
        setEleccion('');
        extra.innerText = t('status.roomClosed');
        return;
    }

    const miTeamId = miEquipoId();
    const esMiTurnoEquipo = e.turno_equipo_id === miTeamId;
    const esJugadorActivo = e.turno_de === miId;
    const miEquipo = equipoActivoActual() || {};
    const seleccionTurnoLabel = labelSeleccion(e.seleccion_turno);
    if (seleccionTurnoLabel) setEleccion(t('status.currentSelection', { label: seleccionTurnoLabel }));
    else setEleccion('');

    if (fase === FASES.PRE_RONDA) {
        updateStatus(esMiTurnoEquipo ? t('status.prepareTeamTurn') : t('status.prepareNextSong'));
        extra.innerText = t('status.songStarting');
    }

    if (fase === FASES.JUGANDO) {
        if (esMiTurnoEquipo && esJugadorActivo) {
            updateStatus(e.seleccion_turno ? t('status.choiceSaved') : t('status.yourTeamTurn'));
            extra.innerText = e.seleccion_turno
                ? t('status.othersCanSteal')
                : t('status.placeBeforeReveal', { player: e.nombre_turno || '' });
            dibujarL(miL, { modo: 'turno', disabled: !!e.seleccion_turno, baseYear: baseJugador(miEquipo) });
            if (!e.revelar) syncAutoGuessUi(e);
            if (!e.seleccion_turno && miembrosEquipo(miTeamId).length > 1) zonaPasarTurno.classList.remove('hidden');
        } else if (esMiTurnoEquipo) {
            updateStatus(t('status.teamTurnBy', { team: e.nombre_equipo_turno || '', player: e.nombre_turno || '' }));
            extra.innerText = t('status.waitTeammateChoice');
        } else {
            updateStatus(t('status.turnOfTeam', { team: e.nombre_equipo_turno || '' }));
            extra.innerText = e.seleccion_turno ? t('status.waitStealPhase') : t('status.waitPlayerChoice');
        }
    }

    if (fase === FASES.ESPERA_ROBO) {
        if (esSolitario()) {
            updateStatus(t('status.preparingReveal'));
            extra.innerText = '';
        } else if (esMiTurnoEquipo) {
            updateStatus(esJugadorActivo ? t('status.turnRegistered') : t('status.teamTurnLocked', { player: e.nombre_turno || '' }));
            extra.innerText = t('status.othersDecideSteal');
            if (esJugadorActivo && !e.revelar) syncAutoGuessUi(e);
        } else {
            const miRobo = e.robos?.[miTeamId];
            const lineaTurno = lineaReferenciaEquipo(equipoPorId(e.turno_equipo_id));
            const roboLabel = labelSeleccion(miRobo);
            if (miRobo?.slot || miRobo?.label) {
                updateStatus(t('status.yourTeamSteal', { label: roboLabel }));
                extra.innerText = t('status.stealSaved');
                zonaCancelarRobo.classList.remove('hidden');
            } else if (miRobo?.pagado) {
                updateStatus(t('status.chooseSteal'));
                extra.innerText = t('status.avoidTurnSlot');
                zonaCancelarRobo.classList.remove('hidden');
                dibujarL(lineaTurno, { modo: 'robo', bloqueadoIdx: e.seleccion_turno?.idx, baseYear: baseJugador(equipoPorId(e.turno_equipo_id)) });
            } else if (!lineaTurno.length) {
                updateStatus(t('status.noStealAvailable'));
                extra.innerText = t('status.noBaseToSteal');
            } else if (misT >= 1) {
                updateStatus(t('status.wantSteal'));
                extra.innerText = seleccionTurnoLabel ? t('status.chose', { label: seleccionTurnoLabel }) : '';
                zonaRobo.classList.remove('hidden');
            } else {
                updateStatus(t('status.noTokensSteal'));
                extra.innerText = t('status.needToken');
            }
        }
    }

    if (fase === FASES.REVELANDO || fase === FASES.RESULTADO) {
        const resumenResultado = resumenEstado(e, 'resumen_resultado');
        const resumenVotos = resumenEstado(e, 'resumen_votos');
        resultadoPanel.classList.remove('hidden');
        document.getElementById('resultadoV').innerText = resumenResultado || t('status.reviewingResult');
        renderCancionRevelada(e.cancion_actual);
        updateStatus(resumenResultado || t('status.revealingSong'));
        extra.innerText = resumenVotos ? `${resumenVotos}${esHost ? ' / ' + t('status.pressNext') : ''}` : (esHost ? t('status.pressNext') : t('status.waitingNext'));
    }

    if (fase === FASES.FINAL) {
        finalPanel.classList.remove('hidden');
        document.getElementById('ganadorV').innerText = e.ganador ? t('summary.winner', { name: e.ganador }) : t('status.gameOver');
        updateStatus(e.ganador ? t('summary.winner', { name: e.ganador }) : t('status.gameOver'));
        extra.innerText = t('status.hostReplay');
        document.getElementById('btn-replay').classList.toggle('hidden', !esHost);
    }
}
