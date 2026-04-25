function equiposActivosEnSala(sala) {
    return equipoOrdenadoLista(sala?.jugadores || {}, sala?.equipos || {});
}

function snapshotTurnoEquipo(sala, teamId, turnoMiembroIdx = null) {
    const players = sala?.jugadores || {};
    const teams = sala?.equipos || {};
    const team = teams[teamId];
    const members = miembrosEquipo(teamId, players);
    if (!team || !members.length) return null;
    const rawIdx = turnoMiembroIdx == null ? (Number(team.turno_miembro_idx) || 0) : (Number(turnoMiembroIdx) || 0);
    const safeIdx = ((rawIdx % members.length) + members.length) % members.length;
    const [playerId, player] = members[safeIdx];
    return {
        teamId,
        team,
        members,
        turnoMiembroIdx: safeIdx,
        playerId,
        playerName: player?.nombre || t('cards.player'),
        teamName: team.nombre || t('teams.teamFallback')
    };
}

function siguienteMiembroEquipo(turnoInfo) {
    if (!turnoInfo?.members?.length) return 0;
    return (Number(turnoInfo.turnoMiembroIdx) + 1) % turnoInfo.members.length;
}

function seleccionarSiguienteEquipoSala(sala) {
    const teams = equiposActivosEnSala(sala);
    if (!teams.length) return null;
    const indiceActual = Number(sala?.indice_turno) || 0;
    const turnoIdx = indiceActual % teams.length;
    const [teamId] = teams[turnoIdx];
    return {
        teamId,
        indiceActual
    };
}

function cancionPayload(cancion) {
    return {
        spotifyId: cancion?.spotifyId || '',
        t: cancion?.titulo || cancion?.t || '',
        a: cancion?.artista || cancion?.a || '',
        y: cancion?.year || cancion?.y || ''
    };
}

function nuevaRondaState(sala, songIndex) {
    const siguienteEquipo = seleccionarSiguienteEquipoSala(sala);
    if (!siguienteEquipo) return null;
    const turnoInfo = snapshotTurnoEquipo(sala, siguienteEquipo.teamId);
    if (!turnoInfo) return null;
    const cancion = CANCIONES[songIndex];
    return {
        indice_turno: siguienteEquipo.indiceActual + 1,
        canciones_usadas: [...(Array.isArray(sala.canciones_usadas) ? sala.canciones_usadas : []), songIndex],
        estado_juego: {
            ...estadoJuegoBase(FASES.JUGANDO),
            fase: FASES.JUGANDO,
            ronda_id: 'r_' + now(),
            cancion_idx: songIndex,
            cancion_actual: cancionPayload(cancion),
            turno_de: turnoInfo.playerId,
            nombre_turno: turnoInfo.playerName,
            turno_equipo_id: turnoInfo.teamId,
            nombre_equipo_turno: turnoInfo.teamName,
            turno_miembro_idx: turnoInfo.turnoMiembroIdx
        }
    };
}

async function comenzarPartida() {
    if (!esHost) return;
    if (!totalJugadores()) return;
    setError('');
    await salaRef().update({
        estado_sala: FASES.LISTA,
        estado_juego: estadoJuegoBase(FASES.LISTA)
    });
}

async function iniciarPartida() {
    if (!esHost) return;
    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    const disponibles = (Array.isArray(CANCIONES) ? CANCIONES : []).map((_, i) => i);
    if (!disponibles.length) return;

    const songIndex = disponibles[Math.floor(Math.random() * disponibles.length)];
    const ronda = nuevaRondaState(sala, songIndex);
    if (!ronda) return;
    const cancion = CANCIONES[songIndex];

    if (cancion?.spotifyId) reproducirSpotify(cancion.spotifyId, true);

    await salaRef().update({
        estado_sala: ESTADO_EN_PARTIDA,
        indice_turno: ronda.indice_turno,
        canciones_usadas: ronda.canciones_usadas,
        estado_juego: ronda.estado_juego
    });
}

function construirLineaVisual(linea) {
    const items = ordenarLineaItems(linea);
    const grupos = [];
    items.forEach((item) => {
        const ultimo = grupos[grupos.length - 1];
        if (ultimo && ultimo.valor === item.y) {
            ultimo.cuenta += 1;
            ultimo.items.push(item);
        } else {
            grupos.push({ valor: item.y, cuenta: 1, items: [item] });
        }
    });
    if (!grupos.length) {
        return {
            grupos,
            slots: [{ left: null, right: null, label: t('slot.firstCardLabel') }]
        };
    }
    const slots = grupos.map((g, i) => ({
        left: i === 0 ? null : grupos[i - 1].valor,
        right: g.valor,
        label: i === 0
            ? t('slot.beforeLabel', { right: g.valor })
            : t('slot.betweenLabel', { left: grupos[i - 1].valor, right: g.valor })
    }));
    slots.push({
        left: grupos[grupos.length - 1].valor,
        right: null,
        label: t('slot.afterLabel', { left: grupos[grupos.length - 1].valor })
    });
    return { grupos, slots };
}

function slotPartes(slot) {
    if (slot.left == null && slot.right == null) return { main: t('slot.firstMain'), range: t('slot.cardRange') };
    if (slot.left == null) return { main: t('slot.beforeMain'), range: String(slot.right) };
    if (slot.right == null) return { main: t('slot.afterMain'), range: String(slot.left) };
    return { main: t('slot.betweenMain'), range: `${slot.left} - ${slot.right}` };
}

function crearBotonSlot(slot, idx, opciones) {
    const btn = document.createElement('button');
    btn.className = 'btn-grey slot-btn timeline-slot';

    const main = document.createElement('span');
    main.className = 'slot-main';
    const range = document.createElement('span');
    range.className = 'slot-range';

    if (opciones.disabled) {
        const partes = slotPartes(slot);
        main.textContent = partes.main;
        range.textContent = partes.range;
        btn.disabled = true;
    } else if (opciones.modo === 'robo' && idx === opciones.bloqueadoIdx) {
        main.textContent = t('slot.occupied');
        range.textContent = t('slot.turn');
        btn.disabled = true;
        btn.classList.add('bloqueado');
    } else {
        const partes = slotPartes(slot);
        main.textContent = partes.main;
        range.textContent = partes.range;
        btn.onclick = () => colocar(slot, idx, opciones.modo || 'turno');
    }

    btn.appendChild(main);
    btn.appendChild(range);
    return btn;
}

function crearCartaAnio(item) {
    const carta = normalizarCarta(item);
    if (!carta) return document.createElement('div');
    const y = document.createElement('div');
    y.className = 'timeline-year';
    y.style.setProperty('--decade-rgb', colorDecada(carta.y));
    if (carta.base) {
        y.classList.add('base-year');
        const label = document.createElement('span');
        label.className = 'base-year-label';
        label.textContent = t('cards.base');
        y.appendChild(label);

        const year = document.createElement('span');
        year.className = 'timeline-card-year';
        year.textContent = String(carta.y);
        y.appendChild(year);
        return y;
    }

    const title = document.createElement('span');
    title.className = 'timeline-card-title';
    title.textContent = carta.t || t('cards.previous');

    const year = document.createElement('span');
    year.className = 'timeline-card-year';
    year.textContent = String(carta.y);

    const artist = document.createElement('span');
    artist.className = 'timeline-card-artist';
    artist.textContent = carta.a || t('cards.noData');

    y.appendChild(title);
    y.appendChild(year);
    y.appendChild(artist);
    return y;
}

function dibujarL(linea, opciones = {}) {
    const cont = document.getElementById('zona-posicion');
    const { grupos, slots } = construirLineaVisual(linea);
    if (!slots.length) return cont.classList.add('hidden');
    cont.classList.remove('hidden');
    cont.innerHTML = '';
    const scroll = document.createElement('div');
    scroll.className = 'timeline-scroll';
    const track = document.createElement('div');
    track.className = `timeline-track ${grupos.length ? '' : 'empty-track'}`.trim();
    scroll.appendChild(track);

    slots.forEach((slot, i) => {
        const slotCell = document.createElement('div');
        slotCell.className = 'slot-cell';
        slotCell.appendChild(crearBotonSlot(slot, i, opciones));
        track.appendChild(slotCell);

        if (i < grupos.length) {
            const wrap = document.createElement('div');
            wrap.className = 'timeline-year-cluster';
            grupos[i].items.forEach((item) => wrap.appendChild(crearCartaAnio(item)));
            track.appendChild(wrap);
        }
    });
    cont.appendChild(scroll);
}

async function pasarTurnoCompanero() {
    const e = estadoCache || {};
    const teamId = miEquipoId();
    if (!teamId || e.fase !== FASES.JUGANDO || e.turno_equipo_id !== teamId || e.seleccion_turno) return;

    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    const turnoActual = snapshotTurnoEquipo(sala, teamId, e.turno_miembro_idx);
    if (!turnoActual || turnoActual.members.length < 2) return;
    const siguienteIdx = siguienteMiembroEquipo(turnoActual);
    const siguiente = snapshotTurnoEquipo(sala, teamId, siguienteIdx);
    if (!siguiente) return;

    await salaRef().child('estado_juego').update({
        turno_de: siguiente.playerId,
        nombre_turno: siguiente.playerName,
        turno_miembro_idx: siguiente.turnoMiembroIdx
    });
    updateStatus(t('status.turnPassed', { player: siguiente.playerName }));
}

async function colocar(slot, idx, modo = 'turno') {
    const e = estadoCache || {};
    const teamId = miEquipoId();
    if (!e.ronda_id || !teamId) return;

    if (modo === 'robo') {
        if (teamId === e.turno_equipo_id) return;
        if (!e.robos?.[teamId]?.pagado) return;
        if (idx === e.seleccion_turno?.idx) return;
        await salaRef().child(`estado_juego/robos/${teamId}`).update({
            idx,
            label: slot.label,
            slot,
            playerId: miId,
            playerName: nombreJugador(miId),
            teamId,
            teamName: nombreMiEquipo()
        });
        updateStatus(t('status.yourTeamSteal', { label: slotLabel(slot) || slot.label }));
        return;
    }

    if (e.turno_equipo_id !== teamId || e.turno_de !== miId || e.seleccion_turno) return;
    const updates = {
        'estado_juego/seleccion_turno': {
            idx,
            label: slot.label,
            slot,
            playerId: miId,
            playerName: nombreJugador(miId),
            teamId,
            teamName: nombreMiEquipo()
        }
    };
    if (!esSolitario()) updates['estado_juego/fase'] = FASES.ESPERA_ROBO;
    await salaRef().update(updates);
    updateStatus(t('status.choiceSaved'));
}

async function intentarRobar() {
    const teamId = miEquipoId();
    if (!teamId || misT < 1 || esSolitario()) return;
    const e = estadoCache || {};
    if (!e || e.fase !== FASES.ESPERA_ROBO || !e.seleccion_turno || e.turno_equipo_id === teamId || e.robos?.[teamId]) return;
    const lineaTurno = lineaReferenciaEquipo(equipoPorId(e.turno_equipo_id));
    if (!lineaTurno.length) return updateStatus(t('status.noLineToSteal'));

    const roboRef = salaRef().child(`estado_juego/robos/${teamId}`);
    const creado = now();
    const reserva = 'reserva_' + creado;
    const reservaTx = await roboRef.transaction((actual) => {
        if (actual) return actual;
        return {
            pagado: false,
            ronda_id: e.ronda_id,
            reserva,
            creado,
            teamId,
            teamName: nombreMiEquipo(),
            playerId: miId,
            playerName: nombreJugador(miId)
        };
    });
    if (!reservaTx.committed) return;

    const tokenTx = await salaRef().child(`equipos/${teamId}/tokens`).transaction((value) => {
        const actuales = Number(value) || 0;
        if (actuales < 1) return;
        return actuales - 1;
    });
    if (!tokenTx.committed) {
        await roboRef.remove();
        updateStatus(t('status.noTokensSteal'));
        return;
    }

    await roboRef.update({ pagado: true });
}

async function cancelarRobo() {
    const e = estadoCache || {};
    const teamId = miEquipoId();
    if (!teamId || e.fase !== FASES.ESPERA_ROBO || e.turno_equipo_id === teamId) return;
    const miRobo = e.robos?.[teamId];
    if (!miRobo?.pagado) return;

    const roboRef = salaRef().child(`estado_juego/robos/${teamId}`);
    const cancelTx = await roboRef.transaction((actual) => {
        if (!actual || !actual.pagado || actual.ronda_id !== e.ronda_id) return;
        return null;
    });
    if (!cancelTx.committed) return;

    await salaRef().child(`equipos/${teamId}/tokens`).transaction((value) => {
        return Math.min(MAX_TOKENS, (Number(value) || 0) + 1);
    });
    updateStatus(t('status.stealCancelled'));
}

async function comprarCarta() {
    const teamId = miEquipoId();
    if (!teamId || misT < 3 || esSolitario()) return;
    const e = estadoCache || {};
    if (!e.cancion_actual || e.turno_equipo_id !== teamId || e.turno_de !== miId || e.fase !== FASES.JUGANDO || e.seleccion_turno) return;

    const carta = cartaDesdeCancion(e.cancion_actual);
    if (!carta) return;

    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    const team = equipoPorId(teamId, sala.equipos || {});
    const turnoInfo = snapshotTurnoEquipo(sala, teamId, e.turno_miembro_idx);
    const nuevaLinea = ordenarCartas([...(cartasEquipo(team) || []), carta]);
    const gano = nuevaLinea.length >= OBJETIVO_CARTAS;
    const teamName = nombreEquipo(teamId, sala.equipos || {});
    const resumenI18n = { key: 'summary.exchangedCard', params: { name: teamName } };

    await salaRef().update({
        [`equipos/${teamId}/tokens`]: Math.max(0, misT - 3),
        [`equipos/${teamId}/linea`]: nuevaLinea,
        [`equipos/${teamId}/turno_miembro_idx`]: turnoInfo ? siguienteMiembroEquipo(turnoInfo) : 0,
        'estado_juego/fase': gano ? FASES.FINAL : FASES.RESULTADO,
        'estado_juego/revelar': true,
        'estado_juego/seleccion_turno': {
            label: t('summary.exchangedSelection'),
            canjeado: true,
            playerId: miId,
            playerName: nombreJugador(miId),
            teamId,
            teamName
        },
        'estado_juego/resumen_resultado': textoI18n(resumenI18n),
        'estado_juego/resumen_resultado_i18n': resumenI18n,
        'estado_juego/resumen_votos': '',
        'estado_juego/resumen_votos_i18n': null,
        'estado_juego/ganador': gano ? teamName : '',
        'estado_juego/cierre_fase_en': 0
    });
}

function respuestaAutoBloqueada(respuestaAuto) {
    return !!(respuestaAuto?.song_guess || respuestaAuto?.artist_guess || respuestaAuto?.omitido);
}

async function enviarRespuestaAuto() {
    const e = estadoCache || {};
    const teamId = miEquipoId();
    if ((e.fase !== FASES.JUGANDO && e.fase !== FASES.ESPERA_ROBO) || e.turno_equipo_id !== teamId || e.turno_de !== miId || !e.cancion_actual || e.revelar) return;
    if (respuestaAutoBloqueada(e.respuesta_auto)) return;

    const songInput = document.getElementById('guess-song-input');
    const artistInput = document.getElementById('guess-artist-input');
    const songGuess = songInput?.value.trim() || '';
    const artistGuess = artistInput?.value.trim() || '';
    if (!songGuess || !artistGuess) return updateStatus(t('status.autoGuessNeedBoth'));

    const revision = verificarRespuestaCompleta(songGuess, artistGuess, e.cancion_actual);
    const songPct = Math.max(0, Math.round(revision.songScore * 100));
    const artistPct = Math.max(0, Math.round(revision.artistScore * 100));
    await salaRef().child('estado_juego/respuesta_auto').set({
        song_guess: songGuess,
        artist_guess: artistGuess,
        song_score: revision.songScore,
        artist_score: revision.artistScore,
        correcto: revision.correcto,
        revisado_en: now(),
        playerId: miId,
        teamId
    });

    updateStatus(t('status.autoGuessSaved'));
    const note = document.getElementById('autoguess-note');
    if (note) note.innerText = `${t('status.autoGuessSaved')} / ${t('summary.autoGuessGuessScore', { song: songPct, artist: artistPct })}`;
    [songInput, artistInput].forEach((input) => {
        if (input) input.disabled = true;
    });
    const btnGuardar = document.getElementById('btn-check-guess');
    const btnOmitir = document.getElementById('btn-skip-guess');
    if (btnGuardar) btnGuardar.disabled = true;
    if (btnOmitir) btnOmitir.disabled = true;
}

async function omitirRespuestaAuto(sala) {
    const e = sala.estado_juego || {};
    const teamId = miEquipoId();
    if ((e.fase !== FASES.JUGANDO && e.fase !== FASES.ESPERA_ROBO) || e.turno_equipo_id !== teamId || e.turno_de !== miId) return;
    if (respuestaAutoBloqueada(e.respuesta_auto)) return;
    await salaRef().child('estado_juego/respuesta_auto').set({
        correcto: false,
        omitido: true,
        revisado_en: now(),
        playerId: miId,
        teamId
    });
}

async function omitirRespuestaAutoManual() {
    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    const e = sala.estado_juego || {};
    const teamId = miEquipoId();
    if ((e.fase !== FASES.JUGANDO && e.fase !== FASES.ESPERA_ROBO) || e.turno_equipo_id !== teamId || e.turno_de !== miId) return;
    if (respuestaAutoBloqueada(e.respuesta_auto)) return;

    await omitirRespuestaAuto(sala);
    const songInput = document.getElementById('guess-song-input');
    const artistInput = document.getElementById('guess-artist-input');
    [songInput, artistInput].forEach((input) => {
        if (!input) return;
        input.value = '';
        input.disabled = true;
    });
    const btnGuardar = document.getElementById('btn-check-guess');
    const btnOmitir = document.getElementById('btn-skip-guess');
    if (btnGuardar) btnGuardar.disabled = true;
    if (btnOmitir) btnOmitir.disabled = true;
    updateStatus(t('status.autoGuessSkipped'));
    const note = document.getElementById('autoguess-note');
    if (note) note.innerText = t('status.autoGuessSkipped');
}

function colocacionEsValida(year, slot) {
    if (!slot) return false;
    const left = slot.left ?? null;
    const right = slot.right ?? null;
    if (left == null && right == null) return true;
    if (left == null) return year <= right;
    if (right == null) return year >= left;
    return year >= left && year <= right;
}

async function revelarCancion() {
    if (!esHost) return;
    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    const e = sala.estado_juego || {};
    const estadoSala = sala.estado_sala || FASES.LOBBY;
    if (estadoSala !== ESTADO_EN_PARTIDA || !e.cancion_actual) return;
    if (e.fase !== FASES.JUGANDO && e.fase !== FASES.ESPERA_ROBO) return;
    await resolverRevelacion(sala);
}

async function siguienteCancion() {
    if (!esHost) return;
    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    const e = sala.estado_juego || {};
    const estadoSala = sala.estado_sala || FASES.LOBBY;
    if (estadoSala !== ESTADO_EN_PARTIDA) return;
    if (e.fase !== FASES.RESULTADO && e.fase !== FASES.REVELANDO) return;
    await siguienteRondaOSalida(sala);
}

async function prepararRonda(sala) {
    const usadas = Array.isArray(sala.canciones_usadas) ? sala.canciones_usadas : [];
    const disponibles = (Array.isArray(CANCIONES) ? CANCIONES : []).map((_, i) => i).filter((i) => !usadas.includes(i));
    if (!disponibles.length) {
        return salaRef().child('estado_juego').update({
            fase: FASES.FINAL,
            cierre_fase_en: 0,
            ganador: ''
        });
    }

    const songIndex = disponibles[Math.floor(Math.random() * disponibles.length)];
    const salaConUsadas = {
        ...sala,
        canciones_usadas: usadas
    };
    const ronda = nuevaRondaState(salaConUsadas, songIndex);
    if (!ronda) return;
    const cancion = CANCIONES[songIndex];

    await salaRef().update({
        indice_turno: ronda.indice_turno,
        canciones_usadas: ronda.canciones_usadas,
        estado_juego: ronda.estado_juego
    });
    if (cancion?.spotifyId) reproducirSpotify(cancion.spotifyId, true);
}

async function resolverRevelacion(sala) {
    const e = sala.estado_juego || {};
    const players = sala.jugadores || {};
    const teams = sala.equipos || {};
    const cartaActual = cartaDesdeCancion(e.cancion_actual);
    if (!cartaActual || !e.turno_equipo_id) return;

    const year = Number(cartaActual.y);
    const lineas = {};
    const referencias = {};
    Object.keys(teams).forEach((teamId) => {
        if (!miembrosEquipo(teamId, players).length) return;
        lineas[teamId] = cartasEquipo(teams[teamId]);
        referencias[teamId] = lineaReferenciaEquipo(teams[teamId]);
    });

    const teamTurnName = nombreEquipo(e.turno_equipo_id, teams);
    const intentoTurno = referencias[e.turno_equipo_id]
        && e.seleccion_turno
        && !e.seleccion_turno.canjeado
        && colocacionEsValida(year, e.seleccion_turno.slot)
        ? { id: e.turno_equipo_id, name: teamTurnName, tipo: 'turno' }
        : null;

    const robosCorrectos = Object.entries(e.robos || {})
        .filter(([teamId, robo]) => teamId !== e.turno_equipo_id && referencias[teamId] && robo?.pagado && robo?.slot && colocacionEsValida(year, robo.slot))
        .sort(([, a], [, b]) => (Number(a.creado) || 0) - (Number(b.creado) || 0))
        .map(([teamId]) => ({ id: teamId, name: nombreEquipo(teamId, teams), tipo: 'robo' }));

    const ganadorCarta = intentoTurno || robosCorrectos[0] || null;
    if (ganadorCarta) {
        lineas[ganadorCarta.id].push(cartaActual);
        lineas[ganadorCarta.id] = ordenarCartas(lineas[ganadorCarta.id]);
    }

    const updates = {};
    let ganador = '';
    Object.entries(lineas).forEach(([teamId, linea]) => {
        updates[`equipos/${teamId}/linea`] = linea;
        if (!ganador && linea.length >= OBJETIVO_CARTAS) ganador = nombreEquipo(teamId, teams);
    });

    const resumenCartaI18n = ganadorCarta
        ? { key: ganadorCarta.tipo === 'robo' ? 'summary.cardForRobbery' : 'summary.cardFor', params: { name: ganadorCarta.name } }
        : { key: 'summary.noCard', params: {} };

    const respuestaAuto = e.respuesta_auto || null;
    let respuestaAutoActualizada = respuestaAuto;
    let resumenVotosTexto = '';
    let resumenVotosI18n = null;
    const teamTokens = Number(teams[e.turno_equipo_id]?.tokens) || 0;

    if (respuestaAuto?.song_guess || respuestaAuto?.artist_guess) {
        const revision = verificarRespuestaCompleta(respuestaAuto.song_guess || '', respuestaAuto.artist_guess || '', e.cancion_actual);
        const songPct = Math.max(0, Math.round(revision.songScore * 100));
        const artistPct = Math.max(0, Math.round(revision.artistScore * 100));
        const detallePctI18n = { key: 'summary.autoGuessGuessScore', params: { song: songPct, artist: artistPct } };

        if (revision.correcto && !esSolitario() && teamTokens < MAX_TOKENS) {
            updates[`equipos/${e.turno_equipo_id}/tokens`] = Math.min(MAX_TOKENS, teamTokens + 1);
            resumenVotosI18n = { key: 'summary.autoGuessCorrectToken', params: { name: teamTurnName } };
        } else if (revision.correcto && esSolitario()) {
            resumenVotosI18n = { key: 'summary.autoGuessCorrectSolo', params: {} };
        } else if (revision.correcto) {
            resumenVotosI18n = { key: 'summary.autoGuessCorrectMax', params: {} };
        } else {
            resumenVotosI18n = { key: 'summary.autoGuessWrong', params: {} };
        }

        respuestaAutoActualizada = {
            ...respuestaAuto,
            song_score: revision.songScore,
            artist_score: revision.artistScore,
            correcto: revision.correcto
        };
        resumenVotosTexto = `${textoI18n(resumenVotosI18n)} / ${textoI18n(detallePctI18n)}`;
    } else if (respuestaAuto?.omitido) {
        resumenVotosI18n = { key: 'summary.autoGuessSkipped', params: {} };
    } else {
        resumenVotosI18n = { key: 'summary.autoGuessMissing', params: {} };
    }

    const turnoInfo = snapshotTurnoEquipo(sala, e.turno_equipo_id, e.turno_miembro_idx);
    if (turnoInfo) {
        updates[`equipos/${e.turno_equipo_id}/turno_miembro_idx`] = siguienteMiembroEquipo(turnoInfo);
    }

    updates.estado_juego = {
        ...e,
        fase: ganador ? FASES.FINAL : FASES.RESULTADO,
        cierre_fase_en: 0,
        revelar: true,
        respuesta_auto: respuestaAutoActualizada,
        resumen_resultado: textoI18n(resumenCartaI18n),
        resumen_resultado_i18n: resumenCartaI18n,
        resumen_votos: resumenVotosTexto || (resumenVotosI18n ? textoI18n(resumenVotosI18n) : ''),
        resumen_votos_i18n: resumenVotosTexto ? null : resumenVotosI18n,
        ganador
    };

    await salaRef().update(updates);
}

async function siguienteRondaOSalida(sala) {
    const e = sala.estado_juego || {};
    if (e.ganador) {
        await salaRef().child('estado_juego').update({ fase: FASES.FINAL, cierre_fase_en: 0 });
        return;
    }
    await prepararRonda(sala);
}

async function volverAJugar() {
    if (!esHost) return;
    const updates = {
        estado_sala: FASES.LOBBY,
        indice_turno: 0,
        canciones_usadas: [],
        estado_juego: estadoJuegoBase(FASES.LOBBY)
    };

    Object.entries(salaMetaCache.equipos || {}).forEach(([teamId]) => {
        updates[`equipos/${teamId}/tokens`] = 3;
        updates[`equipos/${teamId}/base`] = randomDecadaInicial();
        updates[`equipos/${teamId}/linea`] = [];
        updates[`equipos/${teamId}/turno_miembro_idx`] = 0;
    });
    await salaRef().update(updates);
}

async function salirDeSala() {
    if (!confirm(t('confirm.leave'))) return;

    const salaSalir = salaA;
    const idSalir = miId;
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    const puedeQuitarJugador = estadoSala === FASES.LOBBY || estadoSala === FASES.LISTA;
    const teamIdSalir = jugadoresCache[idSalir]?.team_id || '';

    if (activeSalaListenerRef) activeSalaListenerRef.off('value');
    try {
        if (salaSalir && idSalir) {
            const refSala = db.ref(`salas/${salaSalir}`);
            const restantes = Object.keys(jugadoresCache || {}).filter((id) => id !== idSalir);

            if (puedeQuitarJugador) {
                if (!restantes.length) {
                    await refSala.remove();
                } else {
                    const updates = {
                        [`jugadores/${idSalir}`]: null
                    };
                    if (esHost) updates.host_id = restantes[0];
                    const quedanEnEquipo = restantes.some((id) => jugadoresCache[id]?.team_id === teamIdSalir);
                    if (teamIdSalir && !quedanEnEquipo) updates[`equipos/${teamIdSalir}`] = null;
                    await refSala.update(updates);
                }
            } else {
                const updates = {
                    [`jugadores/${idSalir}/conectado`]: false,
                    [`jugadores/${idSalir}/ultimaConexion`]: firebase.database.ServerValue.TIMESTAMP
                };
                if (esHost && restantes.length) updates.host_id = restantes[0];
                await refSala.update(updates);
            }
        }
    } catch (_) {}

    clearStoredPlayerId(salaSalir);
    localStorage.removeItem('hitster_nombre');
    window.location.href = window.location.pathname;
}
