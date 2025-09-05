// Fix for importing JSON modules in TypeScript
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="node" />

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../../public/locales/en/common.json'
import fr from '../../public/locales/fr/common.json'
import pt from '../../public/locales/pt/common.json'

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { common: en },
      fr: { common: fr },
      pt: { common: pt },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
}

export default i18n
