import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import { NavLink, Navigate } from 'react-router-dom';
import './Main.css'; // Import the CSS file for animations

export default function Main() {
  const permissions = useSelector((state: RootState) => state.users.permissions);
  const user = useSelector((state: RootState) => state.users.user);
  const fullText = 'Bầu Cử Nào';

  if (!user) {
    return <Navigate to="/" />;
  }

  if (permissions === undefined) {
    return null;
  }

  return (
    <main className="w-screen min-h-[80vh] items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 py-12">
      <div
        className="relative grid place-items-center min-h-screen bg-fixed bg-cover bg-center"
        style={{ backgroundImage: 'url(./your-geometric-pattern.png)' }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative w-full max-w-3xl p-6 md:p-12 text-center">
          <div className="relative mx-auto mb-4 w-32 h-32 md:w-40 md:h-40 bg-sky-200 rounded-full flex items-center justify-center">
            <img src="./logo_truong.png" alt="Logo" className="w-24 h-24 md:w-32 md:h-32" />
          </div>
          <h1
            className="text-6xl md:text-8xl font-extrabold text-white shadow-xl text-shadow-blue animate-fade-in gradient-text"
            style={{
              letterSpacing: '0.1em',
              lineHeight: '1.2em', // Adjust the line height for proper spacing between lines
              wordWrap: 'break-word', // Allows the text to wrap within the container
              whiteSpace: 'normal', // Makes sure long text wraps normally
            }}
          >
            {user ? `${fullText} ${user.name}!` : 'Hãy Đăng Nhập!'}
          </h1>
          <div className="flex items-center justify-center mt-8 w-full">
            <div className="flex-grow border-t border-white"></div>
            <NavLink
              to="/app"
              className="relative mx-4 px-4 md:px-8 py-2 md:py-4 text-lg md:text-xl font-semibold text-white bg-gradient-to-r from-green-500 to-blue-500 rounded-full shadow-md transition ease-in-out duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transform hover:scale-105 hover:from-green-400 hover:to-blue-400"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20 transition-opacity duration-300"></span>
              Bắt đầu
            </NavLink>
            <div className="flex-grow border-t border-white"></div>
          </div>
        </div>
      </div>
    </main>
  );
}
