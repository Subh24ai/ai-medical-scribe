import { isValidEmail, validatePassword } from '../utils';

if (!isValidEmail(email)) {
  setError('Invalid email');
}

const { isValid, strength } = validatePassword(password);
if (!isValid) {
  setError('Password must be 8+ chars with uppercase, lowercase, and number');
}