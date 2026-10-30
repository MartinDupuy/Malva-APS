'use strict';

const TokenService = require('../../services/auth/domain/TokenService');
const JwtTokenService = require('../../services/auth/adapters/JwtTokenService');

describe('JwtTokenService adapter and TokenService port', () => {
  const testSecret = 'super-secret-test-key-12345';
  const tokenService = new JwtTokenService({ secret: testSecret, expiresIn: '1h' });

  describe('TokenService port contract', () => {
    test('unimplemented TokenService should throw "Method not implemented."', () => {
      const port = new TokenService();
      expect(() => port.sign({})).toThrow('Method not implemented.');
      expect(() => port.verify('token')).toThrow('Method not implemented.');
    });

    test('JwtTokenService should inherit from TokenService', () => {
      expect(tokenService).toBeInstanceOf(TokenService);
    });

    test('should throw error if secret is empty or missing', () => {
      expect(() => new JwtTokenService({ secret: '' })).toThrow('JWT secret is required');
      expect(() => new JwtTokenService({ secret: '   ' })).toThrow('JWT secret is required');
    });
  });

  describe('sign()', () => {
    test('should return a valid JWT format string (3 dot-separated parts)', () => {
      const token = tokenService.sign({ userId: 'u-1', role: 'PASSENGER' });

      expect(typeof token).toBe('string');
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });

    test('should throw error when payload is missing or invalid', () => {
      expect(() => tokenService.sign()).toThrow('payload is required and must be an object');
      expect(() => tokenService.sign(null)).toThrow('payload is required and must be an object');
      expect(() => tokenService.sign('string-payload')).toThrow('payload is required and must be an object');
    });
  });

  describe('verify()', () => {
    test('should decode and verify valid token, restoring original payload data', () => {
      const payload = { userId: 'u-123', email: 'user@example.com', role: 'ADMIN' };
      const token = tokenService.sign(payload);

      const decoded = tokenService.verify(token);
      expect(decoded.userId).toBe('u-123');
      expect(decoded.email).toBe('user@example.com');
      expect(decoded.role).toBe('ADMIN');
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    test('should throw error when token has been tampered with', () => {
      const token = tokenService.sign({ userId: 'u-1' });
      const tamperedToken = token.slice(0, -5) + 'abcde';

      expect(() => tokenService.verify(tamperedToken)).toThrow('Token verification failed');
    });

    test('should throw error when token is expired', () => {
      const shortLivedService = new JwtTokenService({ secret: testSecret, expiresIn: '0s' });
      const token = shortLivedService.sign({ userId: 'u-expired' });

      expect(() => shortLivedService.verify(token)).toThrow('Token verification failed: jwt expired');
    });

    test('should throw error when token is missing, empty or not a string', () => {
      expect(() => tokenService.verify()).toThrow('token is required');
      expect(() => tokenService.verify('')).toThrow('token is required');
      expect(() => tokenService.verify('   ')).toThrow('token is required');
      expect(() => tokenService.verify(12345)).toThrow('token is required');
    });
  });
});
