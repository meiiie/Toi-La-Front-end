import { createUser, searchUsers } from './userApi';
import { NewAccountData, Permission, User } from '../store/types';

function generateRandomId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const users = await searchUsers({ id: 0, name: username, avatar: './hung.jpg' });
  return users.length > 0;
}

export async function registerAccount(newAccount: NewAccountData): Promise<void> {
  const usernameExists = await checkUsernameExists(newAccount.username);

  if (usernameExists) {
    throw new Error('Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác.');
  }

  const userId = generateRandomId();

  const newUser: Omit<User, 'id'> = {
    name: `${newAccount.firstName} ${newAccount.lastName}`,
    account: {
      username: newAccount.username,
      password: newAccount.password,
      phone: newAccount.phone,
      email: newAccount.email,
    },
    roles: [{ id: 3, name: 'User', permissions: ['READ' as Permission] }],
    avatar: './avatars/default.png',
  };

  await createUser(newUser);
}
