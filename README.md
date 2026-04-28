# Practicas recomendadas

Esta carpeta es una version modular del juego para probar una estructura mas mantenible sin tocar el index principal.

## Estructura

- index.html: solo estructura HTML y referencias a archivos externos.
- styles.css: estilos visuales del juego.
- js/config.js: Firebase, constantes y estado global.
- js/helpers.js: utilidades, cartas, iconos y helpers de traduccion dinamica.
- js/tutorial.js: tutorial y arranque inicial.
- js/spotify.js: control del widget/audio de Spotify.
- js/rooms.js: crear sala, unirse, reconexion y escucha de Firebase.
- js/ui.js: renderizado de lobby, jugadores, turnos, timeline y estado visual.
- js/gameplay.js: acciones de juego, robo, voto, revelacion, rondas y salida.
- locales/: textos externos por idioma.
- assets/: iconos propios.
- canciones.js: catalogo de canciones para pruebas.

Abre index.html dentro de esta carpeta para probar esta version.
