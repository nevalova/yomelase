window.YMLS_LOCALES = window.YMLS_LOCALES || {};
window.YMLS_LOCALES.es = {
    app: {
        title: 'Yo Me La Sé - Móvil',
        brand: 'YO ME LA SÉ'
    },
    setup: {
        namePlaceholder: 'Tu nombre',
        noCodeHeading: '¿No tienes código?',
        noCodeNote: 'Crea una sala nueva y te daremos un código para compartir.',
        createRoom: 'Crear nueva sala',
        invitedDivider: 'O si ya te invitaron',
        haveCodeHeading: '¿Ya tienes código?',
        haveCodeNote: 'Escribe el código que te pasó el host para entrar a su sala.',
        roomCodePlaceholder: 'Código de sala',
        joinWithCode: 'Unirme con código'
    },
    common: {
        howToPlay: '¿Cómo jugar?',
        yes: 'Sí',
        no: 'No',
        host: 'HOST',
        offline: 'OFF'
    },
    tutorial: {
        label: 'Tutorial',
        stepLabel: 'Paso {current} de {total}',
        skip: 'Saltar',
        next: 'Siguiente',
        done: 'Entendido',
        steps: [
            {
                title: '¿De qué trata el juego?',
                body: 'Escucha la canción e intenta adivinar en qué año salió. Tu objetivo es colocarla en el lugar correcto dentro de tu línea de tiempo.'
            },
            {
                title: '¿Cómo se juega un turno?',
                body: 'Todos tienen un año base aleatorio de década entre 1950 y 2020. Ese año solo sirve como referencia y no cuenta como carta. Cuando sea tu turno, coloca la canción antes, entre o después de tu línea.'
            },
            {
                title: '¿Qué hacen los demás?',
                body: 'Cuando otro jugador ya eligió, los demás pueden decidir si intentan robar usando 1 moneda. Si su robo queda bien colocado, también ganan la carta.'
            },
            {
                title: '¿Cómo ganar una moneda?',
                body: 'Antes de revelar puedes escribir la canción y quién la canta. Si aciertas las dos, ganas 1 moneda. En solitario este bonus no aparece.'
            },
            {
                title: '¿Para qué sirven las monedas?',
                body: 'Con 1 moneda puedes intentar robar. Con 3 monedas puedes canjear una carta directa. El botón solo aparece cuando realmente tienes las monedas necesarias.'
            },
            {
                title: '¿Cómo se gana?',
                body: 'Todos empiezan con 0 cartas reales; el año base no cuenta. Gana quien llegue primero a 10 cartas.'
            }
        ]
    },
    game: {
        room: 'Sala',
        phase: 'Fase',
        turn: 'Turno',
        waiting: 'Esperando...',
        lobby: 'Lobby',
        lobbyReady: 'Sala lista',
        shareRoom: 'Comparte el QR o el código para que entren rápido.',
        code: 'Código:',
        difficulty: 'Modo',
        modeEasy: 'Fácil',
        modeHard: 'Difícil',
        difficultyEasyHint: 'Cualquiera de las dos respuestas vale.',
        difficultyHardHint: 'Debes acertar la canción y quién la canta.',
        scoreboard: 'Marcador',
        myTokens: 'Mis monedas',
        myCards: 'Mis cartas',
        autoGuessQuestionEasy: 'Adivina la canción o quién la canta',
        autoGuessQuestionHard: 'Adivina la canción y quién la canta',
        autoGuessHintEasy: 'Cualquiera de las dos respuestas vale para ganar 1 moneda.',
        autoGuessHintHard: 'Si aciertas las dos, ganas 1 moneda.',
        guessFlexPlaceholder: 'Canción o quién la canta',
        guessSongPlaceholder: 'Canción',
        guessArtistPlaceholder: 'Quién la canta',
        audioLocal: 'Escuchar audio en este dispositivo',
        hostAudio: 'Este teléfono reproduce el audio.'
    },
    actions: {
        startSetup: 'Comenzar',
        startGame: 'Iniciar partida',
        steal: 'Usar 1 moneda para robar',
        cancelSteal: 'Cancelar robo y recuperar moneda',
        exchange: 'Canjear 3 monedas',
        listenSong: 'Escuchar canción',
        reveal: 'Revelar',
        nextSong: 'Siguiente canción',
        closeVote: 'Cerrar',
        checkGuess: 'Guardar',
        skipAnswer: 'Omitir',
        replay: 'Volver a jugar',
        leave: 'Salir',
        activateAudio: 'Activar audio',
        pauseAudio: 'Pausar audio',
        resumeAudio: 'Reanudar audio'
    },
    phase: {
        LOBBY: 'Lobby',
        LISTA: 'Lista',
        PRE_RONDA: 'Preparando',
        JUGANDO: 'Jugando',
        ESPERA_ROBO: 'Robo',
        REVELANDO: 'Revelando',
        VOTANDO: 'Respuesta',
        RESULTADO: 'Resultado',
        FINAL: 'Final'
    },
    lobby: {
        hostOpen: 'Comparte el QR y cuando estén todos presiona Comenzar.',
        guestOpen: 'Esperando a que el host cierre la mesa...',
        hostReady: 'Jugadores listos. Presiona Iniciar partida para activar Spotify y comenzar.',
        guestReady: 'Jugadores completos. Esperando a que el host inicie la partida...'
    },
    status: {
        waitingStart: 'Esperando a que inicie la partida...',
        playersCanJoin: 'Pueden seguir entrando jugadores.',
        hostStart: 'Presiona Iniciar partida.',
        waitingHostStart: 'Esperando a que el host inicie la partida...',
        roomClosed: 'La mesa ya está cerrada y no pueden entrar más jugadores.',
        waitingPlayers: 'Esperando jugadores',
        currentSelection: 'Elección actual: {label}',
        prepareTurn: 'Prepárate, sigue tu turno.',
        prepareNextSong: 'Prepárense para la siguiente canción.',
        songStarting: 'La canción está por comenzar.',
        choiceSaved: 'Tu elección quedó guardada.',
        yourTurn: 'Tu turno: escucha y elige una posición.',
        othersCanSteal: 'Los demás pueden intentar robar antes de revelar.',
        placeBeforeReveal: 'Puedes colocar antes de que el host revele.',
        turnOf: 'Turno de: {name}',
        waitStealPhase: 'El jugador ya eligió. Espera la fase de robo.',
        waitPlayerChoice: 'Espera a que el jugador elija posición.',
        preparingReveal: 'Preparando revelación...',
        turnRegistered: 'Tu turno ya quedó registrado.',
        othersDecideSteal: 'Los demás pueden decidir si intentan robar.',
        yourSteal: 'Tu robo: {label}',
        stealSaved: 'Ya quedó guardado. Puedes cancelar antes de revelar.',
        chooseSteal: 'Elige dónde robar.',
        avoidTurnSlot: 'No puedes usar la misma posición del turno. Puedes cancelar si te arrepientes.',
        noStealAvailable: 'Sin robo disponible.',
        noBaseToSteal: 'Todavía no hay año base para robar.',
        wantSteal: '¿Quieres robar esta carta?',
        chose: 'Eligió: {label}',
        noTokensSteal: 'Sin monedas para robar.',
        needToken: 'Necesitas al menos 1 moneda.',
        reviewingResult: 'Revisando resultado...',
        revealingSong: 'Revelando canción...',
        pressNext: 'Presiona Siguiente canción para continuar.',
        waitingNext: 'Esperando la siguiente canción.',
        songRevealed: 'Canción revelada.',
        autoGuessPrompt: 'Adivina la canción y quién la canta.',
        autoGuessWaiting: 'Puede ganar 1 moneda si acierta las dos.',
        autoGuessSubmitted: 'Respuesta enviada.',
        autoGuessNeedGuess: 'Escribe tu respuesta.',
        autoGuessNeedBoth: 'Escribe la canción y quién la canta.',
        autoGuessSkipped: 'Bonus omitido.',
        autoGuessSaved: 'Respuesta guardada.',
        autoGuessHintBeforeReveal: 'Aún puedes ganar 1 moneda.',
        hostCanSkipAnswer: 'El host puede seguir si hace falta.',
        gameOver: 'Partida terminada',
        hostReplay: 'El host puede volver a jugar sin recargar.',
        noLineToSteal: 'Todavía no hay línea para robar.',
        stealCancelled: 'Robo cancelado. Recuperaste tu moneda.'
    },
    audio: {
        initial: 'Spotify se activará al iniciar la partida.',
        localOff: 'Audio local desactivado.',
        loadingSpotify: 'Cargando Spotify...',
        loadingSong: 'Cargando canción...',
        playing: 'Canción en curso.',
        error: 'Spotify no pudo cargar. Toca Activar audio.',
        noActiveSong: 'No hay canción activa todavía.',
        ready: 'Spotify listo.',
        paused: 'Audio en pausa.'
    },
    errors: {
        nameRequired: 'Escribe tu nombre.',
        creatingRoom: 'Creando sala...',
        roomCreateFailed: 'No se pudo crear la sala.',
        joinCodeRequired: 'Para unirte necesitas el código que te pasó el host.',
        connecting: 'Conectando...',
        roomNotFound: 'La sala {room} no existe.',
        gameStartedReconnect: 'La partida ya comenzó. Solo puedes reconectarte con el mismo dispositivo.',
        roomCodeFailed: 'No se pudo generar una sala disponible. Intenta de nuevo.'
    },
    slot: {
        firstCardLabel: 'Primera carta',
        beforeLabel: 'Antes de {right}',
        betweenLabel: 'Entre {left} y {right}',
        afterLabel: 'Después de {left}',
        firstMain: 'Primera',
        cardRange: 'Carta',
        beforeMain: 'Antes',
        afterMain: 'Después',
        betweenMain: 'Entre',
        occupied: 'Ocupado',
        turn: 'Turno'
    },
    cards: {
        base: 'Base',
        previous: 'Carta anterior',
        noData: 'Sin datos',
        song: 'Canción',
        artist: 'Artista',
        player: 'Jugador',
        cardsAlt: 'Cartas',
        tokensAlt: 'Monedas'
    },
    summary: {
        cardFor: 'Carta para: {name}',
        cardForRobbery: 'Carta para: {name} (robo)',
        noCard: 'Nadie ganó carta en esta ronda.',
        autoGuessCorrectCoin: 'Acertó las dos y gana 1 moneda: {name}',
        autoGuessCorrectMax: 'Acertó las dos, pero ya tiene 5 monedas.',
        autoGuessWrong: 'No ganó la moneda.',
        autoGuessSkipped: 'Pasó el bonus de esta ronda.',
        autoGuessGuessScore: 'Canción {song}% / quién la canta {artist}%',
        autoGuessMissing: 'No intentó ganar la moneda.',
        exchangedCard: 'Carta para: {name} (canjeada)',
        exchangedSelection: 'CANJEADO',
        noSongs: 'Sin canciones disponibles',
        winner: 'Ganó {name}'
    },
    confirm: {
        leave: '¿Salir?'
    }
};
