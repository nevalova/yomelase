function estadoJuegoBase(fase = FASES.LOBBY){
    return {
        fase,
        ronda_id: null,
        cierre_fase_en: 0,
        revelar: false,
        resumen_resultado: '',
        resumen_resultado_i18n: null,
        resumen_votos: '',
        resumen_votos_i18n: null,
        ganador: '',
        cancion_actual: null,
        seleccion_turno: null,
        respuesta_auto: null,
        robos: {},
        votos: {},
        turno_de: '',
        nombre_turno: '',
        turno_equipo_id: '',
        nombre_equipo_turno: '',
        turno_miembro_idx: 0
    };
}

function crearDestinoEquipoParaNuevoJugador(sala){
    const jugadores = sala.jugadores || {};
    const equipos = sala.equipos || {};
    if (totalEquiposActivos(jugadores, equipos) < MAX_EQUIPOS) {
        const teamId = nuevoIdEquipo();
        const colorIndex = primerIndiceColorLibre(equipos);
        return {
            teamId,
            teamData: equipoBase(colorIndex, now())
        };
    }
    return {
        teamId: equipoMasPequenoId(jugadores, equipos),
        teamData: null
    };
}

async function crearSala() {
    const miNombre = document.getElementById('nombreI').value.trim();
    if (!miNombre) return setError(t('errors.nameRequired'));
    setError(t('errors.creatingRoom'));
    try {
        salaA = await genSalaUnica(4);
        miId = nuevaIdJugador();
        esHost = true;
        const teamId = nuevoIdEquipo();
        await salaRef().set({
            creada: now(),
            estado_sala: FASES.LOBBY,
            host_id: miId,
            indice_turno: 0,
            canciones_usadas: [],
            estado_juego: estadoJuegoBase(FASES.LOBBY),
            equipos: {
                [teamId]: equipoBase(0, 0)
            },
            jugadores: {
                [miId]: jugadorBase(miNombre, teamId)
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
    const estadoSala = sala.estado_sala || FASES.LOBBY;
    const nombreNormalizado = miNombre.toLowerCase();
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

    miId = idEx || nuevaIdJugador();
    esHost = sala.host_id === miId;

    if (idEx) {
        const teamId = jugadores[miId]?.team_id || crearDestinoEquipoParaNuevoJugador(sala).teamId;
        const updates = {
            [`jugadores/${miId}/conectado`]: true,
            [`jugadores/${miId}/ultimaConexion`]: now(),
            [`jugadores/${miId}/team_id`]: teamId
        };
        await salaRef().update(updates);
    } else {
        if (Object.keys(jugadores).length >= MAX_JUGADORES) return setError(t('errors.roomFull', { max: MAX_JUGADORES }));
        const destino = crearDestinoEquipoParaNuevoJugador(sala);
        const updates = {
            [`jugadores/${miId}`]: jugadorBase(miNombre, destino.teamId)
        };
        if (destino.teamData) updates[`equipos/${destino.teamId}`] = destino.teamData;
        await salaRef().update(updates);
    }
    afterJoin(miNombre);
}

async function crearEquipoNeon(){
    if (!miId) return;
    const snap = await salaRef().get();
    const sala = snap.val() || {};
    const estadoSala = sala.estado_sala || FASES.LOBBY;
    if (estadoSala !== FASES.LOBBY && estadoSala !== FASES.LISTA) return;
    const jugadores = sala.jugadores || {};
    const equipos = sala.equipos || {};
    const currentTeamId = jugadores[miId]?.team_id || '';
    if (totalEquiposActivos(jugadores, equipos) >= MAX_EQUIPOS) {
        return setError(t('errors.maxTeams', { max: MAX_EQUIPOS }));
    }

    const nuevoTeamId = nuevoIdEquipo();
    const colorIndex = primerIndiceColorLibre(equipos);
    const updates = {
        [`equipos/${nuevoTeamId}`]: equipoBase(colorIndex, now()),
        [`jugadores/${miId}/team_id`]: nuevoTeamId
    };
    const restantes = miembrosEquipo(currentTeamId, jugadores).filter(([id]) => id !== miId);
    if (currentTeamId && !restantes.length) updates[`equipos/${currentTeamId}`] = null;
    await salaRef().update(updates);
    setError('');
}

async function cambiarMiEquipo(teamId){
    if (!miId || !teamId) return;
    const snap = await salaRef().get();
    const sala = snap.val() || {};
    const estadoSala = sala.estado_sala || FASES.LOBBY;
    if (estadoSala !== FASES.LOBBY && estadoSala !== FASES.LISTA) return;
    const jugadores = sala.jugadores || {};
    const equipos = sala.equipos || {};
    if (!equipos[teamId]) return;
    const currentTeamId = jugadores[miId]?.team_id || '';
    if (currentTeamId === teamId) return;

    const updates = {
        [`jugadores/${miId}/team_id`]: teamId
    };
    const restantes = miembrosEquipo(currentTeamId, jugadores).filter(([id]) => id !== miId);
    if (currentTeamId && !restantes.length) updates[`equipos/${currentTeamId}`] = null;
    await salaRef().update(updates);
    setError('');
}

function afterJoin(miNombre){
    localStorage.setItem('hitster_nombre', miNombre);
    setStoredPlayerId(salaA, miId);
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
    activeSalaListenerRef.on('value', async (snap) => {
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
