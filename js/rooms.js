async function crearSala() {
    const miNombre = document.getElementById('nombreI').value.trim();
    if (!miNombre) return setError(t('errors.nameRequired'));
    setError(t('errors.creatingRoom'));
    try {
        salaA = await genSalaUnica(4);
        miId = nuevaIdJugador();
        esHost = true;
        const baseState = { fase: FASES.LOBBY, ronda_id: null, cierre_fase_en: 0, revelar: false, resumen_resultado: '', resumen_resultado_i18n: null, resumen_votos: '', resumen_votos_i18n: null, ganador: '', cancion_actual: null, seleccion_turno: null, robos: {}, votos: {}, turno_de: '', nombre_turno: '' };
        await salaRef().set({
            creada: now(),
            estado_sala: FASES.LOBBY,
            host_id: miId,
            indice_turno: 0,
            canciones_usadas: [],
            estado_juego: baseState,
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
    const estadoSala = sala.estado_sala || FASES.LOBBY;
    const nombreNormalizado = miNombre.toLowerCase();
    const storedId = getStoredPlayerId(salaA);
    const storedPlayer = storedId ? jugadores[storedId] : null;
    const puedeReconectar = !!storedPlayer && (storedPlayer.nombre || '').toLowerCase() === nombreNormalizado;
    if (estadoSala !== FASES.LOBBY && !puedeReconectar) {
        return setError(t('errors.gameStartedReconnect'));
    }
    let idEx = puedeReconectar ? storedId : null;
    if (!idEx) {
        for (const [id, j] of Object.entries(jugadores)) {
            if ((j.nombre || '').toLowerCase() === nombreNormalizado) { idEx = id; break; }
        }
    }
    miId = idEx || nuevaIdJugador();
    esHost = sala.host_id === miId;
    if (idEx) await salaRef().child(`jugadores/${miId}`).update({ conectado: true, ultimaConexion: now() });
    else await salaRef().child(`jugadores/${miId}`).set(jugadorBase(miNombre));
    afterJoin(miNombre);
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
        estadoCache = sala.estado_juego || { fase: FASES.LOBBY };
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
