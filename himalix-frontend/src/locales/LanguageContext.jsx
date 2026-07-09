import React, { createContext, useContext, useState, useEffect } from 'react';
import en from './en.json';
import ne from './ne.json';

const LanguageContext = createContext();

const translations = { en, ne };

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('himalix-lang') || 'en';
  });

  const changeLanguage = (lang) => {
    setLocale(lang);
    localStorage.setItem('himalix-lang', lang);
  };

  const t = (keyPath, replacements = {}) => {
    const dict = translations[locale] || translations['en'];
    const keys = keyPath.split('.');
    
    let result = dict;
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        result = keyPath; // Fallback to key path itself
        break;
      }
    }

    if (typeof result === 'string') {
      let text = result;
      Object.entries(replacements).forEach(([key, val]) => {
        text = text.replace(`{{${key}}}`, val);
      });
      return text;
    }

    return result;
  };

  return (
    <LanguageContext.Provider value={{ locale, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
