import type React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative group"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] blur-md opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
      <div className="relative flex items-center justify-center w-10 h-10 bg-[#263238] dark:bg-[#0A1416] light:bg-[#E1F5FE] rounded-full border border-[#455A64] group-hover:border-[#0288D1] transition-all duration-300">
        {theme === 'dark' ? (
          <FaSun
            className="text-[#E1F5FE] group-hover:text-[#FFD700] transition-colors duration-300"
            size={18}
          />
        ) : (
          <FaMoon
            className="text-[#0A1416] group-hover:text-[#0288D1] transition-colors duration-300"
            size={18}
          />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
