/**
 * Formats a message creation timestamp to a friendly short 12-hour format (e.g., 08:34 PM).
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export const formatMessageTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Returns a friendly date title (e.g., Today, Yesterday, or a standard date string).
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
};
