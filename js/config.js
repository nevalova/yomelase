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
const MAX_EQUIPOS = 9;
const MAX_TOKENS = 5;
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

function estadoJuegoBase(fase = FASES.LOBBY) {
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
        turno_entidad_tipo: '',
        turno_entidad_id: '',
        nombre_entidad_turno: '',
        turno_miembro_idx: 0
    };
}

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
        teams: 'Jugadores y equipos',
        soloPlayer: 'Jugador',
        fixedGoal: 'Victoria',
        fixedGoalValue: '10 cartas',
        reconnectHint: 'Si alguien se sale por accidente, vuelve con el mismo nombre en este dispositivo.',
        finalCardsOnly: '{cards}/10 cartas',
        finalCardsCoins: '{cards}/10 cartas \u00b7 {coins} monedas',
        timelineTurnHint: 'Aqu\u00ed eliges tu a\u00f1o',
        timelineStealHint: 'Aqu\u00ed intentas robar',
        shareRoom: 'Comparte el QR, el c\u00f3digo o inicia ya para jugar solitario.',
        autoGuessQuestionEasy: 'Adivina la canci\u00f3n o qui\u00e9n la canta',
        autoGuessQuestionHard: 'Adivina la canci\u00f3n y qui\u00e9n la canta',
        autoGuessHintEasy: 'Cualquiera de las dos respuestas vale para ganar 1 moneda.',
        autoGuessHintHard: 'Si aciertas las dos, ganas 1 moneda.',
        guessFlexPlaceholder: 'Canci\u00f3n o qui\u00e9n la canta',
        guessSongPlaceholder: 'Canci\u00f3n',
        guessArtistPlaceholder: 'Qui\u00e9n la canta'
    });
    en.game = Object.assign({}, en.game, {
        players: 'Players',
        teams: 'Players and teams',
        soloPlayer: 'Player',
        fixedGoal: 'Win',
        fixedGoalValue: '10 cards',
        reconnectHint: 'If someone drops by accident, they can come back with the same name on this device.',
        finalCardsOnly: '{cards}/10 cards',
        finalCardsCoins: '{cards}/10 cards \u00b7 {coins} coins',
        timelineTurnHint: 'Choose your year here',
        timelineStealHint: 'Try your steal here',
        shareRoom: 'Share the QR, the code, or just start now for solo play.',
        autoGuessQuestionEasy: 'Guess the song or who sings it',
        autoGuessQuestionHard: 'Guess the song and who sings it',
        autoGuessHintEasy: 'Either answer counts to earn 1 coin.',
        autoGuessHintHard: 'Get both right to earn 1 coin.',
        guessFlexPlaceholder: 'Song or who sings it',
        guessSongPlaceholder: 'Song',
        guessArtistPlaceholder: 'Who sings it'
    });

    es.actions = Object.assign({}, es.actions, {
        copyCode: 'Copiar c\u00f3digo',
        copyLink: 'Copiar enlace',
        copyTvLink: 'Enlace TV',
        createTeam: 'Crear equipo',
        joinTeam: 'Unirme',
        leaveTeam: 'Salir del equipo',
        cancelTeam: 'Cancelar equipo',
        passTurn: 'Pasar turno a compa\u00f1ero'
    });
    en.actions = Object.assign({}, en.actions, {
        copyCode: 'Copy code',
        copyLink: 'Copy link',
        copyTvLink: 'TV link',
        createTeam: 'Create team',
        joinTeam: 'Join',
        leaveTeam: 'Leave team',
        cancelTeam: 'Cancel team',
        passTurn: 'Pass turn'
    });

    es.lobby = Object.assign({}, es.lobby, {
        codeCopied: 'C\u00f3digo copiado.',
        linkCopied: 'Enlace copiado.',
        tvLinkCopied: 'Enlace de TV copiado.',
        copyFailed: 'No se pudo copiar.'
    });
    en.lobby = Object.assign({}, en.lobby, {
        codeCopied: 'Code copied.',
        linkCopied: 'Link copied.',
        tvLinkCopied: 'TV link copied.',
        copyFailed: 'Could not copy.'
    });

    es.tv = Object.assign({}, es.tv, {
        title: 'Yo Me La S\u00e9 - TV',
        label: 'Pantalla TV',
        setupTitle: 'Conectar pantalla',
        setupNote: 'Abre esta vista en una tele o navegador grande y escribe el c\u00f3digo de sala.',
        roomPlaceholder: 'C\u00f3digo de sala',
        connect: 'Conectar',
        connectHint: 'Tambi\u00e9n puedes abrir el enlace TV desde el lobby del host.',
        waitingRoom: 'Esperando sala',
        waitingRoomNote: 'Escribe un c\u00f3digo para mostrar la partida aqu\u00ed.',
        roomNotFound: 'Esta sala no existe o ya se cerr\u00f3.',
        roomCode: 'Sala {room}',
        players: '{count} jugadores',
        difficultyEasy: 'Modo f\u00e1cil',
        difficultyHard: 'Modo dif\u00edcil',
        lobbyTitle: 'La sala est\u00e1 abierta',
        lobbyNote: 'Entren desde sus tel\u00e9fonos con el c\u00f3digo y cuando quieran, empiecen.',
        readyTitle: 'Todo listo para empezar',
        readyNote: 'El host ya puede iniciar la partida.',
        turnTitle: 'Turno actual',
        turnSolo: 'Juega {player}',
        turnTeam: '{team} juega con {player}',
        turnLocked: '{player} ya dej\u00f3 su lugar',
        selectionLabel: 'Eligi\u00f3: {label}',
        playingNote: 'Escuchen la canci\u00f3n y decidan d\u00f3nde va.',
        stealNote: 'Los dem\u00e1s todav\u00eda pueden intentar robar.',
        resultNote: 'Revisen qui\u00e9n se qued\u00f3 la carta.',
        teamMembers: 'Integrantes',
        timelineTitle: 'L\u00ednea de tiempo actual',
        scoreboard: 'Marcador',
        revealTitle: 'Carta revelada',
        revealPending: 'Todav\u00eda no se revela la carta.',
        revealWaiting: 'La canci\u00f3n sigue en juego.',
        finalTitle: 'Partida terminada',
        coins: '{coins} monedas',
        cards: '{cards}/10 cartas',
        soloStat: '{cards}/10 cartas',
        noTimeline: 'A\u00fan no hay cartas reales en esta l\u00ednea.'
    });
    en.tv = Object.assign({}, en.tv, {
        title: 'Yo Me La Se - TV',
        label: 'TV screen',
        setupTitle: 'Connect screen',
        setupNote: 'Open this view on a TV or large browser and enter the room code.',
        roomPlaceholder: 'Room code',
        connect: 'Connect',
        connectHint: 'You can also open the TV link from the host lobby.',
        waitingRoom: 'Waiting for room',
        waitingRoomNote: 'Enter a room code to show the game here.',
        roomNotFound: 'This room does not exist or was closed.',
        roomCode: 'Room {room}',
        players: '{count} players',
        difficultyEasy: 'Easy mode',
        difficultyHard: 'Hard mode',
        lobbyTitle: 'Room is open',
        lobbyNote: 'Join from your phones with the code, then start when ready.',
        readyTitle: 'Everything is ready',
        readyNote: 'The host can start the game now.',
        turnTitle: 'Current turn',
        turnSolo: '{player} is up',
        turnTeam: '{team} is playing with {player}',
        turnLocked: '{player} already locked the spot',
        selectionLabel: 'Picked: {label}',
        playingNote: 'Listen to the song and decide where it goes.',
        stealNote: 'Other sides can still try to steal it.',
        resultNote: 'Check who won the card.',
        teamMembers: 'Members',
        timelineTitle: 'Current timeline',
        scoreboard: 'Scoreboard',
        revealTitle: 'Revealed card',
        revealPending: 'The card is not revealed yet.',
        revealWaiting: 'The song is still in play.',
        finalTitle: 'Game over',
        coins: '{coins} coins',
        cards: '{cards}/10 cards',
        soloStat: '{cards}/10 cards',
        noTimeline: 'This timeline has no real cards yet.'
    });

    es.errors = Object.assign({}, es.errors, {
        roomFull: 'La sala ya lleg\u00f3 al l\u00edmite de {max} jugadores.',
        maxTeams: 'Ya llegaron al l\u00edmite de {max} equipos.'
    });
    en.errors = Object.assign({}, en.errors, {
        roomFull: 'This room is already at the {max} player limit.',
        maxTeams: 'This room already reached the {max} team limit.'
    });

    es.teams = Object.assign({}, es.teams, {
        lobbyNote: '{players}/{maxPlayers} jugadores \u00b7 {teams}/{maxTeams} equipos',
        lobbySoloNote: '{players}/{maxPlayers} jugadores \u00b7 Cada quien juega por su cuenta',
        gameNote: '{teams} entidades en juego',
        teamFallback: 'Equipo',
        soloBadge: 'Juegas por tu cuenta',
        soloWaiting: 'Va por libre',
        memberCount: '{count} integrantes',
        myTeam: 'Tu equipo',
        joinTeam: 'Unirme',
        leaveTeam: 'Salir del equipo',
        cancelTeam: 'Cancelar equipo',
        palette: {
            cyan: 'Equipo Cian',
            magenta: 'Equipo Magenta',
            lime: 'Equipo Lima',
            orange: 'Equipo Naranja',
            violet: 'Equipo Violeta',
            yellow: 'Equipo Solar',
            aqua: 'Equipo Aqua',
            pink: 'Equipo Rosa',
            blue: 'Equipo Azul'
        }
    });
    en.teams = Object.assign({}, en.teams, {
        lobbyNote: '{players}/{maxPlayers} players \u00b7 {teams}/{maxTeams} teams',
        lobbySoloNote: '{players}/{maxPlayers} players \u00b7 Everyone is playing solo',
        gameNote: '{teams} active sides in game',
        teamFallback: 'Team',
        soloBadge: 'Playing solo',
        soloWaiting: 'Solo',
        memberCount: '{count} members',
        myTeam: 'Your team',
        joinTeam: 'Join',
        leaveTeam: 'Leave team',
        cancelTeam: 'Cancel team',
        palette: {
            cyan: 'Cyan Team',
            magenta: 'Magenta Team',
            lime: 'Lime Team',
            orange: 'Orange Team',
            violet: 'Violet Team',
            yellow: 'Solar Team',
            aqua: 'Aqua Team',
            pink: 'Pink Team',
            blue: 'Blue Team'
        }
    });

    es.status = Object.assign({}, es.status, {
        prepareTeamTurn: 'Prep\u00e1rense, sigue su turno.',
        yourTeamTurn: 'Tu equipo juega ahora.',
        teamTurnBy: '{team} juega con {player}.',
        waitTeammateChoice: 'Espera a que tu compa\u00f1ero coloque.',
        entityTurnLocked: '{player} ya dej\u00f3 la jugada.',
        turnOfTeam: 'Turno de {team}.',
        yourTeamSteal: 'Tu robo: {label}',
        turnPassed: 'Ahora juega {player}.',
        cueLobby: 'Crea o comparte el c\u00f3digo',
        cueLobbyReadyHost: 'Host: toca Iniciar partida',
        cueLobbyReadyGuest: 'Espera a que el host inicie',
        cueYourTurn: 'Escucha y elige d\u00f3nde va',
        cueTeammateTurn: 'Tu compa\u00f1ero est\u00e1 jugando',
        cueOtherTurn: 'Espera tu turno',
        cueGuessBonus: 'Adivina para ganar 1 moneda',
        cueStealOffer: 'Puedes robar con 1 moneda',
        cueStealPick: 'Elige tu robo',
        cueRevealHost: 'Host: toca Siguiente canci\u00f3n',
        cueRevealGuest: 'Revisa qui\u00e9n gan\u00f3 la carta',
        cueFinalHost: 'Host: toca Volver a jugar',
        cueFinalGuest: 'Partida terminada'
    });
    en.status = Object.assign({}, en.status, {
        prepareTeamTurn: 'Get ready, your team is up next.',
        yourTeamTurn: 'Your team is up.',
        teamTurnBy: '{team} is playing with {player}.',
        waitTeammateChoice: 'Wait for your teammate to place the card.',
        entityTurnLocked: '{player} already locked the play.',
        turnOfTeam: "{team}'s turn.",
        yourTeamSteal: 'Your steal: {label}',
        turnPassed: '{player} is up now.',
        cueLobby: 'Create or share the code',
        cueLobbyReadyHost: 'Host: tap Start game',
        cueLobbyReadyGuest: 'Wait for the host to start',
        cueYourTurn: 'Listen and choose the spot',
        cueTeammateTurn: 'Your teammate is playing',
        cueOtherTurn: 'Wait for your turn',
        cueGuessBonus: 'Guess it to earn 1 coin',
        cueStealOffer: 'You can steal with 1 coin',
        cueStealPick: 'Choose your steal',
        cueRevealHost: 'Host: tap Next song',
        cueRevealGuest: 'Check who won the card',
        cueFinalHost: 'Host: tap Play again',
        cueFinalGuest: 'Game over'
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
