window.YMLS_LOCALES = window.YMLS_LOCALES || {};
window.YMLS_LOCALES.en = {
    app: {
        title: 'Yo Me La Sé - Mobile',
        brand: 'YO ME LA SÉ'
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
        howToPlay: 'How to play',
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
                body: 'Everyone starts with one random decade base year between 1950 and 2020. That year is only a reference and does not count as a card. On your turn, place the song before, between, or after your timeline.'
            },
            {
                title: 'What do other players do?',
                body: 'After another player chooses a spot, everyone else can spend 1 coin to steal. If their steal is placed correctly, they win the card.'
            },
            {
                title: 'How do you earn a coin?',
                body: 'Before reveal, type the song and who sings it. If you get both right, you earn 1 coin. In solo mode this bonus does not appear.'
            },
            {
                title: 'What are coins for?',
                body: 'Spend 1 coin to try to steal. Spend 3 coins to exchange for a direct card. The button only appears when you really have enough coins.'
            },
            {
                title: 'How do you win?',
                body: 'Everyone starts with 0 real cards; the base year does not count. First player to reach 10 cards wins.'
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
        scoreboard: 'Scoreboard',
        myTokens: 'My coins',
        myCards: 'My cards',
        autoGuessQuestion: 'Guess the song and who sings it',
        autoGuessHint: 'Get both right to earn 1 coin.',
        guessSongPlaceholder: 'Song',
        guessArtistPlaceholder: 'Who sings it',
        audioLocal: 'Play audio on this device',
        hostAudio: 'This phone plays the audio.'
    },
    actions: {
        startSetup: 'Start',
        startGame: 'Start game',
        steal: 'Use 1 coin to steal',
        cancelSteal: 'Cancel steal and recover coin',
        exchange: 'Exchange 3 coins',
        listenSong: 'Listen to song',
        reveal: 'Reveal',
        nextSong: 'Next song',
        closeVote: 'Close',
        checkGuess: 'Save',
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
        guestReady: 'Players are ready. Waiting for the host to start the game...'
    },
    status: {
        waitingStart: 'Waiting for the game to start...',
        playersCanJoin: 'Players can still join.',
        hostStart: 'Press Start game.',
        waitingHostStart: 'Waiting for the host to start the game...',
        roomClosed: 'The room is closed and no more players can join.',
        waitingPlayers: 'Waiting for players',
        currentSelection: 'Current choice: {label}',
        prepareTurn: 'Get ready, your turn is next.',
        prepareNextSong: 'Get ready for the next song.',
        songStarting: 'The song is about to start.',
        choiceSaved: 'Your choice was saved.',
        yourTurn: 'Your turn: listen and choose a position.',
        othersCanSteal: 'Other players can try to steal before reveal.',
        placeBeforeReveal: 'You can place before the host reveals.',
        turnOf: "{name}'s turn",
        waitStealPhase: 'The player already chose. Wait for the steal phase.',
        waitPlayerChoice: 'Wait for the player to choose a position.',
        preparingReveal: 'Preparing reveal...',
        turnRegistered: 'Your turn was registered.',
        othersDecideSteal: 'Other players can decide whether to steal.',
        yourSteal: 'Your steal: {label}',
        stealSaved: 'Saved. You can cancel before reveal.',
        chooseSteal: 'Choose where to steal.',
        avoidTurnSlot: 'You cannot use the same position as the turn player. You can cancel if you change your mind.',
        noStealAvailable: 'Steal unavailable.',
        noBaseToSteal: 'There is no base year to steal against yet.',
        wantSteal: 'Do you want to steal this card?',
        chose: 'Chose: {label}',
        noTokensSteal: 'No coins to steal.',
        needToken: 'You need at least 1 coin.',
        reviewingResult: 'Checking result...',
        revealingSong: 'Revealing song...',
        pressNext: 'Press Next song to continue.',
        waitingNext: 'Waiting for the next song.',
        songRevealed: 'Song revealed.',
        autoGuessPrompt: 'Guess the song and who sings it.',
        autoGuessWaiting: 'They can earn 1 coin if both are right.',
        autoGuessSubmitted: 'Answer sent.',
        autoGuessNeedGuess: 'Enter your answer.',
        autoGuessNeedBoth: 'Enter the song and who sings it.',
        autoGuessSkipped: 'Bonus skipped.',
        autoGuessSaved: 'Answer saved.',
        autoGuessHintBeforeReveal: 'You can still earn 1 coin.',
        hostCanSkipAnswer: 'The host can move on if needed.',
        gameOver: 'Game over',
        hostReplay: 'The host can play again without reloading.',
        noLineToSteal: 'There is no timeline to steal against yet.',
        stealCancelled: 'Steal cancelled. You recovered your coin.'
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
        roomCodeFailed: 'Could not generate an available room. Try again.'
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
        tokensAlt: 'Coins'
    },
    summary: {
        cardFor: 'Card for: {name}',
        cardForRobbery: 'Card for: {name} (steal)',
        noCard: 'No one won a card this round.',
        autoGuessCorrectCoin: 'Both right. {name} earns 1 coin.',
        autoGuessCorrectMax: 'Both right, but they already have 5 coins.',
        autoGuessWrong: 'No coin this round.',
        autoGuessSkipped: 'They skipped the bonus this round.',
        autoGuessGuessScore: 'Song {song}% / who sings it {artist}%',
        autoGuessMissing: 'They did not try for the bonus.',
        exchangedCard: 'Card for: {name} (exchanged)',
        exchangedSelection: 'EXCHANGED',
        noSongs: 'No songs available',
        winner: '{name} won'
    },
    confirm: {
        leave: 'Leave?'
    }
};
