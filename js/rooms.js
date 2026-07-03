function lobbyEditable(estadoSala = salaMetaCache.estado_sala || FASES.LOBBY) {
    return estadoSala === FASES.LOBBY || estadoSala === FASES.LISTA;
}

async function crearSalaConEstado(estadoSalaInicial = FASES.LOBBY, modoInicio = 'sala') {
    const miNombre = document.getElementById('nombreI').value.trim();
    if (!miNombre) return setError(t('errors.nameRequired'));
    setError(t('errors.creatingRoom'));
    try {
        await ensureAuth();
        salaA = await genSalaUnica(4);
        miId = nuevaIdJugador();
        esHost = true;
        await salaRef().set({
            creada: now(),
            created_by_uid: miUid,
            estado_sala: estadoSalaInicial,
            modo_inicio: modoInicio,
            modo_dificultad: MODOS.FACIL,
            host_id: miId,
            host_uid: miUid,
            indice_turno: 0,
            canciones_usadas: [],
            estado_juego: estadoJuegoBase(estadoSalaInicial),
            equipos: {},
            uid_to_player: {
                [miUid]: miId
            },
            jugadores: {
                [miId]: jugadorBase(miNombre, '', miUid)
            }
        });
        afterJoin(miNombre);
    } catch (err) {
        setError(friendlyFirebaseError(err, t('errors.roomCreateFailed')));
    }
}

async function crearSala() {
    await crearSalaConEstado(FASES.LOBBY, 'sala');
}

async function crearSalaSolo() {
    await crearSalaConEstado(FASES.LISTA, 'solo');
}

async function unirmeSala() {
    salaA = document.getElementById('salaI').value.toUpperCase().trim();
    const miNombre = document.getElementById('nombreI').value.trim();
    if (!miNombre) return setError(t('errors.nameRequired'));
    if (!salaA) return setError(t('errors.joinCodeRequired'));
    setError(t('errors.connecting'));

    try {
        await ensureAuth();
        const snap = await salaRef().get();
        if (!snap.exists()) return setError(t('errors.roomNotFound', { room: salaA }));

        const sala = snap.val() || {};
        const jugadores = sala.jugadores || {};
        const equipos = sala.equipos || {};
        const estadoSala = sala.estado_sala || FASES.LOBBY;
        if (!sala.host_uid || !sala.uid_to_player) return setError(t('errors.roomNotFound', { room: salaA }));
        const mappedId = sala.uid_to_player?.[miUid] || '';
        const idEx = mappedId && jugadores[mappedId]?.uid === miUid ? mappedId : '';
        const puedeReconectar = !!(idEx && jugadores[idEx]?.uid === miUid);

        if (estadoSala !== FASES.LOBBY && estadoSala !== FASES.LISTA && !puedeReconectar) {
            return setError(t('errors.gameStartedReconnect'));
        }

        if (!idEx && Object.keys(jugadores).length >= MAX_JUGADORES) {
            return setError(t('errors.roomFull', { max: MAX_JUGADORES }));
        }

        miId = idEx || nuevaIdJugador();
        esHost = sala.host_uid === miUid;

        if (idEx) {
            const teamId = teamIdValido(jugadores[miId]?.team_id || '', jugadores, equipos) ? jugadores[miId].team_id : '';
            await salaRef().child(`jugadores/${miId}`).update({
                uid: miUid,
                nombre: jugadores[miId]?.nombre || miNombre,
                team_id: teamId,
                conectado: true,
                ultimaConexion: now()
            });
        } else {
            await salaRef().update({
                [`jugadores/${miId}`]: jugadorBase(miNombre, '', miUid),
                [`uid_to_player/${miUid}`]: miId
            });
        }

        afterJoin(miNombre);
    } catch (err) {
        setError(friendlyFirebaseError(err, t('errors.connecting')));
    }
}

async function cambiarModoDificultad(modo) {
    if (!esHost || !modo || (modo !== MODOS.FACIL && modo !== MODOS.DIFICIL)) return;
    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    if (!lobbyEditable(estadoSala)) return;
    await salaRef().update({
        modo_dificultad: modo
    });
}

async function copiarCodigoSala() {
    const ok = await copyTextToClipboard(salaA);
    setShareFeedback(ok ? t('lobby.codeCopied') : t('lobby.copyFailed'), ok ? 'success' : 'error');
}

async function copiarEnlaceSala() {
    const ok = await copyTextToClipboard(buildJoinUrl());
    setShareFeedback(ok ? t('lobby.linkCopied') : t('lobby.copyFailed'), ok ? 'success' : 'error');
}

async function copiarEnlaceTv() {
    const ok = await copyTextToClipboard(buildTvUrl());
    setShareFeedback(ok ? t('lobby.tvLinkCopied') : t('lobby.copyFailed'), ok ? 'success' : 'error');
}

let reconnectRenderToken = 0;

async function renderReconnectCard() {
    const panel = document.getElementById('reconnect-panel');
    const note = document.getElementById('reconnect-note');
    const data = datosReconectar();
    if (!panel || !note) return;
    if (!data) {
        panel.classList.add('hidden');
        return;
    }

    panel.classList.add('hidden');
    const token = reconnectRenderToken += 1;
    try {
        await ensureAuth();
        const snap = await db.ref(`salas/${data.sala}`).get();
        if (token !== reconnectRenderToken) return;
        const sala = snap.val() || {};
        const mappedId = sala.uid_to_player?.[miUid] || '';
        const jugador = mappedId ? sala.jugadores?.[mappedId] : null;
        const puedeReconectar = snap.exists() && sala.host_uid && sala.uid_to_player && jugador?.uid === miUid;

        if (!puedeReconectar) {
            clearStoredRoomCode();
            panel.classList.add('hidden');
            return;
        }

        note.innerText = t('setup.reconnectNote', { room: data.sala, name: data.nombre });
        panel.classList.remove('hidden');
    } catch (_) {
        panel.classList.add('hidden');
    }
}

function reconectarUltimaSala() {
    const data = datosReconectar();
    if (!data) return;
    document.getElementById('nombreI').value = data.nombre;
    document.getElementById('salaI').value = data.sala.toUpperCase();
    unirmeSala();
}

async function crearEquipoNeon() {
    if (!miId) return;
    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    if (!lobbyEditable(sala.estado_sala || FASES.LOBBY)) return;

    const jugadores = sala.jugadores || {};
    const equipos = sala.equipos || {};
    const currentTeamId = teamIdValido(jugadores[miId]?.team_id || '', jugadores, equipos) ? jugadores[miId].team_id : '';
    const restantesEnActual = currentTeamId
        ? miembrosEquipo(currentTeamId, jugadores).filter(([id]) => id !== miId)
        : [];
    const liberarCupo = !!currentTeamId && !restantesEnActual.length;
    if (totalEquiposActivos(jugadores, equipos) >= MAX_EQUIPOS && !liberarCupo) {
        return setError(t('errors.maxTeams', { max: MAX_EQUIPOS }));
    }

    const teamId = nuevoIdEquipo();
    const colorIndex = primerIndiceColorLibre(equipos);
    const updates = {
        [`equipos/${teamId}`]: equipoBase(colorIndex, now()),
        [`jugadores/${miId}/team_id`]: teamId
    };
    if (currentTeamId && !restantesEnActual.length) updates[`equipos/${currentTeamId}`] = null;
    await salaRef().update(updates);
    setError('');
}

async function cambiarMiEquipo(teamId) {
    if (!miId || !teamId) return;
    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    if (!lobbyEditable(sala.estado_sala || FASES.LOBBY)) return;

    const jugadores = sala.jugadores || {};
    const equipos = sala.equipos || {};
    if (!equipos[teamId]) return;

    const currentTeamId = teamIdValido(jugadores[miId]?.team_id || '', jugadores, equipos) ? jugadores[miId].team_id : '';
    if (currentTeamId === teamId) return;

    const updates = {
        [`jugadores/${miId}/team_id`]: teamId
    };
    if (currentTeamId) {
        const restantes = miembrosEquipo(currentTeamId, jugadores).filter(([id]) => id !== miId);
        if (!restantes.length) updates[`equipos/${currentTeamId}`] = null;
    }

    await salaRef().update(updates);
    setError('');
}

async function salirDeMiEquipo() {
    if (!miId) return;
    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    if (!lobbyEditable(sala.estado_sala || FASES.LOBBY)) return;

    const jugadores = sala.jugadores || {};
    const equipos = sala.equipos || {};
    const currentTeamId = teamIdValido(jugadores[miId]?.team_id || '', jugadores, equipos) ? jugadores[miId].team_id : '';
    if (!currentTeamId) return;

    const restantes = miembrosEquipo(currentTeamId, jugadores).filter(([id]) => id !== miId);
    const updates = {
        [`jugadores/${miId}/team_id`]: ''
    };
    if (!restantes.length) updates[`equipos/${currentTeamId}`] = null;
    await salaRef().update(updates);
    setError('');
}

function mostrarPantallaExpulsado() {
    if (activeSalaListenerRef) activeSalaListenerRef.off('value');
    activeSalaListenerRef = null;
    clearStoredRoomCode();
    salaA = '';
    miId = '';
    esHost = false;
    document.getElementById('app').classList.add('hidden');
    document.getElementById('setup').classList.remove('hidden');
    setError(t('errors.kickedFromRoom'));
}

function limpiarReservasRoboEntidad(estado, entityKey, updates) {
    Object.entries(estado?.reservas_robo || {}).forEach(([slotKey, reserva]) => {
        if (reserva?.entityKey === entityKey) updates[`estado_juego/reservas_robo/${slotKey}`] = null;
    });
}

function aplicarAjustesTurnoPorExpulsion(sala, playerId, playerName, teamId, teamRemoved, playersAfter, teamsAfter, updates) {
    const estadoSala = sala.estado_sala || FASES.LOBBY;
    if (estadoSala !== ESTADO_EN_PARTIDA) return;

    const e = sala.estado_juego || {};
    const entityKey = teamId ? entidadKey('team', teamId) : entidadKey('player', playerId);
    const debeQuitarRobo = !teamId || teamRemoved;
    if (e.respuesta_auto?.playerId === playerId) updates['estado_juego/respuesta_auto'] = null;

    const faseActiva = e.fase === FASES.JUGANDO || e.fase === FASES.ESPERA_ROBO;
    const turnoEraJugador = e.turno_de === playerId;
    const turnoEraEntidadRemovida = (e.turno_entidad_tipo === 'player' && e.turno_entidad_id === playerId)
        || (teamRemoved && e.turno_entidad_tipo === 'team' && e.turno_entidad_id === teamId);
    if (!faseActiva || (!turnoEraJugador && !turnoEraEntidadRemovida)) {
        if (debeQuitarRobo) {
            updates[`estado_juego/robos/${entityKey}`] = null;
            limpiarReservasRoboEntidad(e, entityKey, updates);
        }
        return;
    }

    if (turnoEraJugador && e.turno_entidad_tipo === 'team' && !teamRemoved && teamId) {
        const membersAfter = miembrosEquipo(teamId, playersAfter);
        const nextMember = membersAfter[0];
        if (nextMember) {
            updates['estado_juego/turno_de'] = nextMember[0];
            updates['estado_juego/nombre_turno'] = nextMember[1]?.nombre || t('cards.player');
            updates['estado_juego/turno_miembro_idx'] = 0;
            return;
        }
    }

    const resumenI18n = { key: 'summary.playerKickedRoundCancelled', params: { name: playerName || t('cards.player') } };
    updates['estado_juego/fase'] = FASES.RESULTADO;
    updates['estado_juego/cierre_fase_en'] = 0;
    updates['estado_juego/revelar'] = !!e.cancion_actual;
    updates['estado_juego/seleccion_turno'] = null;
    updates['estado_juego/robos'] = {};
    updates['estado_juego/reservas_robo'] = {};
    updates['estado_juego/votos'] = {};
    updates['estado_juego/respuesta_auto'] = null;
    updates['estado_juego/resumen_resultado'] = t(resumenI18n.key, resumenI18n.params);
    updates['estado_juego/resumen_resultado_i18n'] = resumenI18n;
    updates['estado_juego/resumen_votos'] = '';
    updates['estado_juego/resumen_votos_i18n'] = null;
    updates['estado_juego/ganador'] = '';
    updates['estado_juego/turno_de'] = '';
    updates['estado_juego/nombre_turno'] = '';
    updates['estado_juego/turno_entidad_tipo'] = '';
    updates['estado_juego/turno_entidad_id'] = '';
    updates['estado_juego/nombre_entidad_turno'] = '';
    updates['estado_juego/turno_miembro_idx'] = 0;
}

async function expulsarJugador(playerId) {
    if (!esHost || !playerId || playerId === miId) return;
    const salaSnap = await salaRef().get();
    const sala = salaSnap.val() || {};
    if (sala.host_uid !== miUid) return;

    const jugadores = sala.jugadores || {};
    const equipos = sala.equipos || {};
    const jugador = jugadores[playerId];
    if (!jugador || sala.host_id === playerId) return;

    const nombre = jugador.nombre || t('cards.player');
    if (!confirm(t('confirm.kickPlayer', { name: nombre }))) return;

    const teamId = teamIdValido(jugador.team_id || '', jugadores, equipos) ? jugador.team_id : '';
    const playersAfter = { ...jugadores };
    delete playersAfter[playerId];
    const teamsAfter = { ...equipos };
    const teamRemoved = !!(teamId && !miembrosEquipo(teamId, playersAfter).length);
    if (teamRemoved) delete teamsAfter[teamId];

    const uid = jugador.uid || Object.entries(sala.uid_to_player || {}).find(([, id]) => id === playerId)?.[0] || '';
    const updates = {
        [`jugadores/${playerId}`]: null
    };
    if (uid) updates[`uid_to_player/${uid}`] = null;
    if (teamRemoved) updates[`equipos/${teamId}`] = null;

    aplicarAjustesTurnoPorExpulsion(sala, playerId, nombre, teamId, teamRemoved, playersAfter, teamsAfter, updates);

    try {
        await salaRef().update(updates);
        showToast(t('teams.playerKicked', { name: nombre }), 'success', 2200);
    } catch (err) {
        showToast(friendlyFirebaseError(err, t('errors.kickPlayerFailed')), 'error', 3600);
    }
}

function afterJoin(miNombre) {
    localStorage.setItem('hitster_nombre', miNombre);
    setStoredRoomCode(salaA);
    setError('');
    document.getElementById('salaV').innerText = salaA;
    document.getElementById('codigoSalaV').innerText = salaA;
    syncAudioUi();
    try {
        new QRious({ element: document.getElementById('qr-canvas'), value: buildJoinUrl(), size: 170, level: 'H' });
    } catch (_) {}
    mostrarApp();
    registrarConexion();
    escuchar();
}

function escuchar() {
    if (activeSalaListenerRef) activeSalaListenerRef.off('value');
    activeSalaListenerRef = salaRef();
    activeSalaListenerRef.on('value', (snap) => {
        const sala = snap.val();
        if (!sala) {
            updateStatus(t('errors.roomClosedLive'));
            showToast(t('errors.roomClosedLive'), 'error', 3600);
            return;
        }
        salaMetaCache = sala;
        jugadoresCache = sala.jugadores || {};
        estadoCache = sala.estado_juego || estadoJuegoBase(FASES.LOBBY);
        if (miId && !jugadoresCache[miId]) {
            mostrarPantallaExpulsado();
            return;
        }
        esHost = sala.host_uid === miUid;
        normalizarBasesDeJugadores();
        renderLobby();
        renderPlayers();
        renderMyStats();
        renderEstado();
        renderHostControls();
        syncAudioUi();
        renderContextGuide();
        if (debeReproducirAudioLocal() && estadoCache.cancion_actual?.spotifyId && salaMetaCache.estado_sala === ESTADO_EN_PARTIDA) {
            const spotifyId = estadoCache.cancion_actual.spotifyId;
            const debeForzarPlay = audioGestureReady && currentSpotifyTrack !== spotifyId;
            reproducirSpotify(spotifyId, debeForzarPlay);
        }
    }, (err) => {
        const msg = friendlyFirebaseError(err, t('errors.connectionLost'));
        updateStatus(msg);
        showToast(msg, 'error', 4200);
    });
}
