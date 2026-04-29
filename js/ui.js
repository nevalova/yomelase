function renderLobby() {
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    const panel = document.getElementById('lobby-panel');
    const btnComenzar = document.getElementById('btn-comenzar');
    const btnIniciar = document.getElementById('btn-iniciar-partida');
    const msg = document.getElementById('lobby-msg');
    const playersValue = document.getElementById('playersCountV');

    panel.classList.toggle('hidden', !(estadoSala === FASES.LOBBY || estadoSala === FASES.LISTA));
    btnComenzar.classList.toggle('hidden', !(esHost && estadoSala === FASES.LOBBY));
    btnIniciar.classList.toggle('hidden', !(esHost && estadoSala === FASES.LISTA));
    btnComenzar.disabled = totalJugadores() < 1;
    btnIniciar.disabled = totalJugadores() < 1;
    if (playersValue) playersValue.innerText = `${totalJugadores()}/${MAX_JUGADORES}`;

    if (estadoSala === FASES.LOBBY) {
        msg.innerText = esHost ? t('lobby.hostOpen') : t('lobby.guestOpen');
    } else if (estadoSala === FASES.LISTA) {
        msg.innerText = esHost ? t('lobby.hostReady') : t('lobby.guestReady');
    } else {
        msg.innerText = '';
    }

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

function renderBadge(contenedor, className, text) {
    const badge = document.createElement('span');
    badge.className = className;
    badge.textContent = text;
    contenedor.appendChild(badge);
}

function renderSoloCard(playerId, player, options = {}) {
    const card = document.createElement('div');
    card.className = 'solo-card';
    if (options.active) card.classList.add('active-team');
    if (options.turn) card.classList.add('turn-team');
    if (player?.conectado === false) card.classList.add('offline-card');

    const header = document.createElement('div');
    header.className = 'team-header';

    const copy = document.createElement('div');
    copy.className = 'solo-name-wrap';
    const name = document.createElement('div');
    name.className = 'team-name';
    name.textContent = player?.nombre || t('cards.player');
    copy.appendChild(name);

    const sub = document.createElement('div');
    sub.className = 'team-sub';
    sub.textContent = t('teams.soloWaiting');
    copy.appendChild(sub);

    if (salaMetaCache.host_id === playerId) renderBadge(copy, 'host-badge', t('common.host'));
    if (player?.conectado === false) renderBadge(copy, 'offline-badge', t('common.offline'));

    const stats = document.createElement('div');
    stats.className = 'team-stats';
    const cards = document.createElement('div');
    pintarStatConIcono(cards, 'carta', `${cartasJugador(player).length}/${OBJETIVO_CARTAS}`, t('cards.cardsAlt'));
    const tokens = document.createElement('div');
    pintarStatConIcono(tokens, 'moneda', esSolitario() ? '--' : String(Number(player?.tokens) || 0), t('cards.tokensAlt'));
    stats.appendChild(cards);
    stats.appendChild(tokens);

    header.appendChild(copy);
    header.appendChild(stats);
    card.appendChild(header);

    const foot = document.createElement('div');
    foot.className = 'team-sub solo-sub';
    foot.textContent = options.isMe ? t('teams.soloBadge') : t('teams.soloWaiting');
    card.appendChild(foot);

    return card;
}

function renderTeamCard(entity, enLobbyEditable, miTeamId, turnoEntity) {
    const { id: teamId, data: team, members, colorRgb } = entity;
    const card = document.createElement('div');
    card.className = 'team-card';
    card.style.setProperty('--team-rgb', colorRgb || '68, 244, 255');
    if (teamId === miTeamId) card.classList.add('active-team');
    if (turnoEntity && turnoEntity.type === 'team' && turnoEntity.id === teamId) card.classList.add('turn-team');

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
    pintarStatConIcono(cards, 'carta', `${cartasEntidad(team).length}/${OBJETIVO_CARTAS}`, t('cards.cardsAlt'));
    const tokens = document.createElement('div');
    pintarStatConIcono(tokens, 'moneda', esSolitario() ? '--' : String(Number(team?.tokens) || 0), t('cards.tokensAlt'));
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
        if (turnoEntity && turnoEntity.type === 'team' && turnoEntity.id === teamId && estadoCache.turno_de === playerId) {
            chip.classList.add('active-player');
        }
        if (player?.conectado === false) chip.classList.add('offline-player');
        chip.style.setProperty('--team-rgb', colorRgb || '68, 244, 255');
        chip.textContent = player?.nombre || t('cards.player');
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
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    const enLobbyEditable = lobbyEditable(estadoSala);
    const miTeamId = miEquipoId();
    const turnoEntity = entidadPorTurno(estadoCache);
    const entities = entidadesActivasLista();
    const activeTeams = totalEquiposActivos();

    if (title) title.innerText = enLobbyEditable ? t('game.teams') : t('game.scoreboard');
    if (btnCrearEquipo) btnCrearEquipo.classList.toggle('hidden', !enLobbyEditable);
    if (note) {
        note.classList.remove('hidden');
        note.innerText = activeTeams
            ? (enLobbyEditable
                ? t('teams.lobbyNote', { players: totalJugadores(), maxPlayers: MAX_JUGADORES, teams: activeTeams, maxTeams: MAX_EQUIPOS })
                : t('teams.gameNote', { teams: entities.length }))
            : t('teams.lobbySoloNote', { players: totalJugadores(), maxPlayers: MAX_JUGADORES });
    }

    cont.innerHTML = '';
    entities.forEach((entity) => {
        if (entity.type === 'team') {
            cont.appendChild(renderTeamCard(entity, enLobbyEditable, miTeamId, turnoEntity));
        } else {
            const card = renderSoloCard(entity.id, entity.data, {
                active: entityDeJugador(miId)?.key === entity.key,
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

    const esTurnoMio = miEntidad && estadoCache.turno_entidad_tipo === miEntidad.type && estadoCache.turno_entidad_id === miEntidad.id && estadoCache.turno_de === miId;
    document.getElementById('btn-canje').classList.toggle(
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

    const seleccionTurnoLabel = labelSeleccion(e.seleccion_turno);
    setEleccion(seleccionTurnoLabel ? t('status.currentSelection', { label: seleccionTurnoLabel }) : '');

    if (fase === FASES.PRE_RONDA) {
        updateStatus(esMiTurnoEntidad ? (miEntidad?.type === 'team' ? t('status.prepareTeamTurn') : t('status.prepareTurn')) : t('status.prepareNextSong'));
        extra.innerText = t('status.songStarting');
    }

    if (fase === FASES.JUGANDO) {
        if (esMiTurnoEntidad && esJugadorActivo) {
            updateStatus(e.seleccion_turno ? t('status.choiceSaved') : (miEntidad?.type === 'team' ? t('status.yourTeamTurn') : t('status.yourTurn')));
            extra.innerText = e.seleccion_turno ? t('status.othersCanSteal') : t('status.placeBeforeReveal');
            dibujarL(miL, { modo: 'turno', disabled: !!e.seleccion_turno });
            if (!e.revelar && puedeBonusMoneda()) syncAutoGuessUi(e);
            if (miEntidad?.type === 'team' && (miEntidad.members?.length || 0) > 1 && !e.seleccion_turno) {
                zonaPasarTurno.classList.remove('hidden');
            }
        } else if (esMiTurnoEntidad) {
            updateStatus(t('status.teamTurnBy', { team: e.nombre_entidad_turno || '', player: e.nombre_turno || '' }));
            extra.innerText = t('status.waitTeammateChoice');
        } else {
            updateStatus(t('status.turnOf', { name: e.nombre_entidad_turno || e.nombre_turno || '' }));
            extra.innerText = e.seleccion_turno ? t('status.waitStealPhase') : t('status.waitPlayerChoice');
        }
    }

    if (fase === FASES.ESPERA_ROBO) {
        if (esSolitario()) {
            updateStatus(t('status.preparingReveal'));
            extra.innerText = '';
        } else if (esMiTurnoEntidad) {
            updateStatus(esJugadorActivo ? t('status.turnRegistered') : t('status.entityTurnLocked', { player: e.nombre_turno || '' }));
            extra.innerText = t('status.othersDecideSteal');
            if (esJugadorActivo && !e.revelar && puedeBonusMoneda()) syncAutoGuessUi(e);
        } else if (miEntidad) {
            const miRobo = e.robos?.[miEntidad.key];
            const roboLabel = labelSeleccion(miRobo);
            if (miRobo?.slot || miRobo?.label) {
                updateStatus(t('status.yourSteal', { label: roboLabel }));
                extra.innerText = t('status.stealSaved');
                zonaCancelarRobo.classList.remove('hidden');
            } else if (miRobo?.pagado) {
                updateStatus(t('status.chooseSteal'));
                extra.innerText = t('status.avoidTurnSlot');
                zonaCancelarRobo.classList.remove('hidden');
                dibujarL(lineaReferenciaEntidad(turnoEntidad?.data || {}), { modo: 'robo', bloqueadoIdx: e.seleccion_turno?.idx });
            } else if (!lineaReferenciaEntidad(turnoEntidad?.data || {}).length) {
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
        renderFinalSummary();
        updateStatus(e.ganador ? t('summary.winner', { name: e.ganador }) : t('status.gameOver'));
        extra.innerText = t('status.hostReplay');
        document.getElementById('btn-replay').classList.toggle('hidden', !esHost);
    }
}
