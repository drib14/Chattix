import { useState, useEffect } from 'react';

/**
 * Reusable hook to debounce a state variable value over a specified delay.
 * @param {*} value 
 * @param {number} delay 
 * @returns {*}
 */
export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
