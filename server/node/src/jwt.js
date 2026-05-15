import jwt from 'jsonwebtoken';

const SECRET =
  process.env.JWT_SECRET ??
  (process.env.VERCEL === '1' ? '' : 'agrihub_secret_key_2026_nakasero');

if (!SECRET) {
  throw new Error('JWT_SECRET environment variable is required on Vercel');
}

export function generateToken(userId, email, role) {
  return jwt.sign({ sub: userId, email, role }, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}
