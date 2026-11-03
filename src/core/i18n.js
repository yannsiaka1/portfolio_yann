// Langue de la page : les textes écrits par les scripts suivent l'attribut lang de <html>,
// en français (index.html) ou en anglais (en/index.html). Le contenu de la page, lui, est écrit dans le HTML.
export const lang = (document.documentElement.lang || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';

/** Locale des dates et des heures (horloges). */
export const locale = lang === 'en' ? 'en-CA' : 'fr-CA';

/** Texte dans la langue de la page : t({ fr: '…', en: '…' }). */
export const t = (texts) => (lang in texts ? texts[lang] : texts.fr);
