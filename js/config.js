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
const MODOS = {
    FACIL: 'FACIL',
    DIFICIL: 'DIFICIL'
};
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
