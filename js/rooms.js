function lobbyEditable(estadoSala = salaMetaCache.estado_sala || FASES.LOBBY) {
    return estadoSala === FASES.LOBBY || estadoSala === FASES.LISTA;
}

async function crearSala() {
    const miNombre = document.getElementById('nombreI').value.trim();
    if (!miNombre) return setError(t('errors.nameRequired'));
    setError(t('errors.creatingRoom'));
    try {
        salaA = await genSalaUnica(4);
        miId = nuevaIdJugador();
        esHost = true;
        await salaRef().set({
            creada: now(),
            estado_sala: FASES.LOBBY,
            modo_dificultad: MODOS.FACIL,
            host_id: miId,
            indice_turno: 0,
            canciones_usadas: [],
            estado_juego: estadoJuegoBase(FASES.LOBBY),
            equipos: {},
            jugadores: {
                [miId]: jugadorBase(miNombre)
            }
        });
        afterJoin(miNombre);
    } catch (err) {
        setError(err?.message || t('errors.roomCreateFailed'));
    }
}

async function unirmeSala() {
    salaA = document.getElementById('salaI').value.toUpperCase().trim();
    const miNombre = document.getElementById('nombreI').value.trim();
    if (!miNombre) return setError(t('errors.nameRequired'));
    if (!salaA) return setError(t('errors.joinCodeRequired'));
    setError(t('errors.connecting'));

    const snap = await salaRef().get();
    if (!snap.exists()) return setError(t('errors.roomNotFound', { room: salaA }));

    const sala = snap.val() || {};
    const jugadores = sala.jugadores || {};
    const equipos = sala.equipos || {};
    const estadoSala = sala.estado_sala || FASES.LOBBY;
    const nombreNormalizado = miNombre.toLowerCase();
    if (!sala.modo_dificultad) await salaRef().child('modo_dificultad').set(MODOS.FACIL);
    const storedId = getStoredPlayerId(salaA);
    const storedPlayer = storedId ? jugadores[storedId] : null;
    const puedeReconectar = !!storedPlayer && (storedPlayer.nombre || '').toLowerCase() === nombreNormalizado;

    if (estadoSala !== FASES.LOBBY && estadoSala !== FASES.LISTA && !puedeReconectar) {
        return setError(t('errors.gameStartedReconnect'));
    }

    let idEx = puedeReconectar ? storedId : null;
    if (!idEx) {
        for (const [id, jugador] of Object.entries(jugadores)) {
            if ((jugador.nombre || '').toLowerCase() === nombreNormalizado) {
                idEx = id;
                break;
            }
        }
    }

    if (!idEx && Object.keys(jugadores).length >= MAX_JUGADORES) {
        return setError(t('errors.roomFull', { max: MAX_JUGADORES }));
    }

    miId = idEx || nuevaIdJugador();
    esHost = sala.host_id === miId;

    if (idEx) {
        const teamId = teamIdValido(jugadores[miId]?.team_id || '', jugadores, equipos) ? jugadores[miId].team_id : '';
        await salaRef().child(`jugadores/${miId}`).update({
            team_id: teamId,
            conectado: true,
            ultimaConexion: now()
        });
    } else {
        await salaRef().child(`jugadores/${miId}`).set(jugadorBase(miNombre));
    }

    afterJoin(miNombre);
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
    setShareFeedback(ok ? t('lobby.codeCopied') : t('lobby.copyFailed'));
}

async function copiarEnlaceSala() {
    const ok = await copyTextToClipboard(buildJoinUrl());
    setShareFeedback(ok ? t('lobby.linkCopied') : t('lobby.copyFailed'));
}

function renderReconnectCard() {
    const panel = document.getElementById('reconnect-panel');
    const note = document.getElementById('reconnect-note');
    const data = datosReconectar();
    if (!panel || !note) return;
    if (!data) {
        panel.classList.add('hidden');
        return;
    }
    note.innerText = t('setup.reconnectNote', { room: data.sala, name: data.nombre });
    panel.classList.remove('hidden');
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

function afterJoin(miNombre) {
    localStorage.setItem('hitster_nombre', miNombre);
    setStoredPlayerId(salaA, miId);
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
        if (!sala) return;
        salaMetaCache = sala;
        jugadoresCache = sala.jugadores || {};
        estadoCache = sala.estado_juego || estadoJuegoBase(FASES.LOBBY);
        esHost = sala.host_id === miId;
        normalizarBasesDeJugadores();
        renderLobby();
        renderPlayers();
        renderMyStats();
        renderEstado();
        renderHostControls();
        syncAudioUi();
        if (debeReproducirAudioLocal() && estadoCache.cancion_actual?.spotifyId && salaMetaCache.estado_sala === ESTADO_EN_PARTIDA) {
            const spotifyId = estadoCache.cancion_actual.spotifyId;
            const debeForzarPlay = audioGestureReady && currentSpotifyTrack !== spotifyId;
            reproducirSpotify(spotifyId, debeForzarPlay);
        }
    });
}
