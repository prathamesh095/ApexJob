
import { User } from '../types';

const AUTH_KEY = 'apex_auth_session';
const USERS_KEY = 'apex_users_registry';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 Hours

interface Session {
  user: User;
  expiry: number;
}

interface RegisteredUser extends User {
  passwordHash: string;
}

class AuthService {
  private async hashPassword(password: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getUsers(): RegisteredUser[] {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Auth Registry Corrupt", e);
      return [];
    }
  }

  private setUsers(users: RegisteredUser[]): void {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
      throw new Error("Unable to save user registry. Storage full?");
    }
  }

  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(AUTH_KEY);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      
      // Validation: Check for new Session structure
      if (parsed.user && parsed.expiry) {
        if (Date.now() > parsed.expiry) {
          console.warn("Session expired. Forcing logout.");
          this.logout();
          return null;
        }
        return parsed.user;
      }
      
      // Fallback/Legacy: If data exists but isn't a Session object, treat as invalid/expired to force re-auth
      this.logout();
      return null;
    } catch (e) {
      console.warn("Session data corrupt, forcing logout");
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
  }

  async signup(name: string, email: string, password: string): Promise<User> {
    if (!name || !email || password.length < 8) {
      throw new Error("Invalid registration data. Password must be 8+ characters.");
    }

    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Identity already exists in system registry.");
    }

    const passwordHash = await this.hashPassword(password);
    const newUser: RegisteredUser = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      token: Math.random().toString(36).substring(7),
      role: 'USER',
      passwordHash
    };

    this.setUsers([...users, newUser]);
    
    const { passwordHash: _, ...userSafe } = newUser;
    const session: Session = {
      user: userSafe,
      expiry: Date.now() + SESSION_TTL
    };
    
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return userSafe;
  }

  async login(email: string, password: string): Promise<User> {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) throw new Error("Credentials rejected by authentication gate.");

    const hash = await this.hashPassword(password);
    if (user.passwordHash !== hash) {
      throw new Error("Credentials rejected by authentication gate.");
    }

    const { passwordHash: _, ...userSafe } = user;
    const session: Session = {
      user: userSafe,
      expiry: Date.now() + SESSION_TTL
    };
    
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return userSafe;
  }

  logout(): void {
    localStorage.removeItem(AUTH_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }
}

export const auth = new AuthService();
