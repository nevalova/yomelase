const TUTORIAL_KEY = 'hitster_tutorial_until_v2';
const TUTORIAL_TTL_MS = 24 * 60 * 60 * 1000;
const CONTEXT_GUIDE_KEY = 'hitster_context_guide_enabled_v1';
const CONTEXT_GUIDE_SEEN_PREFIX = 'hitster_context_guide_seen_v1_';
const tutorialSteps = Array.isArray(i18nValue('tutorial.steps', [])) ? i18nValue('tutorial.steps', []) : [];
let tutorialStepIndex = 0;

function contextGuideEnabled() {
    return localStorage.getItem(CONTEXT_GUIDE_KEY) !== '0';
}

function contextGuideSeenKey(key) {
    return `${CONTEXT_GUIDE_SEEN_PREFIX}${key}`;
}

function clearContextGuideSeen() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CONTEXT_GUIDE_SEEN_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
}

function syncContextGuideToggle() {
    const toggle = document.getElementById('context-guide-toggle');
    const copy = document.getElementById('guide-toggle-copy');
    const enabled = contextGuideEnabled();
    if (toggle) toggle.checked = enabled;
    if (copy) copy.innerText = enabled ? t('guide.toggleCopyOn') : t('guide.toggleCopyOff');
}

function setTutorialMode(mode) {
    const help = document.getElementById('tutorial-help-menu');
    const body = document.getElementById('tutorial-body');
    const dots = document.getElementById('tutorial-dots');
    const controls = document.getElementById('tutorial-controls');
    const isHelp = mode === 'help';
    if (help) help.classList.toggle('hidden', !isHelp);
    if (body) body.classList.toggle('hidden', isHelp);
    if (dots) dots.classList.toggle('hidden', isHelp);
    if (controls) controls.classList.toggle('hidden', isHelp);
}

function openHelpMenu() {
    setTutorialMode('help');
    document.getElementById('tutorial-step-label').innerText = t('tutorial.label');
    document.getElementById('tutorial-title').innerText = t('guide.menuTitle');
    const menuBody = document.getElementById('guide-menu-body');
    if (menuBody) menuBody.innerText = t('guide.menuBody');
    syncContextGuideToggle();
    document.getElementById('tutorial-overlay').classList.remove('hidden');
}

function tutorialViewedUntil(){
    return Number(localStorage.getItem(TUTORIAL_KEY) || 0);
}
function shouldShowTutorial(){
    return now() > tutorialViewedUntil();
}
function rememberTutorialForDay(){
    localStorage.setItem(TUTORIAL_KEY, String(now() + TUTORIAL_TTL_MS));
}
function renderTutorialStep(){
    setTutorialMode('steps');
    const step = tutorialSteps[tutorialStepIndex];
    document.getElementById('tutorial-step-label').innerText = t('tutorial.stepLabel', { current: tutorialStepIndex + 1, total: tutorialSteps.length });
    document.getElementById('tutorial-title').innerText = step.title || '';
    document.getElementById('tutorial-body').innerText = step.body || '';
    const dots = document.getElementById('tutorial-dots');
    dots.innerHTML = tutorialSteps.map((_, i) => `<div class="tutorial-dot ${i === tutorialStepIndex ? 'active' : ''}"></div>`).join('');
    document.getElementById('tutorial-next').innerText = tutorialStepIndex === tutorialSteps.length - 1 ? t('tutorial.done') : t('tutorial.next');
}
function openTutorial(manual = false){
    if (manual) {
        openHelpMenu();
        return;
    }
    tutorialStepIndex = 0;
    renderTutorialStep();
    document.getElementById('tutorial-overlay').classList.remove('hidden');
    if (manual) return;
}

function startTutorialFromHelp() {
    tutorialStepIndex = 0;
    renderTutorialStep();
}
function closeTutorial(markSeen = true){
    document.getElementById('tutorial-overlay').classList.add('hidden');
    if (markSeen) rememberTutorialForDay();
}
function nextTutorialStep(){
    if (tutorialStepIndex >= tutorialSteps.length - 1) {
        closeTutorial(true);
        return;
    }
    tutorialStepIndex += 1;
    renderTutorialStep();
}
function skipTutorial(){
    closeTutorial(true);
}

function setContextGuideEnabled(enabled, resetSeen = false) {
    localStorage.setItem(CONTEXT_GUIDE_KEY, enabled ? '1' : '0');
    if (enabled && resetSeen) clearContextGuideSeen();
    syncContextGuideToggle();
    renderContextGuide();
}

function dismissContextGuideCue(key) {
    if (key) localStorage.setItem(contextGuideSeenKey(key), '1');
    renderContextGuide();
}

function hideContextGuide() {
    setContextGuideEnabled(false);
}

function clearContextGuideCues() {
    document.querySelectorAll('.context-guide-cue').forEach((el) => el.remove());
}

function contextGuideWasSeen(key) {
    return localStorage.getItem(contextGuideSeenKey(key)) === '1';
}

function firstUnseenContextGuide(candidates) {
    return candidates.find((cue) => cue?.key && !contextGuideWasSeen(cue.key)) || null;
}

function currentContextGuideCue() {
    const app = document.getElementById('app');
    if (!app || app.classList.contains('hidden') || !salaA) return null;

    const estadoSala = salaMetaCache.estado_sala || FASES.LOBBY;
    if (estadoSala !== ESTADO_EN_PARTIDA) return null;

    const e = estadoCache || estadoJuegoBase(FASES.LOBBY);
    const fase = e.fase || FASES.LOBBY;
    const miEntidad = typeof entidadDeJugador === 'function' ? entidadDeJugador(miId) : null;
    const turnoEntidad = typeof entidadPorTurno === 'function'
        ? (entidadPorTurno(e) || (e.turno_de ? entidadDeJugador(e.turno_de) : null))
        : null;
    const esMiTurnoEntidad = !!(miEntidad && turnoEntidad && miEntidad.type === turnoEntidad.type && miEntidad.id === turnoEntidad.id);
    const esJugadorActivo = e.turno_de === miId;

    if (fase === FASES.JUGANDO) {
        const candidates = [];
        if (esMiTurnoEntidad && esJugadorActivo && !e.seleccion_turno) candidates.push({ key: 'placement', target: 'zona-posicion' });
        if (esMiTurnoEntidad && esJugadorActivo && e.seleccion_turno && !esSolitario() && puedeBonusMoneda()) candidates.push({ key: 'coin_bonus', target: 'zona-autoguess' });
        if (esMiTurnoEntidad && esJugadorActivo && !e.seleccion_turno && !esSolitario() && misT >= 3) candidates.push({ key: 'exchange', target: 'zona-canje' });
        if (esHost && e.cancion_actual) candidates.push({ key: 'host_reveal', target: 'host-controls' });
        return firstUnseenContextGuide(candidates);
    }

    if (fase === FASES.ESPERA_ROBO) {
        const candidates = [];
        if (esMiTurnoEntidad && esJugadorActivo && !esSolitario() && puedeBonusMoneda()) candidates.push({ key: 'coin_bonus', target: 'zona-autoguess' });
        if (!esMiTurnoEntidad && miEntidad) {
            const miRobo = e.robos?.[miEntidad.key];
            if (miRobo?.pagado && !miRobo?.slot) candidates.push({ key: 'steal_place', target: 'zona-posicion' });
            if (!miRobo && misT >= 1) candidates.push({ key: 'steal_offer', target: 'zona-robo' });
        }
        if (esHost && e.cancion_actual) candidates.push({ key: 'host_reveal', target: 'host-controls' });
        return firstUnseenContextGuide(candidates);
    }

    if ((fase === FASES.REVELANDO || fase === FASES.RESULTADO) && e.cancion_actual) {
        return firstUnseenContextGuide([
            { key: esHost ? 'host_next' : 'result', target: esHost ? 'host-controls' : 'resultado-panel' }
        ]);
    }

    if (fase === FASES.FINAL) return firstUnseenContextGuide([{ key: 'final', target: 'final-panel' }]);
    return null;
}

function renderContextGuide() {
    clearContextGuideCues();
    if (!contextGuideEnabled()) return;

    const cue = currentContextGuideCue();
    if (!cue) return;

    const target = document.getElementById(cue.target);
    if (!target || target.classList.contains('hidden')) return;

    const el = document.createElement('div');
    el.className = 'context-guide-cue';
    el.innerHTML = `
        <div class="context-guide-copy">
            <strong>${t(`guide.cues.${cue.key}.title`)}</strong>
            <span>${t(`guide.cues.${cue.key}.body`)}</span>
        </div>
        <div class="context-guide-actions">
            <button type="button" onclick="dismissContextGuideCue('${cue.key}')">${t('guide.bubbleDone')}</button>
            <button type="button" onclick="hideContextGuide()">${t('guide.bubbleHide')}</button>
        </div>
    `;
    target.prepend(el);
}


window.onload = () => {
    limpiarLocalStorageLegado();
    watchFirebaseConnection();
    const params = new URLSearchParams(window.location.search);
    if (params.get('sala')) document.getElementById('salaI').value = params.get('sala').toUpperCase();
    if (localStorage.getItem('hitster_nombre')) document.getElementById('nombreI').value = localStorage.getItem('hitster_nombre');
    audioLocalEnabled = localStorage.getItem(AUDIO_LOCAL_KEY) === '1';
    const audioToggle = document.getElementById('audio-local-toggle');
    if (audioToggle) audioToggle.checked = audioLocalEnabled;
    renderReconnectCard();
    syncContextGuideToggle();
    if (shouldShowTutorial()) openTutorial(false);
};
