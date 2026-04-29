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
const MAX_JUGADORES = 10;
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

(function enrichLocales() {
    const locales = window.YMLS_LOCALES = window.YMLS_LOCALES || {};
    const es = locales.es = locales.es || {};
    const en = locales.en = locales.en || {};

    es.setup = Object.assign({}, es.setup, {
        reconnectHeading: '\u00bfQuieres volver a tu sala?',
        reconnectNote: 'Puedes volver a {room} como {name} desde este dispositivo.',
        reconnectAction: 'Volver a entrar'
    });
    en.setup = Object.assign({}, en.setup, {
        reconnectHeading: 'Want to get back to your room?',
        reconnectNote: 'You can rejoin {room} as {name} from this device.',
        reconnectAction: 'Rejoin room'
    });

    es.game = Object.assign({}, es.game, {
        players: 'Jugadores',
        fixedGoal: 'Victoria',
        fixedGoalValue: '10 cartas',
        reconnectHint: 'Si alguien se sale por accidente, vuelve con el mismo nombre en este dispositivo.',
        finalCardsOnly: '{cards}/10 cartas',
        finalCardsCoins: '{cards}/10 cartas · {coins} monedas',
        timelineTurnHint: 'Aquí eliges tu año',
        timelineStealHint: 'Aquí intentas robar'
    });
    en.game = Object.assign({}, en.game, {
        players: 'Players',
        fixedGoal: 'Win',
        fixedGoalValue: '10 cards',
        reconnectHint: 'If someone drops by accident, they can come back with the same name on this device.',
        finalCardsOnly: '{cards}/10 cards',
        finalCardsCoins: '{cards}/10 cards · {coins} coins',
        timelineTurnHint: 'Choose your year here',
        timelineStealHint: 'Try your steal here'
    });

    es.actions = Object.assign({}, es.actions, {
        copyCode: 'Copiar c\u00f3digo',
        copyLink: 'Copiar enlace'
    });
    en.actions = Object.assign({}, en.actions, {
        copyCode: 'Copy code',
        copyLink: 'Copy link'
    });

    es.lobby = Object.assign({}, es.lobby, {
        codeCopied: 'C\u00f3digo copiado.',
        linkCopied: 'Enlace copiado.',
        copyFailed: 'No se pudo copiar.'
    });
    en.lobby = Object.assign({}, en.lobby, {
        codeCopied: 'Code copied.',
        linkCopied: 'Link copied.',
        copyFailed: 'Could not copy.'
    });

    es.errors = Object.assign({}, es.errors, {
        roomFull: 'La sala ya lleg\u00f3 al l\u00edmite de {max} jugadores.'
    });
    en.errors = Object.assign({}, en.errors, {
        roomFull: 'This room is already at the {max} player limit.'
    });

    if (Array.isArray(es.tutorial?.steps) && es.tutorial.steps[5]) {
        es.tutorial.steps[5].body = 'Todos empiezan con 0 cartas reales; el a\u00f1o base no cuenta. Gana quien llegue primero a 10 cartas.';
    }
    if (Array.isArray(en.tutorial?.steps) && en.tutorial.steps[5]) {
        en.tutorial.steps[5].body = 'Everyone starts with 0 real cards; the base year does not count. First player to reach 10 cards wins.';
    }
})();

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
