function genSala(l) {
    let r = '';
    const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < l; i += 1) r += c.charAt(Math.floor(Math.random() * c.length));
    return r;
}

function randomDecadaInicial() {
    return DECADAS_INICIALES[Math.floor(Math.random() * DECADAS_INICIALES.length)];
}

function totalJugadores() {
    return Object.keys(jugadoresCache || {}).length;
}

function now() {
    return Date.now();
}

function sortNums(arr) {
    return [...arr].map(Number).filter((v) => !Number.isNaN(v)).sort((a, b) => a - b);
}

function buildJoinUrl() {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('sala', salaA);
    return url.href;
}

function buildTvUrl() {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    if (url.pathname.endsWith('/')) {
        url.pathname = `${url.pathname}tv.html`;
    } else {
        url.pathname = url.pathname.replace(/[^/]*$/, 'tv.html');
    }
    url.searchParams.set('sala', salaA);
    return url.href;
}

function lastRoomKey() {
    return 'hitster_last_room_v2';
}

function getStoredRoomCode() {
    return localStorage.getItem(lastRoomKey()) || '';
}

function setStoredRoomCode(sala) {
    if (sala) localStorage.setItem(lastRoomKey(), sala);
}

function clearStoredRoomCode() {
    localStorage.removeItem(lastRoomKey());
}

function limpiarLocalStorageLegado() {
    const keys = ['hitster_last_room'];
    for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hitster_player_id_')) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
}

function nuevaIdJugador() {
    return salaRef().child('jugadores').push().key || (`p_${now()}`);
}

function nuevoIdEquipo() {
    return salaRef().child('equipos').push().key || (`t_${now()}`);
}

function colorEquipo(index) {
    return TEAM_PALETTE[index % TEAM_PALETTE.length];
}

function textoGanador(nombre) {
    return nombre ? t('summary.winner', { name: nombre }) : t('status.gameOver');
}

function lanzarConfetiGanador(nombre, key = '', modo = 'mobile') {
    if (!nombre || !document?.body) return;
    const celebrationKey = `${modo}:${key || nombre}`;
    if (window.__ymlsConfettiKey === celebrationKey) return;
    window.__ymlsConfettiKey = celebrationKey;

    const anterior = document.querySelector('.winner-confetti-layer');
    if (anterior) anterior.remove();

    const layer = document.createElement('div');
    layer.className = `winner-confetti-layer ${modo === 'tv' ? 'winner-confetti-tv' : ''}`;
    layer.setAttribute('aria-hidden', 'true');

    const banner = document.createElement('div');
    banner.className = 'winner-confetti-banner';
    banner.textContent = textoGanador(nombre);
    layer.appendChild(banner);

    const colors = ['#44F4FF', '#FF4FD8', '#9BFF4F', '#FFE45E', '#FF7043', '#B04CFF', '#1DB954'];
    const total = modo === 'tv' ? 150 : 90;
    for (let i = 0; i < total; i += 1) {
        const piece = document.createElement('span');
        piece.className = 'winner-confetti-piece';
        piece.style.setProperty('--x', `${Math.random() * 100}vw`);
        piece.style.setProperty('--drift', `${(Math.random() * 220) - 110}px`);
        piece.style.setProperty('--rot', `${(Math.random() * 960) + 360}deg`);
        piece.style.setProperty('--delay', `${Math.random() * 2.8}s`);
        piece.style.setProperty('--dur', `${7.2 + Math.random() * 4.2}s`);
        piece.style.setProperty('--color', colors[i % colors.length]);
        if (i % 3 === 0) piece.classList.add('round');
        if (i % 5 === 0) piece.classList.add('wide');
        layer.appendChild(piece);
    }

    document.body.appendChild(layer);
    window.setTimeout(() => {
        if (layer.isConnected) layer.remove();
    }, modo === 'tv' ? 13500 : 11500);
}

function equipoBase(colorIndex, orden = now()) {
    const color = colorEquipo(colorIndex);
    return {
        nombre: i18nValue(`teams.palette.${color.key}`, color.name),
        color_index: colorIndex,
        color_key: color.key,
        color: color.color,
        color_rgb: color.rgb,
        tokens: 3,
        base: randomDecadaInicial(),
        linea: [],
        turno_miembro_idx: 0,
        orden
    };
}

function jugadorBase(nombre, teamId = '', uid = miUid) {
    return {
        nombre,
        uid,
        team_id: teamId || '',
        tokens: 3,
        base: randomDecadaInicial(),
        linea: [],
        conectado: true,
        ultimaConexion: now(),
        creado: now()
    };
}

function crearIcono(nombre, alt = '') {
    const img = document.createElement('img');
    img.className = `ui-icon ui-icon-${nombre}`;
    img.src = ICONOS[nombre] || '';
    img.alt = alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    return img;
}

function pintarStatConIcono(contenedor, icono, texto, alt) {
    contenedor.textContent = '';
    contenedor.classList.add('icon-stat');
    contenedor.appendChild(crearIcono(icono, alt));
    const valor = document.createElement('span');
    valor.textContent = texto;
    contenedor.appendChild(valor);
}

function equiposCache() {
    return salaMetaCache.equipos || {};
}

function miembrosEquipo(teamId, players = jugadoresCache) {
    return Object.entries(players || {})
        .filter(([, jugador]) => (jugador?.team_id || '') === teamId)
        .sort(([, a], [, b]) => (Number(a?.creado) || 0) - (Number(b?.creado) || 0));
}

function equipoPorId(teamId, equipos = equiposCache()) {
    return teamId ? ((equipos || {})[teamId] || null) : null;
}

function teamIdValido(teamId, players = jugadoresCache, equipos = equiposCache()) {
    return !!(teamId && equipoPorId(teamId, equipos) && miembrosEquipo(teamId, players).length);
}

function equipoOrdenadoLista(players = jugadoresCache, equipos = equiposCache()) {
    return Object.entries(equipos || {})
        .filter(([teamId]) => miembrosEquipo(teamId, players).length)
        .sort(([, a], [, b]) => (Number(a?.orden) || 0) - (Number(b?.orden) || 0));
}

function jugadoresSoloLista(players = jugadoresCache, equipos = equiposCache()) {
    return Object.entries(players || {})
        .filter(([, jugador]) => !teamIdValido(jugador?.team_id || '', players, equipos))
        .sort(([, a], [, b]) => (Number(a?.creado) || 0) - (Number(b?.creado) || 0));
}

function entidadKey(tipo, id) {
    return `${tipo}:${id}`;
}

function entidadDesdeEquipo(teamId, team, players = jugadoresCache) {
    const members = miembrosEquipo(teamId, players);
    if (!team || !members.length) return null;
    return {
        type: 'team',
        id: teamId,
        key: entidadKey('team', teamId),
        orden: Number(team?.orden) || 0,
        name: team.nombre || t('teams.teamFallback'),
        data: team,
        members,
        colorRgb: team.color_rgb || '255, 215, 0'
    };
}

function entidadDesdeJugador(playerId, player) {
    if (!player) return null;
    return {
        type: 'player',
        id: playerId,
        key: entidadKey('player', playerId),
        orden: Number(player?.creado) || 0,
        name: player.nombre || t('cards.player'),
        data: player,
        members: [[playerId, player]],
        colorRgb: ''
    };
}

function entidadesActivasLista(players = jugadoresCache, equipos = equiposCache()) {
    const entidades = [];
    equipoOrdenadoLista(players, equipos).forEach(([teamId, team]) => {
        const entity = entidadDesdeEquipo(teamId, team, players);
        if (entity) entidades.push(entity);
    });
    jugadoresSoloLista(players, equipos).forEach(([playerId, player]) => {
        const entity = entidadDesdeJugador(playerId, player);
        if (entity) entidades.push(entity);
    });
    return entidades.sort((a, b) => (a.orden - b.orden) || a.name.localeCompare(b.name));
}

function totalEntidadesActivas(players = jugadoresCache, equipos = equiposCache()) {
    return entidadesActivasLista(players, equipos).length;
}

function totalEquiposActivos(players = jugadoresCache, equipos = equiposCache()) {
    return equipoOrdenadoLista(players, equipos).length;
}

function esSolitario() {
    return totalEntidadesActivas() <= 1;
}

function puedeBonusMoneda() {
    return totalEntidadesActivas() > 1;
}

function miEquipoId() {
    const teamId = jugadoresCache[miId]?.team_id || '';
    return teamIdValido(teamId) ? teamId : '';
}

function entidadDeJugador(playerId, players = jugadoresCache, equipos = equiposCache()) {
    const player = (players || {})[playerId];
    if (!player) return null;
    const teamId = player.team_id || '';
    if (teamIdValido(teamId, players, equipos)) {
        return entidadDesdeEquipo(teamId, equipos[teamId], players);
    }
    return entidadDesdeJugador(playerId, player);
}

function entidadPorTurno(estado = estadoCache, players = jugadoresCache, equipos = equiposCache()) {
    const tipo = estado?.turno_entidad_tipo || '';
    const id = estado?.turno_entidad_id || '';
    if (!tipo || !id) return null;
    if (tipo === 'team') return entidadDesdeEquipo(id, equipos[id], players);
    if (tipo === 'player') return entidadDesdeJugador(id, players[id]);
    return null;
}

function entidadEsMia(entidad, playerId = miId, players = jugadoresCache, equipos = equiposCache()) {
    const mia = entidadDeJugador(playerId, players, equipos);
    return !!(entidad && mia && entidad.type === mia.type && entidad.id === mia.id);
}

function entidadNombre(tipo, id, players = jugadoresCache, equipos = equiposCache()) {
    return tipo === 'team'
        ? (equipos?.[id]?.nombre || t('teams.teamFallback'))
        : (players?.[id]?.nombre || t('cards.player'));
}

function rutaEntidadCampo(tipo, id, campo) {
    return tipo === 'team' ? `equipos/${id}/${campo}` : `jugadores/${id}/${campo}`;
}

function baseJugador(j) {
    const base = Number(j?.base);
    return DECADAS_INICIALES.includes(base) ? base : null;
}

function normalizarCarta(raw) {
    if (raw == null) return null;
    const data = raw && typeof raw === 'object' ? raw : {};
    const y = Number(data.y ?? data.year ?? raw);
    if (Number.isNaN(y)) return null;
    return {
        y,
        t: String(data.t || data.title || '').trim(),
        a: String(data.a || data.artist || '').trim(),
        spotifyId: data.spotifyId || '',
        coverUrl: String(data.coverUrl || '').trim(),
        base: !!data.base,
        legacy: !(raw && typeof raw === 'object')
    };
}

function decadaDeYear(year) {
    const y = Number(year);
    if (Number.isNaN(y)) return 0;
    return Math.floor(y / 10) * 10;
}

function textoDecadaCorta(year) {
    const decada = decadaDeYear(year);
    if (!decada) return '';
    return `${String(decada % 100).padStart(2, '0')}s`;
}

function colorDecada(year) {
    const colores = {
        1950: '46, 204, 113',
        1960: '52, 152, 219',
        1970: '241, 196, 15',
        1980: '255, 91, 143',
        1990: '155, 89, 182',
        2000: '0, 188, 212',
        2010: '29, 185, 84',
        2020: '255, 112, 67'
    };
    return colores[decadaDeYear(year)] || '255, 215, 0';
}

const TEST_COVER_URL = 'assets/testcover.jpeg';

function coverUrlCarta(carta) {
    return carta?.coverUrl || TEST_COVER_URL;
}

function cartaDesdeCancion(cancion) {
    return normalizarCarta(cancion);
}

function listaValores(valor) {
    if (Array.isArray(valor)) return valor;
    if (valor && typeof valor === 'object') return Object.values(valor);
    return [];
}

function ordenarCartas(cartas) {
    return listaValores(cartas)
        .map(normalizarCarta)
        .filter(Boolean)
        .sort((a, b) => (a.y - b.y) || (a.t || '').localeCompare(b.t || ''));
}

function itemBaseJugador(j) {
    const base = baseJugador(j);
    return base ? { y: base, t: '', a: '', base: true } : null;
}

function ordenarLineaItems(items) {
    return listaValores(items)
        .map(normalizarCarta)
        .filter(Boolean)
        .sort((a, b) => (a.y - b.y) || (a.base ? -1 : 0) || (b.base ? 1 : 0) || (a.t || '').localeCompare(b.t || ''));
}

function cartasEntidad(entidad) {
    return ordenarCartas(entidad?.linea || []);
}

function lineaReferenciaEntidad(entidad) {
    const base = itemBaseJugador(entidad);
    return ordenarLineaItems([...(base ? [base] : []), ...cartasEntidad(entidad)]);
}

function cartasJugador(j) {
    return cartasEntidad(j);
}

function lineaReferenciaJugador(j) {
    return lineaReferenciaEntidad(j);
}

function primerIndiceColorLibre(equipos = equiposCache()) {
    const usados = new Set(
        Object.values(equipos || {})
            .map((equipo) => Number(equipo?.color_index))
            .filter((value) => !Number.isNaN(value))
    );
    for (let i = 0; i < TEAM_PALETTE.length; i += 1) {
        if (!usados.has(i)) return i;
    }
    return 0;
}

function normalizarBasesDeJugadores() {
    if (!esHost) return;
    const updates = {};

    Object.entries(jugadoresCache || {}).forEach(([id, j]) => {
        if (!baseJugador(j)) updates[`jugadores/${id}/base`] = randomDecadaInicial();
        if (j?.team_id && !teamIdValido(j.team_id, jugadoresCache, equiposCache())) {
            updates[`jugadores/${id}/team_id`] = '';
        }
    });

    Object.entries(equiposCache() || {}).forEach(([teamId, equipo]) => {
        if (!baseJugador(equipo)) updates[`equipos/${teamId}/base`] = randomDecadaInicial();
    });

    if (Object.keys(updates).length) salaRef().update(updates).catch(() => {});
}

async function genSalaUnica(l = 4) {
    for (let i = 0; i < 12; i += 1) {
        const codigo = genSala(l);
        const snap = await db.ref(`salas/${codigo}`).get();
        if (!snap.exists()) return codigo;
    }
    throw new Error(t('errors.roomCodeFailed'));
}

function registrarConexion() {
    if (!salaA || !miId) return;
    const jugadorRef = salaRef().child(`jugadores/${miId}`);
    jugadorRef.update({ conectado: true, ultimaConexion: now() }).catch(() => {});
    try {
        jugadorRef.child('conectado').onDisconnect().set(false);
        jugadorRef.child('ultimaConexion').onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
    } catch (_) {}
}

function renderConnectionPill(state = '', msg = '') {
    const el = document.getElementById('connection-pill');
    if (!el) return;
    if (connectionPillTimer) clearTimeout(connectionPillTimer);

    if (!msg) {
        el.classList.add('hidden');
        el.textContent = '';
        return;
    }

    el.textContent = msg;
    el.className = `connection-pill ${state || ''}`;
    el.classList.remove('hidden');
    if (state === 'online') {
        connectionPillTimer = setTimeout(() => {
            el.classList.add('hidden');
        }, 2200);
    }
}

function watchFirebaseConnection() {
    if (firebaseConnectionStarted) return;
    firebaseConnectionStarted = true;
    try {
        db.ref('.info/connected').on('value', (snap) => {
            const connected = snap.val() === true;
            firebaseIsConnected = connected;

            if (connectionOfflineTimer) clearTimeout(connectionOfflineTimer);
            if (!connected) {
                connectionOfflineTimer = setTimeout(() => {
                    if (firebaseIsConnected) return;
                    firebaseWasDisconnected = true;
                    renderConnectionPill('offline', t('connection.offline'));
                    if (salaA && miId) showToast(t('connection.offlineDetail'), 'error', 3400);
                }, firebaseConnectionSeen ? 500 : 1500);
                firebaseConnectionSeen = true;
                return;
            }

            firebaseConnectionSeen = true;
            if (salaA && miId) registrarConexion();
            if (firebaseWasDisconnected) {
                firebaseWasDisconnected = false;
                renderConnectionPill('online', t('connection.online'));
                if (salaA && miId) showToast(t('connection.onlineDetail'), 'success', 2200);
            } else {
                renderConnectionPill('', '');
            }
        });
    } catch (_) {}
}

function showToast(msg, type = 'info', duration = 2600) {
    const el = document.getElementById('app-toast');
    if (!el || !msg) return;
    if (toastTimer) clearTimeout(toastTimer);
    el.textContent = msg;
    el.className = `app-toast ${type || 'info'}`;
    el.classList.remove('hidden');
    requestAnimationFrame(() => el.classList.add('show'));
    toastTimer = setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.classList.add('hidden'), 220);
    }, duration);
}

function friendlyFirebaseError(err, fallback = t('errors.generic')) {
    const code = String(err?.code || '');
    const message = String(err?.message || '');
    const hayPermiso = code === 'PERMISSION_DENIED' || code === 'permission-denied' || /permission[_ -]?denied/i.test(message);
    const hayConexion = /network|offline|unavailable|disconnected/i.test(`${code} ${message}`);
    if (String(code).startsWith('auth/')) return t('errors.authFailed');
    if (hayPermiso) return t('errors.permissionDenied');
    if (hayConexion) return t('errors.connectionLost');
    return message || fallback;
}

function setError(msg, type = 'error') {
    const el = document.getElementById('error-msg');
    const setup = document.getElementById('setup');
    const setupHidden = !!setup?.classList.contains('hidden');
    if (el) {
        el.innerText = msg || '';
        el.classList.toggle('is-info', !!msg && (msg === t('errors.creatingRoom') || msg === t('errors.connecting')));
    }
    if (msg && setupHidden) showToast(msg, type);
}

function mostrarApp() {
    document.getElementById('setup').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
}

function salaRef() {
    return db.ref(`salas/${salaA}`);
}

function updateStatus(msg) {
    document.getElementById('status-msg').innerText = msg || '';
}

function setEleccion(msg) {
    document.getElementById('eleccionV').innerText = msg || '';
}

function setSpotifyMsg(msg) {
    const el = document.getElementById('spotify-msg');
    if (el) el.innerText = msg || '';
}

function setSpotifyStageVisible(visible) {
    const el = document.getElementById('spotify-stage');
    if (el) el.classList.toggle('active', !!visible);
}

function debeReproducirAudioLocal() {
    return esHost || audioLocalEnabled;
}

function syncAudioUi() {
    const quiereAudio = debeReproducirAudioLocal();
    const panel = document.getElementById('spotify-panel');
    if (panel) panel.classList.toggle('hidden', esHost || !audioLocalEnabled);
    setSpotifyStageVisible(quiereAudio);

    const option = document.getElementById('audio-option-panel');
    if (option) option.classList.toggle('hidden', esHost);

    const toggle = document.getElementById('audio-local-toggle');
    if (toggle) toggle.checked = audioLocalEnabled;
}

function toggleAudioLocal(checked) {
    audioLocalEnabled = !!checked;
    localStorage.setItem(AUDIO_LOCAL_KEY, audioLocalEnabled ? '1' : '0');
    syncAudioUi();

    if (audioLocalEnabled) {
        activarSpotify();
    } else if (!esHost) {
        try { embedController?.pause?.(); } catch (_) {}
        setSpotifyMsg(t('audio.localOff'));
    }
}

function modoActual() {
    return salaMetaCache?.modo_dificultad || MODOS.FACIL;
}

function objetivoCartasActual() {
    return OBJETIVO_CARTAS;
}

function datosReconectar() {
    limpiarLocalStorageLegado();
    const sala = getStoredRoomCode();
    const nombre = localStorage.getItem('hitster_nombre') || '';
    if (!sala || !nombre) return null;
    return { sala, nombre };
}

async function copyTextToClipboard(text) {
    const value = String(text || '');
    if (!value) return false;
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(value);
            return true;
        } catch (_) {}
    }
    const tmp = document.createElement('textarea');
    tmp.value = value;
    tmp.setAttribute('readonly', 'readonly');
    tmp.style.position = 'fixed';
    tmp.style.opacity = '0';
    document.body.appendChild(tmp);
    tmp.focus();
    tmp.select();
    let ok = false;
    try {
        ok = document.execCommand('copy');
    } catch (_) {}
    document.body.removeChild(tmp);
    return ok;
}

function setShareFeedback(msg, type = 'info') {
    const el = document.getElementById('share-feedback');
    if (el) el.innerText = msg || '';
    if (msg) showToast(msg, type, 1900);
}

function renderCancionRevelada(cancion) {
    const cont = document.getElementById('cancionV');
    const panel = document.getElementById('resultado-panel');
    cont.innerHTML = '';
    const carta = normalizarCarta(cancion);
    if (!carta) return;
    if (panel) panel.style.setProperty('--decade-rgb', colorDecada(carta.y));

    const shell = document.createElement('div');
    shell.className = 'reveal-card-shell';

    const flip = document.createElement('div');
    flip.className = 'reveal-card-flip';

    const card = document.createElement('div');
    card.className = 'reveal-card reveal-card-face reveal-card-front';
    card.style.setProperty('--decade-rgb', colorDecada(carta.y));

    const back = document.createElement('div');
    back.className = 'reveal-card-face reveal-card-back';
    back.style.setProperty('--decade-rgb', colorDecada(carta.y));
    const cover = document.createElement('img');
    cover.className = 'reveal-cover';
    cover.src = coverUrlCarta(carta);
    cover.alt = '';
    cover.loading = 'eager';
    cover.fetchPriority = 'high';
    cover.decoding = 'async';
    back.appendChild(cover);

    const yearWrap = document.createElement('div');
    yearWrap.className = 'reveal-year-wrap';

    const year = document.createElement('div');
    year.className = 'reveal-year';
    year.textContent = carta.y || '--';

    const decade = document.createElement('div');
    decade.className = 'reveal-decade';
    decade.textContent = textoDecadaCorta(carta.y);

    const song = document.createElement('div');
    song.className = 'reveal-song';

    const title = document.createElement('span');
    title.className = 'reveal-title';
    title.textContent = carta.t || t('cards.song');

    const artist = document.createElement('span');
    artist.className = 'reveal-artist';
    artist.textContent = carta.a || t('cards.artist');

    song.appendChild(title);
    song.appendChild(artist);
    yearWrap.appendChild(year);
    yearWrap.appendChild(decade);
    card.appendChild(yearWrap);
    card.appendChild(song);
    flip.appendChild(card);
    flip.appendChild(back);
    shell.appendChild(flip);
    cont.appendChild(shell);
}

function limpiarTextoAdivinanza(str) {
    return String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/[^\w\s]|_/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function distanciaEdicion(a, b) {
    const s1 = limpiarTextoAdivinanza(a);
    const s2 = limpiarTextoAdivinanza(b);
    const costos = [];
    for (let i = 0; i <= s1.length; i += 1) {
        let ultimo = i;
        for (let j = 0; j <= s2.length; j += 1) {
            if (i === 0) {
                costos[j] = j;
            } else if (j > 0) {
                let nuevo = costos[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    nuevo = Math.min(Math.min(nuevo, ultimo), costos[j]) + 1;
                }
                costos[j - 1] = ultimo;
                ultimo = nuevo;
            }
        }
        if (i > 0) costos[s2.length] = ultimo;
    }
    return costos[s2.length];
}

function similitudTexto(a, b) {
    const limpioA = limpiarTextoAdivinanza(a);
    const limpioB = limpiarTextoAdivinanza(b);
    const largo = Math.max(limpioA.length, limpioB.length);
    if (!largo) return 1;
    return (largo - distanciaEdicion(limpioA, limpioB)) / largo;
}

function listaTextoAlias(valor) {
    if (Array.isArray(valor)) return valor;
    if (valor && typeof valor === 'object') return Object.values(valor);
    return valor ? [valor] : [];
}

function compactarAliases(valores) {
    const vistos = new Set();
    return valores
        .flatMap(listaTextoAlias)
        .map((valor) => String(valor || '').trim())
        .filter(Boolean)
        .filter((valor) => {
            const key = limpiarTextoAdivinanza(valor);
            if (!key || vistos.has(key)) return false;
            vistos.add(key);
            return true;
        });
}

function aliasesDeclarados(cancion, tipo) {
    const aliases = cancion?.aliases || {};
    const keys = tipo === 'artist'
        ? ['artist', 'artists']
        : ['title', 'titles', 'song', 'songs'];
    const directKeys = tipo === 'artist'
        ? ['artistAliases']
        : ['titleAliases', 'songAliases'];
    return compactarAliases([
        ...keys.flatMap((key) => listaTextoAlias(aliases[key])),
        ...directKeys.flatMap((key) => listaTextoAlias(cancion?.[key]))
    ]);
}

function quitarColaboraciones(texto) {
    return String(texto || '')
        .replace(/\s*[\(\[]\s*(?:feat\.?|ft\.?|featuring|with|con)\b[^)\]]*[\)\]]/ig, '')
        .replace(/\s+(?:feat\.?|ft\.?|featuring|with|con)\b.*$/ig, '')
        .trim();
}

function partesColaboracion(texto) {
    const original = String(texto || '');
    const partes = [];
    const grupos = original.matchAll(/[\(\[]([^)\]]+)[)\]]/g);
    for (const match of grupos) {
        if (/(?:feat\.?|ft\.?|featuring|with|con)\b/i.test(match[1])) partes.push(match[1]);
    }
    const cola = original.match(/\b(?:feat|ft|featuring|with|con)\.?\s+(.+)$/i);
    if (cola?.[1]) partes.push(cola[1]);
    return partes;
}

function limpiarMarcadorColaboracion(texto) {
    return String(texto || '')
        .replace(/^\s*(?:feat|ft|featuring|with|con)\.?\s*/i, '')
        .trim();
}

function separarNombresColaboracion(texto) {
    const limpio = limpiarMarcadorColaboracion(texto);
    if (!limpio) return [];
    return limpio
        .split(/\s*(?:,|&|\+)\s*|\s+(?:and|y|x)\s+/i)
        .map((parte) => parte.trim())
        .filter((parte) => parte.length >= 2);
}

function aliasesArtistAutomaticos(artist) {
    const texto = String(artist || '').trim();
    const sinColaboraciones = quitarColaboraciones(texto);
    const colaboradores = partesColaboracion(texto).flatMap((parte) => [
        limpiarMarcadorColaboracion(parte),
        ...separarNombresColaboracion(parte)
    ]);
    const combos = sinColaboraciones
        ? colaboradores.flatMap((colaborador) => [
            `${sinColaboraciones} ${colaborador}`,
            `${sinColaboraciones} y ${colaborador}`,
            `${sinColaboraciones} con ${colaborador}`
        ])
        : [];
    return compactarAliases([texto, sinColaboraciones, colaboradores, combos]);
}

function aliasesTitleAutomaticos(title) {
    const texto = String(title || '').trim();
    const sinVersion = texto
        .replace(/\s+-\s+(?:.*\b(?:mix|remix|version|versi[oó]n|edit|remaster|album)\b.*)$/i, '')
        .trim();
    return compactarAliases([texto, sinVersion]);
}

function aliasesCancion(cancion) {
    return {
        title: compactarAliases([
            cancion?.title,
            aliasesTitleAutomaticos(cancion?.title || ''),
            aliasesDeclarados(cancion, 'title')
        ]),
        artist: compactarAliases([
            cancion?.artist,
            aliasesArtistAutomaticos(cancion?.artist || ''),
            aliasesDeclarados(cancion, 'artist')
        ])
    };
}

function candidatosRespuesta(cancion, tipo) {
    const aliases = aliasesCancion(cancion);
    return tipo === 'artist' ? aliases.artist : aliases.title;
}

function mejorSimilitudTexto(guess, candidatos) {
    const lista = compactarAliases(candidatos);
    if (!lista.length) return { score: similitudTexto(guess, ''), match: '' };
    return lista.reduce((mejor, candidato) => {
        const score = similitudTexto(guess, candidato);
        return score > mejor.score ? { score, match: candidato } : mejor;
    }, { score: 0, match: '' });
}

function verificarRespuestaAutomatica(guess, cancion) {
    const titleMatch = mejorSimilitudTexto(guess, candidatosRespuesta(cancion, 'title'));
    const artistMatch = mejorSimilitudTexto(guess, candidatosRespuesta(cancion, 'artist'));
    const titleScore = titleMatch.score;
    const artistScore = artistMatch.score;
    const mejorScore = Math.max(titleScore, artistScore);
    const aciertoTitulo = titleScore >= 0.7;
    const aciertoArtista = artistScore >= 0.7;
    return {
        correcto: aciertoTitulo || aciertoArtista,
        titleScore,
        artistScore,
        mejorScore,
        titleMatch: titleMatch.match,
        artistMatch: artistMatch.match,
        tipo: aciertoTitulo && titleScore >= artistScore ? 'song' : (aciertoArtista ? 'artist' : (titleScore >= artistScore ? 'song' : 'artist'))
    };
}

function verificarRespuestaCompleta(songGuess, artistGuess, cancion) {
    const songMatch = mejorSimilitudTexto(songGuess, candidatosRespuesta(cancion, 'title'));
    const artistMatch = mejorSimilitudTexto(artistGuess, candidatosRespuesta(cancion, 'artist'));
    const songScore = songMatch.score;
    const artistScore = artistMatch.score;
    return {
        correcto: songScore >= 0.7 && artistScore >= 0.7,
        songScore,
        artistScore,
        songMatch: songMatch.match,
        artistMatch: artistMatch.match
    };
}
