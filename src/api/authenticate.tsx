import { searchUsers } from './userApi';
import { User } from '../store/types';

export async function authenticate(username: string, password: string): Promise<User | undefined> {
  try {
    const users = await searchUsers({ id: 0, name: username, avatar: '' });
    if (users.length > 0) {
      return users[0];
    } else {
      return undefined;
    }
  } catch (error) {
    console.error('Authentication failed:', error);
    return undefined;
  }
}

export type { User };
