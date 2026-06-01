import { useState } from 'react';

/**
 * Reusable hook to synchronize a state variable with localStorage.
 * @param {string} key 
 * @param {*} initialValue 
 * @returns {[*, Function]}
 */
export default function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('[useLocalStorage Error]:', error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('[useLocalStorage Set Error]:', error);
    }
  };

  return [storedValue, setValue];
}
