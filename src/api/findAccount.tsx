import { searchUsers } from './userApi';
import { User } from '../store/types';

export async function findAccount(input: string): Promise<User[]> {
  try {
    const users = await searchUsers({ id: 0, name: input, avatar: '' });
    return users;
  } catch (error) {
    console.error('Error finding account:', error);
    return [];
  }
}
