// HIBP k-anonymity check (no local storage, no extra deps)
export const isBreachedPassword = async (password: string): Promise<boolean> => {
  const sha1 = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
  const hex = [...new Uint8Array(sha1)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  const prefix = hex.slice(0, 5);
  const suffix = hex.slice(5);

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: {'Add-Padding': 'true'},
  });
  if (!res.ok) throw new Error('HIBP lookup failed');

  // Returned body is small (~500–1000 lines): SUFFIX:COUNT
  const body = await res.text();
  return body.split('\n').some(line => line.startsWith(suffix));
};

export const validatePasswordStrength = async (password: string): Promise<void> => {
  const minLength = 16;
  const maxLength = 128;

  if (typeof password !== 'string' || password.trim().length === 0) {
    throw new Error('Password must be a non-empty string');
  }
  if (password.length < minLength) {
    throw new Error(`Password must be at least ${minLength} characters long`);
  }
  if (password.length > maxLength) {
    throw new Error(`Password must be no more than ${maxLength} characters long`);
  }

  const uniqueChars = new Set(password).size;
  if (uniqueChars < 6) {
    throw new Error('Password must contain more character diversity');
  }

  if (/(.)\1{7,}/.test(password)) {
    throw new Error('Password contains excessive repeated characters');
  }
};

export const validatePassword = async (password: string): Promise<void> => {
  await validatePasswordStrength(password);
  const breached = await isBreachedPassword(password);
  if (breached) {
    throw new Error('Password has been found in data breaches; choose a different password');
  }
};
