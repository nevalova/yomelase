function entidadesActivasEnSala(sala) {
    return entidadesActivasLista(sala?.jugadores || {}, sala?.equipos || {});
}

function snapshotTurnoEntidad(sala, entityType, entityId, turnoMiembroIdx = null) {
    const players = sala?.jugadores || {};
    const teams = sala?.equipos || {};
    if (entityType === 'team') {
        const team = teams[entityId];
        const members = miembrosEquipo(entityId, players);
        if (!team || !members.length) return null;
        const rawIdx = turnoMiembroIdx == null ? (Number(team.turno_miembro_idx) || 0) : (Number(turnoMiembroIdx) || 0);
        const safeIdx = ((rawIdx % members.length) + members.length) % members.length;
        const [playerId, player] = members[safeIdx];
        return {
            entityType: 'team',
            entityId,
            entityKey: entidadKey('team', entityId),
            entityName: team.nombre || t('teams.teamFallback'),
            entityData: team,
            members,
            turnoMiembroIdx: safeIdx,
            playerId,
            playerName: player?.nombre || t('cards.player')
        };
    }

    const player = players[entityId];
    if (!player) return null;
    return {
        entityType: 'player',
        entityId,
        entityKey: entidadKey('player', entityId),
        entityName: player.nombre || t('cards.player'),
        entityData: player,
        members: [[entityId, player]],
        turnoMiembroIdx: 0,
        playerId: entityId,
        playerName: player.nombre || t('cards.player')
    };
}

function siguienteMiembroEntidad(turnoInfo) {
    if (!turnoInfo?.members?.length) return 0;
    return (Number(turnoInfo.turnoMiembroIdx) + 1) % turnoInfo.members.length;
}

function seleccionarSiguienteEntidadSala(sala) {
    const entities = entidadesActivasEnSala(sala);
    if (!entities.length) return null;
    const indiceActual = Number(sala?.indice_turno) || 0;
    const turnoIdx = indiceActual % entities.length;
    const entity = entities[turnoIdx];
    return {
        entity,
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
    const siguiente = seleccionarSiguienteEntidadSala(sala);
    if (!siguiente?.entity) return null;
    const turnoInfo = snapshotTurnoEntidad(sala, siguiente.entity.type, siguiente.entity.id);
    if (!turnoInfo) return null;
    const cancion = CANCIONES[songIndex];
    return {
        indice_turno: siguiente.indiceActual + 1,
        canciones_usadas: [...(Array.isArray(sala.canciones_usadas) ? sala.canciones_usadas : []), songIndex],
        estado_juego: {
            ...estadoJuegoBase(FASES.JUGANDO),
            fase: FASES.JUGANDO,
            ronda_id: `r_${now()}`,
            cancion_idx: songIndex,
            cancion_actual: cancionPayload(cancion),
            turno_de: turnoInfo.playerId,
            nombre_turno: turnoInfo.playerName,
            turno_entidad_tipo: turnoInfo.entityType,
            turno_entidad_id: turnoInfo.entityId,
            nombre_entidad_turno: turnoInfo.entityName,
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
        label: i === 0 ? t('slot.beforeLabel', { right: g.valor }) : t('slot.betweenLabel', { left: grupos[i - 1].valor, right: g.valor })
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
    return { main: t('slot.betweenMain'), range: `${slot.left} · ${slot.right}` };
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
    const hint = document.createElement('div');
    hint.className = 'timeline-hint';
    hint.textContent = opciones.modo === 'robo' ? t('game.timelineStealHint') : t('game.timelineTurnHint');
    cont.appendChild(hint);
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
    const miEntidad = entidadDeJugador(miId);
    if (!miEntidad || miEntidad.type !== 'team') return;
    if (e.fase !== FASES.JUGANDO || e.turno_entidad_tipo !== 'team' || e.turno_entidad_id !== miEntidad.id || e.seleccion_turno) return;

    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    const turnoActual = snapshotTurnoEntidad(sala, 'team', miEntidad.id, e.turno_miembro_idx);
    if (!turnoActual || turnoActual.members.length < 2) return;
    const siguienteIdx = siguienteMiembroEntidad(turnoActual);
    const siguiente = snapshotTurnoEntidad(sala, 'team', miEntidad.id, siguienteIdx);
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
    const miEntidad = entidadDeJugador(miId);
    if (!e.ronda_id || !miEntidad) return;

    if (modo === 'robo') {
        if (miEntidad.type === e.turno_entidad_tipo && miEntidad.id === e.turno_entidad_id) return;
        const miRobo = e.robos?.[miEntidad.key];
        if (!miRobo?.pagado) return;
        if (idx === e.seleccion_turno?.idx) return;
        await salaRef().child(`estado_juego/robos/${miEntidad.key}`).update({
            idx,
            label: slot.label,
            slot,
            entityType: miEntidad.type,
            entityId: miEntidad.id,
            entityKey: miEntidad.key,
            entityName: miEntidad.name,
            playerId: miId,
            playerName: nombreJugador(miId)
        });
        updateStatus(t('status.yourSteal', { label: slotLabel(slot) || slot.label }));
        return;
    }

    if (e.turno_entidad_tipo !== miEntidad.type || e.turno_entidad_id !== miEntidad.id || e.turno_de !== miId || e.seleccion_turno) return;
    const updates = {
        'estado_juego/seleccion_turno': {
            idx,
            label: slot.label,
            slot,
            playerId: miId,
            playerName: nombreJugador(miId),
            entityType: miEntidad.type,
            entityId: miEntidad.id,
            entityKey: miEntidad.key,
            entityName: miEntidad.name
        }
    };
    if (!esSolitario()) updates['estado_juego/fase'] = FASES.ESPERA_ROBO;
    await salaRef().update(updates);
    updateStatus(t('status.choiceSaved'));
}

async function intentarRobar() {
    const miEntidad = entidadDeJugador(miId);
    if (!miEntidad || misT < 1 || esSolitario()) return;
    const e = estadoCache || {};
    if (!e || e.fase !== FASES.ESPERA_ROBO || !e.seleccion_turno) return;
    if (e.turno_entidad_tipo === miEntidad.type && e.turno_entidad_id === miEntidad.id) return;
    if (e.robos?.[miEntidad.key]) return;
    const entidadTurno = entidadPorTurno(e);
    const lineaTurno = lineaReferenciaEntidad(entidadTurno?.data || {});
    if (!lineaTurno.length) return updateStatus(t('status.noLineToSteal'));

    const roboRef = salaRef().child(`estado_juego/robos/${miEntidad.key}`);
    const creado = now();
    const reserva = `reserva_${creado}`;
    const reservaTx = await roboRef.transaction((actual) => {
        if (actual) return actual;
        return {
            pagado: false,
            ronda_id: e.ronda_id,
            reserva,
            creado,
            entityType: miEntidad.type,
            entityId: miEntidad.id,
            entityKey: miEntidad.key,
            entityName: miEntidad.name,
            playerId: miId,
            playerName: nombreJugador(miId)
        };
    });
    if (!reservaTx.committed) return;

    const tokenTx = await salaRef().child(rutaEntidadCampo(miEntidad.type, miEntidad.id, 'tokens')).transaction((value) => {
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
    const miEntidad = entidadDeJugador(miId);
    if (!miEntidad || e.fase !== FASES.ESPERA_ROBO) return;
    if (e.turno_entidad_tipo === miEntidad.type && e.turno_entidad_id === miEntidad.id) return;
    const miRobo = e.robos?.[miEntidad.key];
    if (!miRobo?.pagado) return;

    const roboRef = salaRef().child(`estado_juego/robos/${miEntidad.key}`);
    const cancelTx = await roboRef.transaction((actual) => {
        if (!actual || !actual.pagado || actual.ronda_id !== e.ronda_id) return;
        return null;
    });
    if (!cancelTx.committed) return;

    await salaRef().child(rutaEntidadCampo(miEntidad.type, miEntidad.id, 'tokens')).transaction((value) => {
        return Math.min(MAX_TOKENS, (Number(value) || 0) + 1);
    });
    updateStatus(t('status.stealCancelled'));
}

async function comprarCarta() {
    const e = estadoCache || {};
    const miEntidad = entidadDeJugador(miId);
    if (!miEntidad || misT < 3 || esSolitario()) return;
    if (!e.cancion_actual || e.fase !== FASES.JUGANDO || e.seleccion_turno) return;
    if (e.turno_entidad_tipo !== miEntidad.type || e.turno_entidad_id !== miEntidad.id || e.turno_de !== miId) return;

    const carta = cartaDesdeCancion(e.cancion_actual);
    if (!carta) return;

    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    const entidadActual = snapshotTurnoEntidad(sala, miEntidad.type, miEntidad.id, e.turno_miembro_idx);
    if (!entidadActual) return;
    const nuevasCartas = ordenarCartas([...(cartasEntidad(entidadActual.entityData) || []), carta]);
    const gano = nuevasCartas.length >= OBJETIVO_CARTAS;
    const resumenI18n = { key: 'summary.exchangedCard', params: { name: entidadActual.entityName } };
    const updates = {
        [rutaEntidadCampo(miEntidad.type, miEntidad.id, 'tokens')]: Math.max(0, misT - 3),
        [rutaEntidadCampo(miEntidad.type, miEntidad.id, 'linea')]: nuevasCartas,
        'estado_juego/fase': gano ? FASES.FINAL : FASES.RESULTADO,
        'estado_juego/revelar': true,
        'estado_juego/seleccion_turno': {
            label: t('summary.exchangedSelection'),
            canjeado: true,
            playerId: miId,
            playerName: nombreJugador(miId),
            entityType: miEntidad.type,
            entityId: miEntidad.id,
            entityKey: miEntidad.key,
            entityName: entidadActual.entityName
        },
        'estado_juego/resumen_resultado': textoI18n(resumenI18n),
        'estado_juego/resumen_resultado_i18n': resumenI18n,
        'estado_juego/resumen_votos': '',
        'estado_juego/resumen_votos_i18n': null,
        'estado_juego/ganador': gano ? entidadActual.entityName : '',
        'estado_juego/cierre_fase_en': 0
    };
    if (miEntidad.type === 'team') {
        updates[rutaEntidadCampo('team', miEntidad.id, 'turno_miembro_idx')] = siguienteMiembroEntidad(entidadActual);
    }
    await salaRef().update(updates);
}

function respuestaAutoBloqueada(respuestaAuto) {
    return !!(respuestaAuto?.guess_text || respuestaAuto?.guess_song || respuestaAuto?.omitido);
}

async function enviarRespuestaAuto() {
    const e = estadoCache || {};
    const miEntidad = entidadDeJugador(miId);
    if (!puedeBonusMoneda() || !miEntidad) return;
    if ((e.fase !== FASES.JUGANDO && e.fase !== FASES.ESPERA_ROBO) || !e.cancion_actual || e.revelar) return;
    if (e.turno_entidad_tipo !== miEntidad.type || e.turno_entidad_id !== miEntidad.id || e.turno_de !== miId) return;
    if (respuestaAutoBloqueada(e.respuesta_auto)) return;

    const modo = modoActual();
    const flexInput = document.getElementById('guess-flex-input');
    const songInput = document.getElementById('guess-song-input');
    const artistInput = document.getElementById('guess-artist-input');

    if (modo === MODOS.DIFICIL) {
        const guessSong = songInput?.value.trim() || '';
        const guessArtist = artistInput?.value.trim() || '';
        if (!guessSong || !guessArtist) return updateStatus(t('status.autoGuessNeedBoth'));

        const revision = verificarRespuestaCompleta(guessSong, guessArtist, e.cancion_actual);
        await salaRef().child('estado_juego/respuesta_auto').set({
            modo,
            guess_song: guessSong,
            guess_artist: guessArtist,
            song_score: revision.songScore,
            artist_score: revision.artistScore,
            correcto: revision.correcto,
            revisado_en: now(),
            playerId: miId,
            entityType: miEntidad.type,
            entityId: miEntidad.id,
            entityKey: miEntidad.key
        });
    } else {
        const guessText = flexInput?.value.trim() || '';
        if (!guessText) return updateStatus(t('status.autoGuessNeedGuess'));

        const revision = verificarRespuestaAutomatica(guessText, e.cancion_actual);
        await salaRef().child('estado_juego/respuesta_auto').set({
            modo,
            guess_text: guessText,
            title_score: revision.titleScore,
            artist_score: revision.artistScore,
            mejor_score: revision.mejorScore,
            correcto: revision.correcto,
            tipo: revision.tipo,
            revisado_en: now(),
            playerId: miId,
            entityType: miEntidad.type,
            entityId: miEntidad.id,
            entityKey: miEntidad.key
        });
    }

    updateStatus(t('status.autoGuessSaved'));
    const note = document.getElementById('autoguess-note');
    if (note) note.innerText = t('status.autoGuessSaved');
    [flexInput, songInput, artistInput].forEach((input) => {
        if (input) input.disabled = true;
    });
    const btnGuardar = document.getElementById('btn-check-guess');
    const btnOmitir = document.getElementById('btn-skip-guess');
    if (btnGuardar) btnGuardar.disabled = true;
    if (btnOmitir) btnOmitir.disabled = true;
}

async function omitirRespuestaAuto(sala) {
    const e = sala.estado_juego || {};
    const miEntidad = entidadDeJugador(miId, sala.jugadores || {}, sala.equipos || {});
    if (!puedeBonusMoneda() || !miEntidad) return;
    if ((e.fase !== FASES.JUGANDO && e.fase !== FASES.ESPERA_ROBO) || e.turno_de !== miId) return;
    if (e.turno_entidad_tipo !== miEntidad.type || e.turno_entidad_id !== miEntidad.id) return;
    if (respuestaAutoBloqueada(e.respuesta_auto)) return;
    await salaRef().child('estado_juego/respuesta_auto').set({
        modo: modoActual(),
        correcto: false,
        omitido: true,
        revisado_en: now(),
        playerId: miId,
        entityType: miEntidad.type,
        entityId: miEntidad.id,
        entityKey: miEntidad.key
    });
}

async function omitirRespuestaAutoManual() {
    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    const e = sala.estado_juego || {};
    const miEntidad = entidadDeJugador(miId, sala.jugadores || {}, sala.equipos || {});
    if (!puedeBonusMoneda() || !miEntidad) return;
    if ((e.fase !== FASES.JUGANDO && e.fase !== FASES.ESPERA_ROBO) || e.turno_de !== miId) return;
    if (e.turno_entidad_tipo !== miEntidad.type || e.turno_entidad_id !== miEntidad.id) return;
    if (respuestaAutoBloqueada(e.respuesta_auto)) return;
    await omitirRespuestaAuto(sala);

    const flexInput = document.getElementById('guess-flex-input');
    const songInput = document.getElementById('guess-song-input');
    const artistInput = document.getElementById('guess-artist-input');
    [flexInput, songInput, artistInput].forEach((input) => {
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
    const ronda = nuevaRondaState({ ...sala, canciones_usadas: usadas }, songIndex);
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
    const entities = entidadesActivasLista(players, teams);
    const cartaActual = cartaDesdeCancion(e.cancion_actual);
    if (!cartaActual || !entities.length) return;

    const year = Number(cartaActual.y);
    const lineas = {};
    const referencias = {};
    entities.forEach((entity) => {
        lineas[entity.key] = cartasEntidad(entity.data);
        referencias[entity.key] = lineaReferenciaEntidad(entity.data);
    });

    const turnoInfo = snapshotTurnoEntidad(
        sala,
        e.turno_entidad_tipo || (teamIdValido(players[e.turno_de]?.team_id || '', players, teams) ? 'team' : 'player'),
        e.turno_entidad_id || (teamIdValido(players[e.turno_de]?.team_id || '', players, teams) ? players[e.turno_de].team_id : e.turno_de),
        e.turno_miembro_idx
    );
    if (!turnoInfo) return;

    const turnoKey = turnoInfo.entityKey;
    const intentoTurno = referencias[turnoKey]
        && e.seleccion_turno
        && !e.seleccion_turno.canjeado
        && colocacionEsValida(year, e.seleccion_turno.slot)
        ? { key: turnoKey, type: turnoInfo.entityType, id: turnoInfo.entityId, name: turnoInfo.entityName, tipo: 'turno' }
        : null;

    const robosCorrectos = Object.entries(e.robos || {})
        .filter(([entityKey, robo]) => entityKey !== turnoKey && referencias[entityKey] && robo?.pagado && robo?.slot && colocacionEsValida(year, robo.slot))
        .sort(([, a], [, b]) => (Number(a.creado) || 0) - (Number(b.creado) || 0))
        .map(([entityKey, robo]) => ({
            key: entityKey,
            type: robo.entityType || 'player',
            id: robo.entityId || '',
            name: robo.entityName || t('cards.player'),
            tipo: 'robo'
        }));

    const ganadorCarta = intentoTurno || robosCorrectos[0] || null;
    if (ganadorCarta) {
        lineas[ganadorCarta.key].push(cartaActual);
        lineas[ganadorCarta.key] = ordenarCartas(lineas[ganadorCarta.key]);
    }

    const updates = {};
    let ganador = '';
    entities.forEach((entity) => {
        const nuevasCartas = lineas[entity.key] || cartasEntidad(entity.data);
        updates[rutaEntidadCampo(entity.type, entity.id, 'linea')] = nuevasCartas;
        if (!ganador && nuevasCartas.length >= OBJETIVO_CARTAS) ganador = entity.name;
    });

    const resumenCartaI18n = ganadorCarta
        ? { key: ganadorCarta.tipo === 'robo' ? 'summary.cardForRobbery' : 'summary.cardFor', params: { name: ganadorCarta.name } }
        : { key: 'summary.noCard', params: {} };

    const respuestaAuto = e.respuesta_auto || null;
    const tuvoRespuesta = !!(respuestaAuto?.guess_text || respuestaAuto?.guess_song || respuestaAuto?.omitido);
    const bonusDisponible = entities.length > 1;
    let resumenVotosI18n = null;
    let respuestaAutoActualizada = bonusDisponible ? respuestaAuto : null;
    const tokensTurno = Number(turnoInfo.entityData?.tokens) || 0;

    if (bonusDisponible && (respuestaAuto?.guess_text || respuestaAuto?.guess_song)) {
        if ((respuestaAuto?.modo || sala?.modo_dificultad || MODOS.FACIL) === MODOS.DIFICIL) {
            const revision = verificarRespuestaCompleta(respuestaAuto.guess_song || '', respuestaAuto.guess_artist || '', e.cancion_actual);
            respuestaAutoActualizada = {
                ...respuestaAuto,
                song_score: revision.songScore,
                artist_score: revision.artistScore,
                correcto: revision.correcto
            };
            if (revision.correcto && tokensTurno < MAX_TOKENS) {
                updates[rutaEntidadCampo(turnoInfo.entityType, turnoInfo.entityId, 'tokens')] = Math.min(MAX_TOKENS, tokensTurno + 1);
                resumenVotosI18n = { key: 'summary.autoGuessCorrectCoin', params: { name: turnoInfo.entityName } };
            } else if (revision.correcto) {
                resumenVotosI18n = { key: 'summary.autoGuessCorrectMax', params: {} };
            } else {
                resumenVotosI18n = { key: 'summary.autoGuessWrong', params: {} };
            }
        } else {
            const revision = verificarRespuestaAutomatica(respuestaAuto.guess_text || '', e.cancion_actual);
            respuestaAutoActualizada = {
                ...respuestaAuto,
                title_score: revision.titleScore,
                artist_score: revision.artistScore,
                mejor_score: revision.mejorScore,
                correcto: revision.correcto,
                tipo: revision.tipo
            };
            if (revision.correcto && tokensTurno < MAX_TOKENS) {
                updates[rutaEntidadCampo(turnoInfo.entityType, turnoInfo.entityId, 'tokens')] = Math.min(MAX_TOKENS, tokensTurno + 1);
                resumenVotosI18n = { key: 'summary.autoGuessCorrectCoin', params: { name: turnoInfo.entityName } };
            } else if (revision.correcto) {
                resumenVotosI18n = { key: 'summary.autoGuessCorrectMax', params: {} };
            } else {
                resumenVotosI18n = { key: 'summary.autoGuessWrong', params: {} };
            }
        }
    } else if (bonusDisponible && respuestaAuto?.omitido) {
        resumenVotosI18n = { key: 'summary.autoGuessSkipped', params: {} };
    } else if (bonusDisponible && !tuvoRespuesta) {
        resumenVotosI18n = { key: 'summary.autoGuessMissing', params: {} };
    }

    if (turnoInfo.entityType === 'team') {
        updates[rutaEntidadCampo('team', turnoInfo.entityId, 'turno_miembro_idx')] = siguienteMiembroEntidad(turnoInfo);
    }

    updates.estado_juego = {
        ...e,
        fase: ganador ? FASES.FINAL : FASES.RESULTADO,
        cierre_fase_en: 0,
        revelar: true,
        respuesta_auto: respuestaAutoActualizada,
        resumen_resultado: textoI18n(resumenCartaI18n),
        resumen_resultado_i18n: resumenCartaI18n,
        resumen_votos: resumenVotosI18n ? textoI18n(resumenVotosI18n) : '',
        resumen_votos_i18n: resumenVotosI18n,
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

    Object.entries(jugadoresCache || {}).forEach(([id]) => {
        updates[`jugadores/${id}/tokens`] = 3;
        updates[`jugadores/${id}/base`] = randomDecadaInicial();
        updates[`jugadores/${id}/linea`] = [];
    });
    Object.entries(equiposCache() || {}).forEach(([teamId]) => {
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
    const puedeQuitarJugador = lobbyEditable(estadoSala);
    const teamIdSalir = miEquipoId();

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
                    if (teamIdSalir) {
                        const quedanEnEquipo = restantes.some((id) => (jugadoresCache[id]?.team_id || '') === teamIdSalir);
                        if (!quedanEnEquipo) updates[`equipos/${teamIdSalir}`] = null;
                    }
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
    clearStoredRoomCode();
    localStorage.removeItem('hitster_nombre');
    window.location.href = window.location.pathname;
}
