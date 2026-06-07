// Password validation regex
// Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 special character, 2-3 digits
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

// Username validation
export const usernameRegex = /^[a-z0-9_]{3,20}$/;

// Mobile number validation (10 digits)
export const mobileRegex = /^[0-9]{10}$/;

// Email validation
export const emailRegex = /^\S+@\S+\.\S+$/;

export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least 1 uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain lowercase letters';
  }
  if (!/[@$!%*?&#]/.test(password)) {
    return 'Password must contain at least 1 special character';
  }
  if ((password.match(/\d/g) || []).length < 2) {
    return 'Password must contain at least 2-3 digits';
  }
  return null;
};

export const validateUsername = (username) => {
  if (!username || username.length < 3) {
    return 'Username must be at least 3 characters long';
  }
  if (!usernameRegex.test(username)) {
    return 'Username can only contain lowercase letters, numbers, and underscores';
  }
  return null;
};
