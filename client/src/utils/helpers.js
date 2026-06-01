/**
 * Formats a size in bytes to a human-readable string.
 * @param {number} bytes 
 * @returns {string}
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formats seconds to a human-readable MM:SS duration string.
 * @param {number} sec 
 * @returns {string}
 */
export const formatSeconds = (sec) => {
  if (isNaN(sec) || sec === null || sec === undefined) return '0:00';
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

/**
 * Strips markdown code fences from JSON strings.
 * @param {string} str 
 * @returns {string}
 */
export const cleanJSONString = (str) => {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
};
