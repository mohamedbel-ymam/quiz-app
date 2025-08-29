import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: { translation: {
    'Start': 'Démarrer',
    'Start quiz': 'Démarrer le quiz',
    'Next': 'Suivant',
    'Submit': 'Envoyer',
    'Time left': 'Temps restant',
    'Question': 'Question',
    'Name': 'Nom',
    'Phone': 'Téléphone',
    'Degree': 'Niveau',
    'Subject': 'Matière',
    'You have already taken this quiz. Please contact the admin if you need another chance.':
      'Vous avez déjà passé ce quiz. Veuillez contacter l’administrateur pour une nouvelle tentative.',
    'You have already submitted this quiz.': 'Vous avez déjà soumis ce quiz.',
    'Unable to start quiz.': 'Impossible de démarrer le quiz.',
    'Submit failed. Please contact the admin.': 'Échec de l’envoi. Veuillez contacter l’administrateur.',
  }},
  en: { translation: {} },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('lang') || 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export default i18n;
