function genSala(l){ let r='', c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; for(let i=0;i<l;i++) r+=c.charAt(Math.floor(Math.random()*c.length)); return r; }
function randomDecadaInicial(){ return DECADAS_INICIALES[Math.floor(Math.random() * DECADAS_INICIALES.length)]; }
function totalJugadores(){ return Object.keys(jugadoresCache || {}).length; }
function esSolitario(){ return totalJugadores() <= 1; }
function puedeBonusMoneda(){ return totalJugadores() > 1; }
function now(){ return Date.now(); }
function sortNums(arr){ return [...arr].map(Number).filter(v => !Number.isNaN(v)).sort((a,b)=>a-b); }
function buildJoinUrl(){
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('sala', salaA);
    return url.href;
}
function playerIdKey(sala){ return `hitster_player_id_${sala}`; }
function lastRoomKey(){ return 'hitster_last_room_v2'; }
function getStoredPlayerId(sala){ return localStorage.getItem(playerIdKey(sala)); }
function setStoredPlayerId(sala, id){ if (sala && id) localStorage.setItem(playerIdKey(sala), id); }
function clearStoredPlayerId(sala){ if (sala) localStorage.removeItem(playerIdKey(sala)); }
function getStoredRoomCode(){ return localStorage.getItem(lastRoomKey()) || ''; }
function setStoredRoomCode(sala){ if (sala) localStorage.setItem(lastRoomKey(), sala); }
function clearStoredRoomCode(){ localStorage.removeItem(lastRoomKey()); }
function nuevaIdJugador(){ return salaRef().child('jugadores').push().key || ('p_' + now()); }
function crearIcono(nombre, alt = ''){
    const img = document.createElement('img');
    img.className = `ui-icon ui-icon-${nombre}`;
    img.src = ICONOS[nombre] || '';
    img.alt = alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    return img;
}
function pintarStatConIcono(contenedor, icono, texto, alt){
    contenedor.textContent = '';
    contenedor.classList.add('icon-stat');
    contenedor.appendChild(crearIcono(icono, alt));
    const valor = document.createElement('span');
    valor.textContent = texto;
    contenedor.appendChild(valor);
}
function jugadorBase(nombre){ return { nombre, tokens: 3, base: randomDecadaInicial(), linea: [], conectado: true, ultimaConexion: now() }; }
function baseJugador(j){
    const base = Number(j?.base);
    return DECADAS_INICIALES.includes(base) ? base : null;
}
function normalizarCarta(raw){
    if (raw == null) return null;
    const data = raw && typeof raw === 'object' ? raw : {};
    const y = Number(data.y ?? data.year ?? raw);
    if (Number.isNaN(y)) return null;
    return {
        y,
        t: String(data.t || data.titulo || data.title || '').trim(),
        a: String(data.a || data.artista || data.artist || '').trim(),
        spotifyId: data.spotifyId || '',
        base: !!data.base,
        legacy: !(raw && typeof raw === 'object')
    };
}
function decadaDeYear(year){
    const y = Number(year);
    if (Number.isNaN(y)) return 0;
    return Math.floor(y / 10) * 10;
}
function colorDecada(year){
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
function cartaDesdeCancion(cancion){
    return normalizarCarta({
        y: cancion?.y ?? cancion?.year,
        t: cancion?.t ?? cancion?.titulo,
        a: cancion?.a ?? cancion?.artista,
        spotifyId: cancion?.spotifyId || ''
    });
}
function listaValores(valor){
    if (Array.isArray(valor)) return valor;
    if (valor && typeof valor === 'object') return Object.values(valor);
    return [];
}
function ordenarCartas(cartas){
    return listaValores(cartas)
        .map(normalizarCarta)
        .filter(Boolean)
        .sort((a, b) => (a.y - b.y) || (a.t || '').localeCompare(b.t || ''));
}
function itemBaseJugador(j){
    const base = baseJugador(j);
    return base ? { y: base, t: '', a: '', base: true } : null;
}
function ordenarLineaItems(items){
    return listaValores(items)
        .map(normalizarCarta)
        .filter(Boolean)
        .sort((a, b) => (a.y - b.y) || (a.base ? -1 : 0) || (b.base ? 1 : 0) || (a.t || '').localeCompare(b.t || ''));
}
function cartasJugador(j){ return ordenarCartas(j?.linea || []); }
function lineaReferenciaJugador(j){
    const base = itemBaseJugador(j);
    return ordenarLineaItems([...(base ? [base] : []), ...cartasJugador(j)]);
}
function normalizarBasesDeJugadores(){
    if (!esHost || !jugadoresCache || !Object.keys(jugadoresCache).length) return;
    const updates = {};
    Object.entries(jugadoresCache).forEach(([id, j]) => {
        if (!baseJugador(j)) updates[`jugadores/${id}/base`] = randomDecadaInicial();
    });
    if (Object.keys(updates).length) salaRef().update(updates).catch(() => {});
}
async function genSalaUnica(l = 4){
    for (let i = 0; i < 12; i++) {
        const codigo = genSala(l);
        const snap = await db.ref(`salas/${codigo}`).get();
        if (!snap.exists()) return codigo;
    }
    throw new Error(t('errors.roomCodeFailed'));
}
function registrarConexion(){
    if (!salaA || !miId) return;
    const jugadorRef = salaRef().child(`jugadores/${miId}`);
    jugadorRef.update({ conectado: true, ultimaConexion: now() }).catch(() => {});
    try {
        jugadorRef.child('conectado').onDisconnect().set(false);
        jugadorRef.child('ultimaConexion').onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
    } catch (_) {}
}
function setError(msg){ document.getElementById('error-msg').innerText = msg || ''; }
function mostrarApp(){ document.getElementById('setup').classList.add('hidden'); document.getElementById('app').classList.remove('hidden'); }
function salaRef(){ return db.ref(`salas/${salaA}`); }
function updateStatus(msg){ document.getElementById('status-msg').innerText = msg || ''; }
function setEleccion(msg){ document.getElementById('eleccionV').innerText = msg || ''; }
function setSpotifyMsg(msg){
    const el = document.getElementById('spotify-msg');
    if (el) el.innerText = msg || '';
}
function setSpotifyStageVisible(visible){
    const el = document.getElementById('spotify-stage');
    if (el) el.classList.toggle('active', !!visible);
}
function debeReproducirAudioLocal(){
    return esHost || audioLocalEnabled;
}
function syncAudioUi(){
    const quiereAudio = debeReproducirAudioLocal();
    const panel = document.getElementById('spotify-panel');
    if (panel) panel.classList.toggle('hidden', !quiereAudio);
    setSpotifyStageVisible(quiereAudio);

    const option = document.getElementById('audio-option-panel');
    if (option) option.classList.toggle('hidden', esHost);

    const toggle = document.getElementById('audio-local-toggle');
    if (toggle) toggle.checked = audioLocalEnabled;
}
function toggleAudioLocal(checked){
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
function modoActual(){
    return salaMetaCache?.modo_dificultad || MODOS.FACIL;
}
function objetivoCartasActual(){
    const value = Number(salaMetaCache?.objetivo_cartas);
    return OBJETIVO_CARTAS_OPCIONES.includes(value) ? value : OBJETIVO_CARTAS_DEFAULT;
}
function datosReconectar(){
    const sala = getStoredRoomCode();
    const nombre = localStorage.getItem('hitster_nombre') || '';
    if (!sala || !nombre) return null;
    return { sala, nombre, playerId: getStoredPlayerId(sala) || '' };
}
async function copyTextToClipboard(text){
    const value = String(text || '');
    if (!value) return false;
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
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
function setShareFeedback(msg){
    const el = document.getElementById('share-feedback');
    if (el) el.innerText = msg || '';
}
function renderCancionRevelada(cancion){
    const cont = document.getElementById('cancionV');
    cont.innerHTML = '';
    if (!cancion) return;

    const card = document.createElement('div');
    card.className = 'reveal-card';

    const year = document.createElement('div');
    year.className = 'reveal-year';
    year.textContent = cancion.y || '--';

    const song = document.createElement('div');
    song.className = 'reveal-song';

    const title = document.createElement('span');
    title.className = 'reveal-title';
    title.textContent = cancion.t || t('cards.song');

    const artist = document.createElement('span');
    artist.className = 'reveal-artist';
    artist.textContent = cancion.a || t('cards.artist');

    song.appendChild(title);
    song.appendChild(artist);
    card.appendChild(year);
    card.appendChild(song);
    cont.appendChild(card);
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
    for (let i = 0; i <= s1.length; i++) {
        let ultimo = i;
        for (let j = 0; j <= s2.length; j++) {
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

function verificarRespuestaAutomatica(guess, cancion) {
    const titleScore = similitudTexto(guess, cancion?.t || '');
    const artistScore = similitudTexto(guess, cancion?.a || '');
    const mejorScore = Math.max(titleScore, artistScore);
    const aciertoTitulo = titleScore >= 0.7;
    const aciertoArtista = artistScore >= 0.7;
    return {
        correcto: aciertoTitulo || aciertoArtista,
        titleScore,
        artistScore,
        mejorScore,
        tipo: aciertoTitulo && titleScore >= artistScore ? 'song' : (aciertoArtista ? 'artist' : (titleScore >= artistScore ? 'song' : 'artist'))
    };
}

function verificarRespuestaCompleta(songGuess, artistGuess, cancion) {
    const songScore = similitudTexto(songGuess, cancion?.t || '');
    const artistScore = similitudTexto(artistGuess, cancion?.a || '');
    return {
        correcto: songScore >= 0.7 && artistScore >= 0.7,
        songScore,
        artistScore
    };
}
