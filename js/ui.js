function renderLobby(){
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    const panel = document.getElementById('lobby-panel');
    const btnComenzar = document.getElementById('btn-comenzar');
    const btnIniciar = document.getElementById('btn-iniciar-partida');
    const msg = document.getElementById('lobby-msg');
    panel.classList.toggle('hidden', !(estadoSala === FASES.LOBBY || estadoSala === FASES.LISTA));
    btnComenzar.classList.toggle('hidden', !(esHost && estadoSala === FASES.LOBBY));
    btnIniciar.classList.toggle('hidden', !(esHost && estadoSala === FASES.LISTA));
    btnComenzar.disabled = totalJugadores() < 1;
    btnIniciar.disabled = totalJugadores() < 1;
    if (estadoSala === FASES.LOBBY) {
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
    cont.innerHTML = '';
    Object.entries(jugadoresCache).forEach(([id, j]) => {
        const row = document.createElement('div');
        row.className = 'player-row';
        if (j.conectado === false) row.style.opacity = '0.65';
        const nombre = document.createElement('div');
        const nombreTexto = document.createElement('span');
        nombreTexto.textContent = j.nombre || t('cards.player');
        nombre.appendChild(nombreTexto);
        if (salaMetaCache.host_id === id) {
            const badge = document.createElement('span');
            badge.className = 'host-badge';
            badge.textContent = t('common.host');
            nombre.appendChild(badge);
        }
        if (j.conectado === false) {
            const badge = document.createElement('span');
            badge.className = 'offline-badge';
            badge.textContent = t('common.offline');
            nombre.appendChild(badge);
        }
        const cartas = document.createElement('div');
        pintarStatConIcono(cartas, 'carta', `${cartasJugador(j).length}/${OBJETIVO_CARTAS}`, t('cards.cardsAlt'));
        const tokens = document.createElement('div');
        pintarStatConIcono(tokens, 'moneda', esSolitario() ? '--' : String(j.tokens || 0), t('cards.tokensAlt'));
        row.appendChild(nombre); row.appendChild(cartas); row.appendChild(tokens);
        cont.appendChild(row);
    });
}

function renderMyStats(){
    const yo = jugadoresCache[miId] || {};
    misT = Number(yo.tokens) || 0;
    miCartas = cartasJugador(yo);
    miL = lineaReferenciaJugador(yo);
    document.getElementById('tokensV').innerText = esSolitario() ? '--' : misT;
    document.getElementById('cartasV').innerText = `${miCartas.length}/${OBJETIVO_CARTAS}`;
    document.getElementById('btn-canje').classList.toggle('hidden', esSolitario() || misT < 3 || estadoCache.fase !== FASES.JUGANDO || estadoCache.turno_de !== miId || !!estadoCache.revelar || !!estadoCache.seleccion_turno);
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
    const input = document.getElementById('guess-artist-input');
    const btnGuardar = document.getElementById('btn-check-guess');
    const btnOmitir = document.getElementById('btn-skip-guess');
    const nota = document.getElementById('autoguess-note');
    const respuestaGuardada = !!(e.respuesta_auto?.guess_song || e.respuesta_auto?.omitido);

    if (esSolitario()) {
        zona.classList.add('hidden');
        return;
    }
    zona.classList.remove('hidden');
    if (songInput) {
        if (songInput.dataset.rondaId !== String(e.ronda_id || '')) {
            songInput.value = '';
            songInput.dataset.rondaId = String(e.ronda_id || '');
        }
        if (e.respuesta_auto?.guess_song && !songInput.value) songInput.value = e.respuesta_auto.guess_song;
        songInput.disabled = respuestaGuardada;
    }
    if (input) {
        if (input.dataset.rondaId !== String(e.ronda_id || '')) {
            input.value = '';
            input.dataset.rondaId = String(e.ronda_id || '');
        }
        if (e.respuesta_auto?.guess_artist && !input.value) input.value = e.respuesta_auto.guess_artist;
        input.disabled = respuestaGuardada;
    }
    if (btnGuardar) btnGuardar.disabled = respuestaGuardada;
    if (btnOmitir) btnOmitir.disabled = respuestaGuardada;
    if (nota) {
        if (e.respuesta_auto?.guess_song) {
            nota.innerText = t('status.autoGuessSaved');
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
    document.getElementById('turnoV').innerText = e.nombre_turno || (fase === FASES.LOBBY ? t('status.waitingPlayers') : t('game.waiting'));
    const extra = document.getElementById('estadoExtra');
    const resultadoPanel = document.getElementById('resultado-panel');
    const finalPanel = document.getElementById('final-panel');
    const zonaPos = document.getElementById('zona-posicion');
    const zonaRobo = document.getElementById('zona-robo');
    const zonaCancelarRobo = document.getElementById('zona-cancelar-robo');
    const zonaAutoGuess = document.getElementById('zona-autoguess');
    zonaPos.classList.add('hidden');
    zonaRobo.classList.add('hidden');
    zonaCancelarRobo.classList.add('hidden');
    zonaAutoGuess.classList.add('hidden');
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
    if (seleccionTurnoLabel) setEleccion(t('status.currentSelection', { label: seleccionTurnoLabel }));
    else setEleccion('');

    if (fase === FASES.PRE_RONDA) {
        updateStatus(e.turno_de === miId ? t('status.prepareTurn') : t('status.prepareNextSong'));
        extra.innerText = t('status.songStarting');
    }

    if (fase === FASES.JUGANDO) {
        if (e.turno_de === miId) {
            updateStatus(e.seleccion_turno ? t('status.choiceSaved') : t('status.yourTurn'));
            extra.innerText = e.seleccion_turno ? (puedeBonusMoneda() ? t('status.autoGuessHintBeforeReveal') : '') : t('status.placeBeforeReveal');
            dibujarL(miL, { modo: 'turno', disabled: !!e.seleccion_turno, baseYear: baseJugador(jugadoresCache[miId]) });
            if (!e.revelar && puedeBonusMoneda()) syncAutoGuessUi(e);
        } else {
            updateStatus(t('status.turnOf', { name: e.nombre_turno || '' }));
            extra.innerText = e.seleccion_turno ? t('status.waitStealPhase') : t('status.waitPlayerChoice');
        }
    }

    if (fase === FASES.ESPERA_ROBO) {
        if (esSolitario()) {
            updateStatus(t('status.preparingReveal'));
            extra.innerText = '';
        } else if (e.turno_de === miId) {
            updateStatus(t('status.turnRegistered'));
            extra.innerText = t('status.othersDecideSteal');
            if (!e.revelar && puedeBonusMoneda()) syncAutoGuessUi(e);
        } else {
            const miRobo = e.robos?.[miId];
            const lineaTurno = lineaReferenciaJugador(jugadoresCache[e.turno_de]);
            const roboLabel = labelSeleccion(miRobo);
            if (miRobo?.slot || miRobo?.label) {
                updateStatus(t('status.yourSteal', { label: roboLabel }));
                extra.innerText = t('status.stealSaved');
                zonaCancelarRobo.classList.remove('hidden');
            } else if (miRobo?.pagado) {
                updateStatus(t('status.chooseSteal'));
                extra.innerText = t('status.avoidTurnSlot');
                zonaCancelarRobo.classList.remove('hidden');
                dibujarL(lineaTurno, { modo: 'robo', bloqueadoIdx: e.seleccion_turno?.idx, baseYear: baseJugador(jugadoresCache[e.turno_de]) });
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
