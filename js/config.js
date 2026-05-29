const firebaseConfig = {
    apiKey: "AIzaSyA_WChhOabs671aPhX5uhX3FaLnn_YOc0c",
    authDomain: "party-music-3faae.firebaseapp.com",
    databaseURL: "https://party-music-3faae-default-rtdb.firebaseio.com",
    projectId: "party-music-3faae"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
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
        noCodeNote: 'Crea una sala nueva para jugar solo o compartir el c\u00f3digo con m\u00e1s jugadores.',
        playSolo: 'Jugar solo',
        reconnectHeading: '\u00bfQuieres volver a tu sala?',
        reconnectNote: 'Puedes volver a {room} con la sesi\u00f3n guardada en este dispositivo.',
        reconnectAction: 'Volver a entrar'
    });
    en.setup = Object.assign({}, en.setup, {
        noCodeNote: 'Create a new room to play solo or share the code with more players.',
        playSolo: 'Play solo',
        reconnectHeading: 'Want to get back to your room?',
        reconnectNote: 'You can rejoin {room} with the session saved on this device.',
        reconnectAction: 'Rejoin room'
    });

    es.connection = Object.assign({}, es.connection, {
        offline: 'Reconectando...',
        offlineDetail: 'Se perdi\u00f3 la conexi\u00f3n. Tus datos se sincronizan al volver.',
        online: 'Conexi\u00f3n lista',
        onlineDetail: 'Ya volviste a la sala.'
    });
    en.connection = Object.assign({}, en.connection, {
        offline: 'Reconnecting...',
        offlineDetail: 'Connection was lost. Your data syncs when it returns.',
        online: 'Connection ready',
        onlineDetail: 'You are back in the room.'
    });

    es.game = Object.assign({}, es.game, {
        players: 'Jugadores',
        playersSetup: 'Jugadores listos',
        roomWithCode: 'Sala {room}',
        leader: 'L\u00edder',
        you: 'T\u00fa',
        teams: 'Jugadores y equipos',
        soloPlayer: 'Jugador',
        fixedGoal: 'Victoria',
        fixedGoalValue: '10 cartas',
        reconnectHint: 'Si alguien se sale por accidente, debe volver desde el mismo dispositivo.',
        finalCardsOnly: '{cards}/10 cartas',
        finalCardsCoins: '{cards}/10 cartas \u00b7 {coins} monedas',
        timelineTurnHint: 'Aqu\u00ed eliges tu a\u00f1o',
        timelineStealHint: 'Aqu\u00ed intentas robar',
        shareRoom: 'Comparte el QR o el c\u00f3digo. Si est\u00e1s solo, tambi\u00e9n puedes iniciar ya.',
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
        playersSetup: 'Ready players',
        roomWithCode: 'Room {room}',
        leader: 'Leader',
        you: 'You',
        teams: 'Players and teams',
        soloPlayer: 'Player',
        fixedGoal: 'Win',
        fixedGoalValue: '10 cards',
        reconnectHint: 'If someone drops by accident, they should come back from the same device.',
        finalCardsOnly: '{cards}/10 cards',
        finalCardsCoins: '{cards}/10 cards \u00b7 {coins} coins',
        timelineTurnHint: 'Choose your year here',
        timelineStealHint: 'Try your steal here',
        shareRoom: 'Share the QR or code. If you are solo, you can start now too.',
        autoGuessQuestionEasy: 'Guess the song or who sings it',
        autoGuessQuestionHard: 'Guess the song and who sings it',
        autoGuessHintEasy: 'Either answer counts to earn 1 coin.',
        autoGuessHintHard: 'Get both right to earn 1 coin.',
        guessFlexPlaceholder: 'Song or who sings it',
        guessSongPlaceholder: 'Song',
        guessArtistPlaceholder: 'Who sings it'
    });

    es.guide = Object.assign({}, es.guide, {
        menuTitle: 'Ayuda del juego',
        menuBody: 'Elige si quieres leer las reglas o recibir ayudas peque\u00f1as mientras juegas.',
        tutorialButton: 'Ver tutorial r\u00e1pido',
        toggleTitle: 'Gu\u00eda durante la partida',
        toggleCopyOn: 'Las ayudas aparecer\u00e1n mientras juegas.',
        toggleCopyOff: 'No se mostrar\u00e1n ayudas durante la partida.',
        done: 'Listo',
        bubbleDone: 'Entendido',
        bubbleHide: 'Ocultar gu\u00eda',
        cues: {
            lobby_open: {
                title: 'Comparte la sala',
                body: 'Los dem\u00e1s entran con el c\u00f3digo o el QR. Si quieres probar solo, el host puede tocar Comenzar.'
            },
            lobby_ready_host: {
                title: 'Empieza la partida',
                body: 'La sala ya est\u00e1 cerrada. Toca Iniciar partida para lanzar la primera canci\u00f3n, con amigos o en solitario.'
            },
            lobby_ready_guest: {
                title: 'Sala cerrada',
                body: 'Ya no entra gente nueva. Espera a que el host inicie la m\u00fasica.'
            },
            placement: {
                title: 'Coloca la carta',
                body: 'Escucha la canci\u00f3n y elige si va antes, entre o despu\u00e9s de tus a\u00f1os.'
            },
            coin_bonus: {
                title: 'Gana una moneda',
                body: 'Antes de revelar, intenta adivinar la canci\u00f3n y qui\u00e9n la canta.'
            },
            steal_offer: {
                title: 'Puedes robar',
                body: 'Gasta 1 moneda para intentar colocar esta carta en la l\u00ednea del turno.'
            },
            steal_place: {
                title: 'Elige tu robo',
                body: 'Pon tu moneda en otro lugar. Si aciertas el a\u00f1o, tambi\u00e9n ganas la carta.'
            },
            host_reveal: {
                title: 'Revela cuando est\u00e9n listos',
                body: 'El host decide cu\u00e1ndo mostrar la carta y revisar qui\u00e9n acert\u00f3.'
            },
            result: {
                title: 'Resultado',
                body: 'Quien coloc\u00f3 bien el a\u00f1o se queda la carta.'
            },
            host_next: {
                title: 'Siguiente canci\u00f3n',
                body: 'Cuando todos vean el resultado, el host avanza a la pr\u00f3xima ronda.'
            },
            final: {
                title: 'Partida terminada',
                body: 'Gana quien llegue primero a 10 cartas reales.'
            }
        }
    });
    en.guide = Object.assign({}, en.guide, {
        menuTitle: 'Game Help',
        menuBody: 'Choose whether to read the rules or see small hints while you play.',
        tutorialButton: 'View quick tutorial',
        toggleTitle: 'In-game guide',
        toggleCopyOn: 'Hints will appear while you play.',
        toggleCopyOff: 'Hints will not appear during the game.',
        done: 'Done',
        bubbleDone: 'Got it',
        bubbleHide: 'Hide guide',
        cues: {
            lobby_open: {
                title: 'Share the room',
                body: 'Others join with the code or QR. If you want to test solo, the host can tap Start.'
            },
            lobby_ready_host: {
                title: 'Start the game',
                body: 'The room is closed. Tap Start game to launch the first song, with friends or solo.'
            },
            lobby_ready_guest: {
                title: 'Room closed',
                body: 'No new players can join. Wait for the host to start the music.'
            },
            placement: {
                title: 'Place the card',
                body: 'Listen to the song and choose whether it goes before, between, or after your years.'
            },
            coin_bonus: {
                title: 'Earn a coin',
                body: 'Before reveal, try to guess the song and who sings it.'
            },
            steal_offer: {
                title: 'You can steal',
                body: 'Spend 1 coin to try placing this card on the current timeline.'
            },
            steal_place: {
                title: 'Choose your steal',
                body: 'Put your coin on another spot. If the year is right, you also win the card.'
            },
            host_reveal: {
                title: 'Reveal when ready',
                body: 'The host decides when to show the card and check who got it right.'
            },
            result: {
                title: 'Result',
                body: 'Whoever placed the year correctly keeps the card.'
            },
            host_next: {
                title: 'Next song',
                body: 'Once everyone sees the result, the host moves to the next round.'
            },
            final: {
                title: 'Game over',
                body: 'First side to reach 10 real cards wins.'
            }
        }
    });

    es.actions = Object.assign({}, es.actions, {
        copyCode: 'Copiar c\u00f3digo',
        lockRoom: 'Cerrar sala',
        startFirstRound: 'Iniciar primera canci\u00f3n',
        revealCard: 'Revelar carta',
        nextRound: 'Siguiente ronda',
        createTeam: 'Crear equipo',
        joinTeam: 'Unirme',
        leaveTeam: 'Salir del equipo',
        cancelTeam: 'Cancelar equipo',
        passTurn: 'Pasar turno a compa\u00f1ero',
        confirmSlot: 'Elegir esta posici\u00f3n'
    });
    en.actions = Object.assign({}, en.actions, {
        copyCode: 'Copy code',
        lockRoom: 'Lock room',
        startFirstRound: 'Start first song',
        revealCard: 'Reveal card',
        nextRound: 'Next round',
        createTeam: 'Create team',
        joinTeam: 'Join',
        leaveTeam: 'Leave team',
        cancelTeam: 'Cancel team',
        passTurn: 'Pass turn',
        confirmSlot: 'Choose this position'
    });

    es.actionPanel = Object.assign({}, es.actionPanel, {
        placeKicker: 'Tu jugada',
        placeTitle: 'Coloca la carta',
        placeBody: 'Toca una casilla para probarla. Confirma solo cuando est\u00e9s seguro.',
        stealPlaceKicker: 'Robo',
        stealPlaceTitle: 'Coloca tu robo',
        stealPlaceBody: 'Toca una casilla para probarla. No puedes usar la misma posici\u00f3n que el turno principal.',
        stealKicker: 'Robo',
        stealTitle: 'Puedes pelear esta carta',
        stealBody: 'Gastas 1 moneda solo si quieres intentar colocarla en tu l\u00ednea.',
        cancelStealKicker: 'Robo activo',
        cancelStealTitle: 'Tu moneda est\u00e1 apartada',
        cancelStealBody: 'Puedes cancelar antes de que el host revele la carta.',
        teamKicker: 'Equipo',
        teamTitle: 'Otro compa\u00f1ero puede colocar',
        teamBody: 'Pasa el turno si alguien del equipo conoce mejor la canci\u00f3n.',
        bonusKicker: 'Bonus',
        bonusTitle: 'Gana una moneda extra',
        bonusBody: 'Responde antes de revelar. Tu colocaci\u00f3n ya qued\u00f3 guardada.',
        exchangeKicker: 'Canje',
        exchangeTitle: 'Compra una carta directa',
        exchangeBody: 'Usa 3 monedas para quedarte esta carta sin colocarla.',
        audioKicker: 'Audio'
    });
    en.actionPanel = Object.assign({}, en.actionPanel, {
        placeKicker: 'Your play',
        placeTitle: 'Place the card',
        placeBody: 'Tap a spot to preview it. Confirm only when you are sure.',
        stealPlaceKicker: 'Steal',
        stealPlaceTitle: 'Place your steal',
        stealPlaceBody: 'Tap a spot to preview it. You cannot use the same spot as the main turn.',
        stealKicker: 'Steal',
        stealTitle: 'You can fight for this card',
        stealBody: 'Spend 1 coin only if you want to try placing it on your timeline.',
        cancelStealKicker: 'Active steal',
        cancelStealTitle: 'Your coin is reserved',
        cancelStealBody: 'You can cancel before the host reveals the card.',
        teamKicker: 'Team',
        teamTitle: 'Another teammate can place',
        teamBody: 'Pass the turn if someone on the team knows the song better.',
        bonusKicker: 'Bonus',
        bonusTitle: 'Earn one extra coin',
        bonusBody: 'Answer before reveal. Your placement is already saved.',
        exchangeKicker: 'Exchange',
        exchangeTitle: 'Buy a direct card',
        exchangeBody: 'Use 3 coins to keep this card without placing it.',
        audioKicker: 'Audio'
    });

    es.lobby = Object.assign({}, es.lobby, {
        soloKicker: 'Jugar solo',
        soloTitle: 'Puedes empezar sin invitados',
        soloBody: 'Toca Cerrar sala y luego Iniciar primera canci\u00f3n.',
        soloModeKicker: 'Pr\u00e1ctica',
        soloModeTitle: 'Partida solo lista',
        soloModeBody: 'Elige el modo y empieza con la primera canci\u00f3n.',
        codeCopied: 'C\u00f3digo copiado.',
        linkCopied: 'Enlace copiado.',
        tvLinkCopied: 'Enlace de TV copiado.',
        copyFailed: 'No se pudo copiar.'
    });
    en.lobby = Object.assign({}, en.lobby, {
        soloKicker: 'Solo play',
        soloTitle: 'You can start without guests',
        soloBody: 'Tap Lock room, then Start first song.',
        soloModeKicker: 'Practice',
        soloModeTitle: 'Solo game ready',
        soloModeBody: 'Choose the mode and start the first song.',
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
        lobbyNote: 'Entren desde sus tel\u00e9fonos con el c\u00f3digo. Si solo est\u00e1 el host, tambi\u00e9n puede empezar.',
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
        noTimeline: 'A\u00fan no hay cartas reales en esta l\u00ednea.',
        emptyScore: 'A\u00fan no hay jugadores en la sala.',
        audioActivate: 'Activar audio TV',
        audioReady: 'Audio TV listo.',
        audioLoading: 'Cargando audio en TV...',
        audioPlaying: 'Audio sonando en TV.',
        audioHint: 'El audio de TV se activa con un toque.',
        audioNeedsTap: 'Toca Activar audio TV para que suene aqu\u00ed.',
        audioNoSong: 'A\u00fan no hay canci\u00f3n activa.',
        audioError: 'Spotify no pudo cargar en esta TV.'
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
        lobbyNote: 'Join from your phones with the code. If only the host is here, solo play can start too.',
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
        noTimeline: 'This timeline has no real cards yet.',
        emptyScore: 'There are no players in the room yet.',
        audioActivate: 'Enable TV audio',
        audioReady: 'TV audio ready.',
        audioLoading: 'Loading TV audio...',
        audioPlaying: 'Audio playing on TV.',
        audioHint: 'TV audio starts with one tap.',
        audioNeedsTap: 'Tap Enable TV audio to play here.',
        audioNoSong: 'There is no active song yet.',
        audioError: 'Spotify could not load on this TV.'
    });

    es.errors = Object.assign({}, es.errors, {
        roomNotFound: 'La sala {room} no existe, ya se cerr\u00f3 o es de una versi\u00f3n anterior. Crea una sala nueva.',
        gameStartedReconnect: 'La partida ya comenz\u00f3. Solo puedes volver desde el mismo dispositivo.',
        roomFull: 'La sala ya lleg\u00f3 al l\u00edmite de {max} jugadores. Pide al host que inicie o espera otra sala.',
        maxTeams: 'Ya llegaron al l\u00edmite de {max} equipos.',
        authFailed: 'No se pudo iniciar sesi\u00f3n segura. Revisa Firebase Auth.',
        permissionDenied: 'Firebase bloque\u00f3 esta acci\u00f3n. Revisa que las reglas est\u00e9n publicadas.',
        connectionLost: 'Se perdi\u00f3 la conexi\u00f3n con la sala. Revisa internet e intenta de nuevo.',
        roomClosedLive: 'La sala ya no est\u00e1 disponible.',
        noPlayersRoom: 'Necesitas al menos 1 jugador para comenzar.',
        noActiveSides: 'No hay jugadores o equipos activos para iniciar.',
        noSongsAvailable: 'No hay canciones disponibles. Revisa canciones.js antes de iniciar.',
        generic: 'Algo no sali\u00f3 bien. Intenta de nuevo.'
    });
    en.errors = Object.assign({}, en.errors, {
        roomNotFound: 'Room {room} does not exist, was closed, or belongs to an older version. Create a new room.',
        gameStartedReconnect: 'The game has already started. You can only return from the same device.',
        roomFull: 'This room is already at the {max} player limit. Ask the host to start or wait for another room.',
        maxTeams: 'This room already reached the {max} team limit.',
        authFailed: 'Could not start a secure session. Check Firebase Auth.',
        permissionDenied: 'Firebase blocked this action. Check that the rules are published.',
        connectionLost: 'Lost connection to the room. Check your internet and try again.',
        roomClosedLive: 'This room is no longer available.',
        noPlayersRoom: 'You need at least 1 player to start.',
        noActiveSides: 'There are no active players or teams to start.',
        noSongsAvailable: 'No songs are available. Check canciones.js before starting.',
        generic: 'Something went wrong. Try again.'
    });

    es.teams = Object.assign({}, es.teams, {
        lobbyNote: '{players}/{maxPlayers} jugadores \u00b7 {teams}/{maxTeams} equipos',
        lobbySoloNote: '{players}/{maxPlayers} jugadores \u00b7 Cada quien juega por su cuenta',
        lobbyFullNote: 'Sala llena: {players}/{maxPlayers} jugadores.',
        offlineNote: '{count} jugador(es) desconectado(s). Pueden volver desde el mismo dispositivo.',
        emptyScore: 'A\u00fan no hay jugadores para mostrar.',
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
        lobbyFullNote: 'Room full: {players}/{maxPlayers} players.',
        offlineNote: '{count} disconnected player(s). They can return from the same device.',
        emptyScore: 'No players to show yet.',
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
        waitYourTurn: 'Espera tu turno.',
        hostCanRevealSolo: 'Cuando est\u00e9s listo, revela la carta.',
        choiceSavedSolo: 'Tu elecci\u00f3n qued\u00f3 guardada. Ya puedes revelar.',
        hostStart: 'Presiona Iniciar primera canci\u00f3n para empezar.',
        cueLobby: 'Juega solo o comparte el c\u00f3digo',
        cueLobbyReadyHost: 'Host: toca Iniciar primera canci\u00f3n',
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
        cueFinalGuest: 'Partida terminada',
        nextActionLabel: 'Siguiente',
        nextActionHostLockRoom: 'Cierra la sala cuando ya est\u00e9n listos.',
        nextActionHostStartGame: 'Inicia la primera canci\u00f3n.',
        nextActionGuestWaitHost: 'Espera a que el host avance.',
        nextActionPlaceCard: 'Elige una posici\u00f3n en tu l\u00ednea.',
        nextActionGuessBonus: 'Puedes intentar el bonus de moneda.',
        nextActionWaitTurn: 'Mira el turno y espera tu momento.',
        nextActionSteal: 'Decide si gastas 1 moneda para robar.',
        nextActionChooseSteal: 'Elige d\u00f3nde colocar tu robo.',
        nextActionHostReveal: 'Revela cuando la jugada est\u00e9 lista.',
        nextActionHostNext: 'Avanza a la siguiente ronda.',
        nextActionReview: 'Revisa el resultado revelado.',
        noSongsFinal: 'No quedan canciones disponibles.',
        noSongsHost: 'No quedan canciones. Puedes volver a jugar o cargar m\u00e1s canciones.',
        noSongsGuest: 'La partida termin\u00f3 porque no quedan canciones.'
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
        waitYourTurn: 'Wait for your turn.',
        hostCanRevealSolo: 'When you are ready, reveal the card.',
        choiceSavedSolo: 'Your choice is saved. You can reveal now.',
        hostStart: 'Tap Start first song to begin.',
        cueLobby: 'Play solo or share the code',
        cueLobbyReadyHost: 'Host: tap Start first song',
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
        cueFinalGuest: 'Game over',
        nextActionLabel: 'Next',
        nextActionHostLockRoom: 'Lock the room when everyone is ready.',
        nextActionHostStartGame: 'Start the first song.',
        nextActionGuestWaitHost: 'Wait for the host to move forward.',
        nextActionPlaceCard: 'Choose a position on your timeline.',
        nextActionGuessBonus: 'You can try the coin bonus.',
        nextActionWaitTurn: 'Watch the turn and wait for your moment.',
        nextActionSteal: 'Decide whether to spend 1 coin to steal.',
        nextActionChooseSteal: 'Choose where to place your steal.',
        nextActionHostReveal: 'Reveal when the play is ready.',
        nextActionHostNext: 'Move to the next round.',
        nextActionReview: 'Review the revealed result.',
        noSongsFinal: 'No songs are available.',
        noSongsHost: 'No songs left. You can play again or load more songs.',
        noSongsGuest: 'The game ended because there are no songs left.'
    });

    es.slot = Object.assign({}, es.slot, {
        selected: 'Seleccionaste'
    });
    en.slot = Object.assign({}, en.slot, {
        selected: 'Selected'
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
let miUid = '';
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
let authPromise = null;
let toastTimer = null;
let revealFocusKey = '';
let scoreExpanded = false;
let connectionPillTimer = null;
let connectionOfflineTimer = null;
let firebaseConnectionStarted = false;
let firebaseConnectionSeen = false;
let firebaseIsConnected = true;
let firebaseWasDisconnected = false;
let pendingSlotChoice = null;

async function ensureAuth() {
    if (auth.currentUser) {
        miUid = auth.currentUser.uid;
        return auth.currentUser;
    }
    if (!authPromise) authPromise = auth.signInAnonymously();
    const credential = await authPromise;
    miUid = credential.user.uid;
    return credential.user;
}
