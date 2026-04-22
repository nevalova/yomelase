(function () {
    const supported = ['es', 'en'];
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('lang') || localStorage.getItem('ymls_lang') || '';
    const browserLangs = navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || navigator.userLanguage || 'en'];

    function normalizeLang(lang) {
        const value = String(lang || '').toLowerCase();
        if (value.startsWith('es')) return 'es';
        return 'en';
    }

    const forcedLang = forced ? normalizeLang(forced) : '';
    const selected = forcedLang && supported.includes(forcedLang)
        ? forcedLang
        : normalizeLang(browserLangs[0]);

    window.YMLS_LANG = selected;
    window.YMLS_LOCALES = window.YMLS_LOCALES || {};
    document.documentElement.lang = selected;

    const scriptUrl = document.currentScript ? document.currentScript.src : '';
    const baseUrl = scriptUrl ? new URL('.', scriptUrl).href : 'locales/';
    document.write('<script src="' + baseUrl + selected + '.js"><\/script>');

    function readKey(key) {
        const dict = window.YMLS_LOCALES[selected] || window.YMLS_LOCALES.en || window.YMLS_LOCALES.es || {};
        return String(key || '').split('.').reduce((value, part) => {
            if (value && Object.prototype.hasOwnProperty.call(value, part)) return value[part];
            return undefined;
        }, dict);
    }

    window.i18nValue = function (key, fallback) {
        const value = readKey(key);
        return value === undefined ? fallback : value;
    };

    window.t = function (key, vars) {
        const value = readKey(key);
        const template = typeof value === 'string' ? value : String(key || '');
        const data = vars || {};
        return template.replace(/\{([a-zA-Z0-9_]+)\}/g, function (_, name) {
            return data[name] === undefined || data[name] === null ? '' : String(data[name]);
        });
    };

    window.applyI18n = function (root) {
        const scope = root || document;
        scope.querySelectorAll('[data-i18n]').forEach(function (el) {
            el.textContent = window.t(el.getAttribute('data-i18n'));
        });
        scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            el.setAttribute('placeholder', window.t(el.getAttribute('data-i18n-placeholder')));
        });
        scope.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            el.setAttribute('title', window.t(el.getAttribute('data-i18n-title')));
        });
        scope.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
            el.setAttribute('alt', window.t(el.getAttribute('data-i18n-alt')));
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        window.applyI18n(document);
    });
})();
