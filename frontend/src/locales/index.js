import ru from './ru.json';
import en from './en.json';

export { ru, en };

export const LANGUAGES = {
  RU: 'ru',
  EN: 'en'
};

export const getLanguageName = (code) => {
  switch (code) {
    case LANGUAGES.RU:
      return 'Русский';
    case LANGUAGES.EN:
      return 'English';
    default:
      return code;
  }
};

export const languageOptions = [
  { value: LANGUAGES.RU, label: getLanguageName(LANGUAGES.RU) },
  { value: LANGUAGES.EN, label: getLanguageName(LANGUAGES.EN) }
]; 