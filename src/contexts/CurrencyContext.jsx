import { createContext, useContext, useState } from 'react';

const RATES = { ILS: 1, JOD: 0.1887 };
const SYMBOLS = { ILS: '₪', JOD: 'د.أ' };

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [cur, setCur] = useState('ILS');

  const conv = (v) => cur === 'ILS' ? v : Math.round(v * RATES.JOD);

  const fc = (v) => {
    const cv = conv(Number(v) || 0);
    return cv.toLocaleString('ar-SA') + ' ' + SYMBOLS[cur];
  };

  return (
    <CurrencyContext.Provider value={{ cur, setCur, conv, fc }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
