const TUTORIAL_KEY = 'hitster_tutorial_until_v2';
const TUTORIAL_TTL_MS = 24 * 60 * 60 * 1000;
const tutorialSteps = Array.isArray(i18nValue('tutorial.steps', [])) ? i18nValue('tutorial.steps', []) : [];
let tutorialStepIndex = 0;

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
    const step = tutorialSteps[tutorialStepIndex];
    document.getElementById('tutorial-step-label').innerText = t('tutorial.stepLabel', { current: tutorialStepIndex + 1, total: tutorialSteps.length });
    document.getElementById('tutorial-title').innerText = step.title || '';
    document.getElementById('tutorial-body').innerText = step.body || '';
    const dots = document.getElementById('tutorial-dots');
    dots.innerHTML = tutorialSteps.map((_, i) => `<div class="tutorial-dot ${i === tutorialStepIndex ? 'active' : ''}"></div>`).join('');
    document.getElementById('tutorial-next').innerText = tutorialStepIndex === tutorialSteps.length - 1 ? t('tutorial.done') : t('tutorial.next');
}
function openTutorial(manual = false){
    tutorialStepIndex = 0;
    renderTutorialStep();
    document.getElementById('tutorial-overlay').classList.remove('hidden');
    if (manual) return;
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


window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sala')) document.getElementById('salaI').value = params.get('sala').toUpperCase();
    if (localStorage.getItem('hitster_nombre')) document.getElementById('nombreI').value = localStorage.getItem('hitster_nombre');
    if (!params.get('sala') && getStoredRoomCode()) document.getElementById('salaI').value = getStoredRoomCode().toUpperCase();
    audioLocalEnabled = localStorage.getItem(AUDIO_LOCAL_KEY) === '1';
    const audioToggle = document.getElementById('audio-local-toggle');
    if (audioToggle) audioToggle.checked = audioLocalEnabled;
    renderReconnectCard();
    if (shouldShowTutorial()) openTutorial(false);
};
