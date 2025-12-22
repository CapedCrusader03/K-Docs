import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface UserInfo {
  id: string;
  email: string;
}

export function getUserFromToken(): UserInfo | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    const decoded = jwtDecode<DecodedToken>(token);
    return {
      id: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

