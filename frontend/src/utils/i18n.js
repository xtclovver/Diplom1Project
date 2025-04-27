import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импорт ресурсов локализации
import translationRU from '../locales/ru.json';
import translationEN from '../locales/en.json';

// Доступные языки
export const AVAILABLE_LANGUAGES = {
  ru: 'Русский',
  en: 'English'
};

// Ресурсы для локализации
const resources = {
  ru: {
    translation: translationRU
  },
  en: {
    translation: translationEN
  }
};

i18n
  // Определение языка пользователя
  .use(LanguageDetector)
  // Подключение к React
  .use(initReactI18next)
  // Инициализация i18next
  .init({
    resources,
    fallbackLng: 'ru',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // Не экранировать HTML
    },
    
    // Опции для определения языка
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage'],
    }
  });

export default i18n; 