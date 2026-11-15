import { AuthenticationError } from '../errors.js';
import { verifyAccessToken } from '../security/jwt.js';

export class AuthService {
  constructor({ login, fullName, jwtSecret }) {
    this.login = login;
    this.fullName = fullName;
    this.jwtSecret = jwtSecret;
  }

  authenticate(authorization = '') {
    const match = /^Bearer ([^\s]+)$/i.exec(authorization);
    if (!match) throw new AuthenticationError('invalid or missing bearer token');
    try {
      return verifyAccessToken(match[1], this.jwtSecret);
    } catch {
      throw new AuthenticationError('invalid or missing bearer token');
    }
  }

  getLogin() {
    return this.login;
  }

  getAuthor() {
    return { login: this.login, fullName: this.fullName };
  }

  getSession(authentication) {
    const role = authentication.role;
    return {
      role,
      displayName: role === 'reviewer' ? 'Преподаватель' : this.fullName,
      author: this.getAuthor(),
      issuedAt: new Date(authentication.iat * 1000).toISOString(),
      expiresAt: new Date(authentication.exp * 1000).toISOString(),
    };
  }
}
