window.YMLS_LOCALES = window.YMLS_LOCALES || {};
window.YMLS_LOCALES.en = {
    app: {
        title: 'Yo Me La Se - Mobile',
        brand: 'YO ME LA SE'
    },
    setup: {
        namePlaceholder: 'Your name',
        noCodeHeading: 'No room code?',
        noCodeNote: 'Create a new room and we will give you a code to share.',
        createRoom: 'Create new room',
        invitedDivider: 'Or if you were invited',
        haveCodeHeading: 'Already have a code?',
        haveCodeNote: 'Enter the code the host shared with you to join the room.',
        roomCodePlaceholder: 'Room code',
        joinWithCode: 'Join with code'
    },
    common: {
        howToPlay: 'How to play?',
        yes: 'Yes',
        no: 'No',
        host: 'HOST',
        offline: 'OFF'
    },
    tutorial: {
        label: 'Tutorial',
        stepLabel: 'Step {current} of {total}',
        skip: 'Skip',
        next: 'Next',
        done: 'Got it',
        steps: [
            {
                title: 'What is the game about?',
                body: 'Listen to the song and try to guess the year it came out. Your goal is to place it in the correct spot on your timeline.'
            },
            {
                title: 'How does a turn work?',
                body: 'Everyone starts with one random decade base year between 1950 and 2020. In team mode, teammates share timeline and tokens. When it is your team turn, the active player places the song before, between, or after the line.'
            },
            {
                title: 'What do other players do?',
                body: 'After another team chooses a spot, the other teams can spend 1 token to steal. If their steal is placed correctly, that team wins the card.'
            },
            {
                title: 'How do you earn a token?',
                body: 'Before the reveal, the active player must type the song and also the singer or band. Both answers must be correct to earn 1 token. In solo mode it is still checked, but no token is awarded.'
            },
            {
                title: 'What are tokens for?',
                body: 'Spend 1 token so your team can try to steal. Spend 3 tokens so the active player can exchange for a direct card. The button only appears when your team really has enough tokens.'
            },
            {
                title: 'How do you win?',
                body: 'Everyone starts with 0 real cards; the base year does not count. The first team to reach 10 cards wins.'
            }
        ]
    },
    game: {
        room: 'Room',
        phase: 'Phase',
        turn: 'Turn',
        waiting: 'Waiting...',
        lobby: 'Lobby',
        lobbyReady: 'Room ready',
        shareRoom: 'Share the QR or code so players can join quickly.',
        code: 'Code:',
        teams: 'Teams',
        scoreboard: 'Scoreboard',
        myTokens: 'Team tokens',
        myCards: 'Team cards',
        autoGuessQuestion: 'Guess song and singer or band',
        autoGuessHint: 'Type the song and the singer or band before reveal.',
        guessSongPlaceholder: 'Song',
        guessArtistPlaceholder: 'Singer or band',
        autoGuessSoloNote: 'In solo mode it is still checked, but it does not award a token.',
        audioLocal: 'Play audio on this device',
        hostAudio: 'This phone plays the audio.'
    },
    actions: {
        startSetup: 'Start',
        startGame: 'Start game',
        createTeam: 'Create team',
        passTurn: 'Pass turn to teammate',
        steal: 'Use 1 token to steal',
        cancelSteal: 'Cancel steal and recover token',
        exchange: 'Exchange 3 tokens',
        listenSong: 'Listen to song',
        reveal: 'Reveal',
        nextSong: 'Next song',
        closeVote: 'Skip answer',
        checkGuess: 'Save answer',
        skipAnswer: 'Skip',
        replay: 'Play again',
        leave: 'Leave',
        activateAudio: 'Activate audio',
        pauseAudio: 'Pause audio',
        resumeAudio: 'Resume audio'
    },
    phase: {
        LOBBY: 'Lobby',
        LISTA: 'Ready',
        PRE_RONDA: 'Preparing',
        JUGANDO: 'Playing',
        ESPERA_ROBO: 'Steal',
        REVELANDO: 'Revealing',
        VOTANDO: 'Answer',
        RESULTADO: 'Result',
        FINAL: 'Final'
    },
    lobby: {
        hostOpen: 'Share the QR and press Start when everyone is in.',
        guestOpen: 'Waiting for the host to close the room...',
        hostReady: 'Players ready. Press Start game to activate Spotify and begin.',
        guestReady: 'Players are ready. Waiting for the host to start the game...',
        needTwoTeams: 'You need at least 2 teams to start when more than 1 player is in the room.'
    },
    status: {
        waitingStart: 'Waiting for the game to start...',
        playersCanJoin: 'Players can still join.',
        hostStart: 'Press start game.',
        waitingHostStart: 'Waiting for the host to start the game...',
        roomClosed: 'The room is closed and no more players can join.',
        waitingPlayers: 'Waiting for players',
        currentSelection: 'Current choice: {label}',
        prepareTeamTurn: 'Get ready, it is your team turn.',
        prepareTurn: 'Get ready, your turn is next.',
        prepareNextSong: 'Get ready for the next song.',
        songStarting: 'The song is about to start.',
        choiceSaved: 'Your choice was saved.',
        yourTeamTurn: 'Your team turn: listen and choose a position.',
        teamTurnBy: '{team} is up. {player} is playing.',
        waitTeammateChoice: 'Wait for your teammate to choose the position.',
        turnOfTeam: '{team} is up.',
        yourTurn: 'Your turn: listen and choose a position.',
        othersCanSteal: 'The other teams can try to steal before reveal.',
        placeBeforeReveal: 'You can place before the host reveals.',
        turnOf: "{name}'s turn",
        waitStealPhase: 'The player already chose. Wait for the steal phase.',
        waitPlayerChoice: 'Wait for the player to choose a position.',
        preparingReveal: 'Preparing reveal...',
        turnRegistered: 'Your turn was registered.',
        teamTurnLocked: '{player} already locked your team move.',
        othersDecideSteal: 'The other teams can decide whether to steal.',
        yourSteal: 'Your steal: {label}',
        yourTeamSteal: 'Your team steal: {label}',
        stealSaved: 'Saved. You can cancel before reveal.',
        chooseSteal: 'Choose where to steal.',
        avoidTurnSlot: 'You cannot use the same position as the turn team. You can cancel if you change your mind.',
        noStealAvailable: 'Steal unavailable.',
        noBaseToSteal: 'There is no base year to steal against yet.',
        wantSteal: 'Do you want to steal this card?',
        chose: 'Chose: {label}',
        noTokensSteal: 'No tokens to steal.',
        needToken: 'You need at least 1 token.',
        reviewingResult: 'Checking result...',
        revealingSong: 'Revealing song...',
        pressNext: 'Press Next song to continue.',
        waitingNext: 'Waiting for the next song.',
        songRevealed: 'Song revealed.',
        autoGuessPrompt: 'Type the song and the singer or band before reveal.',
        autoGuessWaiting: 'Waiting for the player answer.',
        autoGuessSubmitted: 'Answer submitted.',
        autoGuessNeedGuess: 'Type an answer.',
        autoGuessNeedBoth: 'Type both the song and the singer or band.',
        autoGuessSkipped: 'Answer skipped.',
        autoGuessSaved: 'Answer saved.',
        autoGuessHintBeforeReveal: 'You can still guess before reveal.',
        hostCanSkipAnswer: 'The host can continue without an answer if needed.',
        gameOver: 'Game over',
        hostReplay: 'The host can play again without reloading.',
        noLineToSteal: 'There is no timeline to steal against yet.',
        stealCancelled: 'Steal cancelled. You recovered your token.',
        turnPassed: 'Turn passed to {player}.'
    },
    audio: {
        initial: 'Spotify will activate when the game starts.',
        localOff: 'Local audio disabled.',
        loadingSpotify: 'Loading Spotify...',
        loadingSong: 'Loading song...',
        playing: 'Song playing.',
        error: 'Spotify could not load. Tap Activate audio.',
        noActiveSong: 'There is no active song yet.',
        ready: 'Spotify ready.',
        paused: 'Audio paused.'
    },
    errors: {
        nameRequired: 'Enter your name.',
        creatingRoom: 'Creating room...',
        roomCreateFailed: 'Could not create the room.',
        joinCodeRequired: 'To join, you need the code shared by the host.',
        connecting: 'Connecting...',
        roomNotFound: 'Room {room} does not exist.',
        gameStartedReconnect: 'The game has already started. You can only reconnect from the same device.',
        roomCodeFailed: 'Could not generate an available room. Try again.',
        roomFull: 'The room already has {max} players.',
        maxTeams: 'The room already has the maximum of {max} teams.'
    },
    slot: {
        firstCardLabel: 'First card',
        beforeLabel: 'Before {right}',
        betweenLabel: 'Between {left} and {right}',
        afterLabel: 'After {left}',
        firstMain: 'First',
        cardRange: 'Card',
        beforeMain: 'Before',
        afterMain: 'After',
        betweenMain: 'Between',
        occupied: 'Taken',
        turn: 'Turn'
    },
    cards: {
        base: 'Base',
        previous: 'Previous card',
        noData: 'No data',
        song: 'Song',
        artist: 'Artist',
        player: 'Player',
        cardsAlt: 'Cards',
        tokensAlt: 'Tokens'
    },
    summary: {
        cardFor: 'Card for: {name}',
        cardForRobbery: 'Card for: {name} (steal)',
        noCard: 'No one won a card this round.',
        autoGuessCorrectToken: 'Correct answer. Token for: {name}',
        autoGuessCorrectSolo: 'Correct answer. No token in solo mode.',
        autoGuessCorrectMax: 'Correct answer. They already had 5 tokens.',
        autoGuessWrong: 'Wrong answer.',
        autoGuessSkipped: 'Answer skipped this round.',
        autoGuessGuessScore: 'Song {song}% / singer or band {artist}%',
        autoGuessMissing: 'No answer before reveal.',
        exchangedCard: 'Card for: {name} (exchanged)',
        exchangedSelection: 'EXCHANGED',
        noSongs: 'No songs available',
        winner: '{name} won'
    },
    confirm: {
        leave: 'Leave?'
    },
    teams: {
        teamFallback: 'Team',
        lobbyNote: '{players}/{maxPlayers} players and {teams}/{maxTeams} teams. You can still switch before the game starts.',
        gameNote: '{teams} teams in the match.',
        memberCount: '{count} members',
        myTeam: 'Your team',
        joinTeam: 'Join',
        palette: {
            cyan: 'Team Cyan',
            magenta: 'Team Magenta',
            lime: 'Team Lime',
            orange: 'Team Orange',
            violet: 'Team Violet',
            yellow: 'Team Solar',
            aqua: 'Team Aqua',
            pink: 'Team Pink',
            blue: 'Team Blue'
        }
    }
};
