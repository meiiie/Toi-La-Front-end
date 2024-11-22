import { authenticate } from './api/authenticate';
import { authorize } from './api/authorize';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from './store/store';
import {
  authenticateAction,
  authenticatedAction,
  authorizeAction,
  authorizedAction,
} from './store/userSlice';

export function Header() {
  const user = useSelector((state: RootState) => state.users.user);
  const loading = useSelector((state: RootState) => state.users.loading);
  const dispatch = useDispatch();
  async function handleSignInClick() {
    dispatch(authenticateAction());
    const authenticatedUser = await authenticate('username', 'password');
    dispatch(authenticatedAction(authenticatedUser));
    if (authenticatedUser !== undefined) {
      dispatch(authorizeAction());
      const authorizedPermissions = await authorize(authenticatedUser.id.toString());
      dispatch(authorizedAction(authorizedPermissions));
    }
  }

  return (
    <header>
      <h1>Welcome to the Election App</h1>
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <p>Hello, {user.name}</p>
      ) : (
        <button onClick={handleSignInClick}>Sign In</button>
      )}
    </header>
  );
}
