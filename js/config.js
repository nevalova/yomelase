const firebaseConfig = {
    apiKey: "AIzaSyA_WChhOabs671aPhX5uhX3FaLnn_YOc0c",
    authDomain: "party-music-3faae.firebaseapp.com",
    databaseURL: "https://party-music-3faae-default-rtdb.firebaseio.com",
    projectId: "party-music-3faae"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const DECADAS_INICIALES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
const FASES = {
    LOBBY: 'LOBBY',
    LISTA: 'LISTA',
    PRE_RONDA: 'PRE_RONDA',
    JUGANDO: 'JUGANDO',
    ESPERA_ROBO: 'ESPERA_ROBO',
    REVELANDO: 'REVELANDO',
    VOTANDO: 'VOTANDO',
    RESULTADO: 'RESULTADO',
    FINAL: 'FINAL'
};
const ESTADO_EN_PARTIDA = 'EN_PARTIDA';
const OBJETIVO_CARTAS = 10;
const MAX_TOKENS = 5;
const MAX_JUGADORES = 10;
const MAX_EQUIPOS = 9;
const MODOS = {
    FACIL: 'FACIL',
    DIFICIL: 'DIFICIL'
};
const TEAM_PALETTE = [
    { key: 'cyan', name: 'Equipo Cian', color: '#44F4FF', rgb: '68, 244, 255' },
    { key: 'magenta', name: 'Equipo Magenta', color: '#FF4FD8', rgb: '255, 79, 216' },
    { key: 'lime', name: 'Equipo Lima', color: '#9BFF4F', rgb: '155, 255, 79' },
    { key: 'orange', name: 'Equipo Naranja', color: '#FF9F40', rgb: '255, 159, 64' },
    { key: 'violet', name: 'Equipo Violeta', color: '#B04CFF', rgb: '176, 76, 255' },
    { key: 'yellow', name: 'Equipo Solar', color: '#FFE45E', rgb: '255, 228, 94' },
    { key: 'aqua', name: 'Equipo Aqua', color: '#3EE0C6', rgb: '62, 224, 198' },
    { key: 'pink', name: 'Equipo Rosa', color: '#FF70C1', rgb: '255, 112, 193' },
    { key: 'blue', name: 'Equipo Azul', color: '#5FA8FF', rgb: '95, 168, 255' }
];
const ICONOS = {
    carta: 'assets/icons/card.svg',
    moneda: 'assets/icons/coin.svg'
};
const AUDIO_LOCAL_KEY = 'hitster_audio_local_enabled';

let salaA = '';
let miId = '';
let esHost = false;
let misT = 0;
let miL = [];
let miCartas = [];
let jugadoresCache = {};
let estadoCache = {};
let salaMetaCache = {};
let embedController = null;
let pendingSpotifyTrack = null;
let currentSpotifyTrack = '';
let activeSalaListenerRef = null;
let audioLocalEnabled = false;
let audioGestureReady = false;
