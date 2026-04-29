async function comenzarPartida(){
    if (!esHost) return;
    const jugadores = Object.keys(jugadoresCache || {});
    if (!jugadores.length) return;
    await salaRef().update({
        estado_sala: FASES.LISTA,
        estado_juego: {
            fase: FASES.LISTA,
            ronda_id: null,
            cierre_fase_en: 0,
            revelar:false,
            resumen_resultado:'',
            resumen_resultado_i18n:null,
            resumen_votos:'',
            resumen_votos_i18n:null,
            ganador:'',
            cancion_actual:null,
            seleccion_turno:null,
            respuesta_auto:null,
            robos:{},
            votos:{},
            turno_de:'',
            nombre_turno:''
        }
    });
}

async function iniciarPartida(){
    if (!esHost) return;
    const jugadores = Object.entries(jugadoresCache || {});
    if (!jugadores.length) return;
    const usadas = [];
    const disponibles = (Array.isArray(CANCIONES) ? CANCIONES : []).map((_, i) => i);
    if (!disponibles.length) return;

    const turnoIdx = 0;
    const [turnoId, turno] = jugadores[turnoIdx];
    const songIndex = disponibles[Math.floor(Math.random() * disponibles.length)];
    const cancion = CANCIONES[songIndex];

    // El primer play debe salir directo de esta interacción del host.
    if (cancion.spotifyId) reproducirSpotify(cancion.spotifyId, true);

    await salaRef().update({
        estado_sala: ESTADO_EN_PARTIDA,
        indice_turno: 1,
        canciones_usadas: [songIndex],
        estado_juego: {
            fase: FASES.JUGANDO,
            ronda_id: 'r_' + now(),
            cierre_fase_en: 0,
            cancion_idx: songIndex,
            cancion_actual: { spotifyId: cancion.spotifyId, t: cancion.titulo, a: cancion.artista, y: cancion.year },
            turno_de: turnoId,
            nombre_turno: turno.nombre,
            revelar:false,
            seleccion_turno:null,
            respuesta_auto:null,
            robos:{},
            votos:{},
            resumen_resultado:'',
            resumen_resultado_i18n:null,
            resumen_votos:'',
            resumen_votos_i18n:null,
            ganador:''
        }
    });
}

function construirLineaVisual(linea){
    const items = ordenarLineaItems(linea);
    const grupos = [];
    items.forEach(item => {
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
    if (grupos.length) slots.push({ left: grupos[grupos.length - 1].valor, right: null, label: t('slot.afterLabel', { left: grupos[grupos.length - 1].valor }) });
    return { grupos, slots };
}

function slotPartes(slot){
    if (slot.left == null && slot.right == null) return { main: t('slot.firstMain'), range: t('slot.cardRange') };
    if (slot.left == null) return { main: t('slot.beforeMain'), range: String(slot.right) };
    if (slot.right == null) return { main: t('slot.afterMain'), range: String(slot.left) };
    return { main: t('slot.betweenMain'), range: `${slot.left} · ${slot.right}` };
}

function crearBotonSlot(slot, idx, opciones){
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

function crearCartaAnio(item){
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
            grupos[i].items.forEach(item => wrap.appendChild(crearCartaAnio(item)));
            track.appendChild(wrap);
        }
    });
    cont.appendChild(scroll);
}

async function colocar(slot, idx, modo='turno') {
    const e = estadoCache;
    if (!e || !e.ronda_id) return;
    if (modo === 'robo') {
        if (!e.robos?.[miId]?.pagado) return;
        if (idx === e.seleccion_turno?.idx) return;
        await salaRef().child(`estado_juego/robos/${miId}`).update({ idx, label: slot.label, slot });
        updateStatus(t('status.yourSteal', { label: slotLabel(slot) || slot.label }));
    } else {
        if (e.seleccion_turno) return;
        const updates = {
            'estado_juego/seleccion_turno': { idx, label: slot.label, slot, playerId: miId }
        };
        if (!esSolitario()) updates['estado_juego/fase'] = FASES.ESPERA_ROBO;
        await salaRef().update(updates);
        updateStatus(t('status.choiceSaved'));
    }
}

async function intentarRobar(){
    if (misT < 1 || esSolitario()) return;
    const e = estadoCache;
    if (!e || e.fase !== FASES.ESPERA_ROBO || !e.seleccion_turno || e.turno_de === miId || e.robos?.[miId]) return;
    const lineaTurno = lineaReferenciaJugador(jugadoresCache[e.turno_de]);
    if (!lineaTurno.length) return updateStatus(t('status.noLineToSteal'));
    const roboRef = salaRef().child(`estado_juego/robos/${miId}`);
    const creado = now();
    const reserva = 'reserva_' + creado;
    const reservaTx = await roboRef.transaction((actual) => {
        if (actual) return;
        return { pagado: false, ronda_id: e.ronda_id, reserva, creado };
    });
    if (!reservaTx.committed) return;

    const tokenTx = await salaRef().child(`jugadores/${miId}/tokens`).transaction((t) => {
        const actuales = Number(t) || 0;
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

async function cancelarRobo(){
    const e = estadoCache;
    if (!e || e.fase !== FASES.ESPERA_ROBO || e.turno_de === miId) return;
    const miRobo = e.robos?.[miId];
    if (!miRobo?.pagado) return;

    const roboRef = salaRef().child(`estado_juego/robos/${miId}`);
    const cancelTx = await roboRef.transaction((actual) => {
        if (!actual || !actual.pagado || actual.ronda_id !== e.ronda_id) return;
        return null;
    });
    if (!cancelTx.committed) return;

    await salaRef().child(`jugadores/${miId}/tokens`).transaction((t) => {
        return Math.min(MAX_TOKENS, (Number(t) || 0) + 1);
    });
    updateStatus(t('status.stealCancelled'));
}

async function comprarCarta(){
    if (misT < 3 || esSolitario()) return;
    const e = estadoCache;
    if (!e.cancion_actual || e.turno_de !== miId || e.fase !== FASES.JUGANDO || e.seleccion_turno) return;
    const carta = cartaDesdeCancion(e.cancion_actual);
    if (!carta) return;
    const nuevaLinea = ordenarCartas([...(miCartas || []), carta]);
    const objetivo = objetivoCartasActual();
    const gano = nuevaLinea.length >= objetivo;
    const nombre = jugadoresCache[miId]?.nombre || t('cards.player');
    const resumenI18n = { key: 'summary.exchangedCard', params: { name: nombre } };
    await salaRef().update({
        [`jugadores/${miId}/tokens`]: Math.max(0, misT - 3),
        [`jugadores/${miId}/linea`]: nuevaLinea,
        [`estado_juego/fase`]: gano ? FASES.FINAL : FASES.RESULTADO,
        [`estado_juego/revelar`]: true,
        [`estado_juego/seleccion_turno`]: { label: t('summary.exchangedSelection'), canjeado: true, playerId: miId },
        [`estado_juego/resumen_resultado`]: textoI18n(resumenI18n),
        [`estado_juego/resumen_resultado_i18n`]: resumenI18n,
        [`estado_juego/resumen_votos`]: '',
        [`estado_juego/resumen_votos_i18n`]: null,
        [`estado_juego/ganador`]: gano ? nombre : '',
        [`estado_juego/cierre_fase_en`]: 0
    });
}

function respuestaAutoBloqueada(respuestaAuto){
    return !!(respuestaAuto?.guess_text || respuestaAuto?.guess_song || respuestaAuto?.omitido);
}

async function enviarRespuestaAuto(){
    const e = estadoCache || {};
    if (!puedeBonusMoneda()) return;
    if ((e.fase !== FASES.JUGANDO && e.fase !== FASES.ESPERA_ROBO) || e.turno_de !== miId || !e.cancion_actual || e.revelar) return;
    if (respuestaAutoBloqueada(e.respuesta_auto)) return;

    const modo = modoActual();
    const flexInput = document.getElementById('guess-flex-input');
    const guessSongInput = document.getElementById('guess-song-input');
    const guessArtistInput = document.getElementById('guess-artist-input');

    if (modo === MODOS.DIFICIL) {
        const guessSong = guessSongInput?.value.trim() || '';
        const guessArtist = guessArtistInput?.value.trim() || '';
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
            playerId: miId
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
            playerId: miId
        });
    }

    updateStatus(t('status.autoGuessSaved'));
    const note = document.getElementById('autoguess-note');
    if (note) note.innerText = t('status.autoGuessSaved');
    [flexInput, guessSongInput, guessArtistInput].forEach((input) => {
        if (input) input.disabled = true;
    });
    const btnGuardar = document.getElementById('btn-check-guess');
    const btnOmitir = document.getElementById('btn-skip-guess');
    if (btnGuardar) btnGuardar.disabled = true;
    if (btnOmitir) btnOmitir.disabled = true;
}

async function omitirRespuestaAuto(sala){
    const e = sala.estado_juego || {};
    if (!puedeBonusMoneda()) return;
    if ((e.fase !== FASES.JUGANDO && e.fase !== FASES.ESPERA_ROBO) || e.turno_de !== miId) return;
    if (respuestaAutoBloqueada(e.respuesta_auto)) return;
    await salaRef().child('estado_juego/respuesta_auto').set({
        modo: modoActual(),
        correcto: false,
        omitido: true,
        revisado_en: now(),
        playerId: miId
    });
}

async function omitirRespuestaAutoManual(){
    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    const e = sala.estado_juego || {};
    if (!puedeBonusMoneda()) return;
    if ((e.fase !== FASES.JUGANDO && e.fase !== FASES.ESPERA_ROBO) || e.turno_de !== miId) return;
    if (respuestaAutoBloqueada(e.respuesta_auto)) return;
    await omitirRespuestaAuto(sala);

    const flexInput = document.getElementById('guess-flex-input');
    const guessSongInput = document.getElementById('guess-song-input');
    const guessArtistInput = document.getElementById('guess-artist-input');
    [flexInput, guessSongInput, guessArtistInput].forEach((input) => {
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

async function revelarCancion(){
    if (!esHost) return;
    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    const e = sala.estado_juego || {};
    const estadoSala = sala.estado_sala || FASES.LOBBY;
    if (estadoSala !== ESTADO_EN_PARTIDA || !e.cancion_actual) return;
    if (e.fase !== FASES.JUGANDO && e.fase !== FASES.ESPERA_ROBO) return;
    await resolverRevelacion(sala);
}

async function siguienteCancion(){
    if (!esHost) return;
    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    const e = sala.estado_juego || {};
    const estadoSala = sala.estado_sala || FASES.LOBBY;
    if (estadoSala !== ESTADO_EN_PARTIDA) return;
    if (e.fase !== FASES.RESULTADO && e.fase !== FASES.REVELANDO) return;
    await siguienteRondaOSalida(sala);
}

async function prepararRonda(sala){
    const usadas = Array.isArray(sala.canciones_usadas) ? sala.canciones_usadas : [];
    const disponibles = (Array.isArray(CANCIONES) ? CANCIONES : []).map((_, i) => i).filter(i => !usadas.includes(i));
    if (!disponibles.length) {
        return salaRef().child('estado_juego').update({ fase: FASES.FINAL, ganador: t('summary.noSongs') });
    }
    const jugadores = Object.entries(sala.jugadores || {});
    if (!jugadores.length) return;
    const idxTurno = Number(sala.indice_turno) || 0;
    const turnoIdx = idxTurno % jugadores.length;
    const [turnoId, turno] = jugadores[turnoIdx];
    const songIndex = disponibles[Math.floor(Math.random() * disponibles.length)];
    const cancion = CANCIONES[songIndex];
    await salaRef().update({
        indice_turno: turnoIdx + 1,
        canciones_usadas: [...usadas, songIndex],
        estado_juego: {
            fase: FASES.JUGANDO,
            ronda_id: 'r_' + now(),
            cierre_fase_en: 0,
            cancion_idx: songIndex,
            cancion_actual: { spotifyId: cancion.spotifyId, t: cancion.titulo, a: cancion.artista, y: cancion.year },
            turno_de: turnoId,
            nombre_turno: turno.nombre,
            revelar: false,
            seleccion_turno: null,
            respuesta_auto: null,
            robos: {},
            votos: {},
            resumen_resultado: '',
            resumen_resultado_i18n: null,
            resumen_votos: '',
            resumen_votos_i18n: null,
            ganador: ''
        }
    });
    if (cancion.spotifyId) reproducirSpotify(cancion.spotifyId, true);
}

async function resolverRevelacion(sala){
    const e = sala.estado_juego || {};
    const players = sala.jugadores || {};
    const cartaActual = cartaDesdeCancion(e.cancion_actual);
    if (!cartaActual) return;
    const year = Number(cartaActual.y);
    const lineas = {};
    const referencias = {};
    Object.keys(players).forEach(id => {
        lineas[id] = cartasJugador(players[id]);
        referencias[id] = lineaReferenciaJugador(players[id]);
    });
    const intentoTurno = referencias[e.turno_de] && e.seleccion_turno && !e.seleccion_turno.canjeado && colocacionEsValida(year, e.seleccion_turno.slot)
        ? { id: e.turno_de, nombre: players[e.turno_de]?.nombre || e.nombre_turno, tipo: 'turno' }
        : null;

    const robosCorrectos = Object.entries(e.robos || {})
        .filter(([id, robo]) => referencias[id] && robo?.pagado && robo?.slot && colocacionEsValida(year, robo.slot))
        .sort(([, a], [, b]) => (Number(a.creado) || 0) - (Number(b.creado) || 0))
        .map(([id]) => ({ id, nombre: players[id]?.nombre || t('cards.player'), tipo: 'robo' }));

    const ganadorCarta = intentoTurno || robosCorrectos[0] || null;
    if (ganadorCarta) {
        lineas[ganadorCarta.id].push(cartaActual);
        lineas[ganadorCarta.id] = ordenarCartas(lineas[ganadorCarta.id]);
    }

    const updates = {};
    let ganador = '';
    const objetivo = objetivoCartasActual();
    Object.entries(lineas).forEach(([id, linea]) => {
        updates[`jugadores/${id}/linea`] = linea;
        if (!ganador && linea.length >= objetivo) ganador = players[id]?.nombre || '';
    });
    const resumenCartaI18n = ganadorCarta
        ? { key: ganadorCarta.tipo === 'robo' ? 'summary.cardForRobbery' : 'summary.cardFor', params: { name: ganadorCarta.nombre } }
        : { key: 'summary.noCard', params: {} };
    const respuestaAuto = e.respuesta_auto || null;
    const tuvoRespuesta = !!(respuestaAuto?.guess_text || respuestaAuto?.guess_song || respuestaAuto?.omitido);
    let resumenVotosI18n = null;
    const bonusDisponible = Object.keys(players).length > 1;
    let respuestaAutoActualizada = bonusDisponible ? respuestaAuto : null;
    const turnoTokens = Number(players[e.turno_de]?.tokens) || 0;
    const nombreTurno = players[e.turno_de]?.nombre || e.nombre_turno || t('cards.player');
    const modoRespuesta = respuestaAuto?.modo || sala?.modo_dificultad || MODOS.FACIL;
    if (bonusDisponible && (respuestaAuto?.guess_text || respuestaAuto?.guess_song)) {
        let revision = null;
        if (modoRespuesta === MODOS.DIFICIL) {
            revision = verificarRespuestaCompleta(respuestaAuto.guess_song || '', respuestaAuto.guess_artist || '', e.cancion_actual);
            respuestaAutoActualizada = {
                ...respuestaAuto,
                song_score: revision.songScore,
                artist_score: revision.artistScore,
                correcto: revision.correcto
            };
        } else {
            revision = verificarRespuestaAutomatica(respuestaAuto.guess_text || '', e.cancion_actual);
            respuestaAutoActualizada = {
                ...respuestaAuto,
                title_score: revision.titleScore,
                artist_score: revision.artistScore,
                mejor_score: revision.mejorScore,
                correcto: revision.correcto,
                tipo: revision.tipo
            };
        }

        if (revision.correcto && turnoTokens < MAX_TOKENS) {
            updates[`jugadores/${e.turno_de}/tokens`] = Math.min(MAX_TOKENS, turnoTokens + 1);
            resumenVotosI18n = { key: 'summary.autoGuessCorrectCoin', params: { name: nombreTurno } };
        } else if (revision.correcto) {
            resumenVotosI18n = { key: 'summary.autoGuessCorrectMax', params: {} };
        } else {
            resumenVotosI18n = { key: 'summary.autoGuessWrong', params: {} };
        }
    } else if (bonusDisponible && respuestaAuto?.omitido) {
        resumenVotosI18n = { key: 'summary.autoGuessSkipped', params: {} };
    } else if (bonusDisponible && !tuvoRespuesta) {
        resumenVotosI18n = { key: 'summary.autoGuessMissing', params: {} };
    }

    updates['estado_juego'] = {
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

async function siguienteRondaOSalida(sala){
    const e = sala.estado_juego || {};
    if (e.ganador) {
        await salaRef().child('estado_juego').update({ fase: FASES.FINAL, cierre_fase_en: 0 });
        return;
    }
    await prepararRonda(sala);
}

async function volverAJugar(){
    if (!esHost) return;
    const updates = {
        estado_sala: FASES.LOBBY,
        indice_turno: 0,
        canciones_usadas: [],
        estado_juego: { fase: FASES.LOBBY, ronda_id: null, cierre_fase_en: 0, revelar:false, resumen_resultado:'', resumen_resultado_i18n:null, resumen_votos:'', resumen_votos_i18n:null, ganador:'', cancion_actual:null, seleccion_turno:null, respuesta_auto:null, robos:{}, votos:{}, turno_de:'', nombre_turno:'' }
    };
    Object.keys(jugadoresCache || {}).forEach(id => {
        updates[`jugadores/${id}/tokens`] = 3;
        updates[`jugadores/${id}/base`] = randomDecadaInicial();
        updates[`jugadores/${id}/linea`] = [];
    });
    await salaRef().update(updates);
}

async function salirDeSala(){
    if (!confirm(t('confirm.leave'))) return;
    const salaSalir = salaA;
    const idSalir = miId;
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    const puedeQuitarJugador = estadoSala === FASES.LOBBY || estadoSala === FASES.LISTA;
    if (activeSalaListenerRef) activeSalaListenerRef.off('value');
    try {
        if (salaSalir && idSalir) {
            const refSala = db.ref(`salas/${salaSalir}`);
            if (puedeQuitarJugador && esHost) {
                const restantes = Object.keys(jugadoresCache || {}).filter(id => id !== idSalir);
                if (restantes.length) {
                    await refSala.update({
                        host_id: restantes[0],
                        [`jugadores/${idSalir}`]: null
                    });
                } else {
                    await refSala.remove();
                }
            } else if (puedeQuitarJugador) {
                await refSala.child(`jugadores/${idSalir}`).remove();
            } else {
                await refSala.child(`jugadores/${idSalir}`).update({
                    conectado: false,
                    ultimaConexion: firebase.database.ServerValue.TIMESTAMP
                });
            }
        }
    } catch (_) {}
    clearStoredPlayerId(salaSalir);
    clearStoredRoomCode();
    localStorage.removeItem('hitster_nombre');
    window.location.href = window.location.pathname;
}
