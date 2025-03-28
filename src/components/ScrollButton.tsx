'use client';

import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

interface ScrollButtonProps {
  partnersSectionRef: React.RefObject<HTMLElement>;
}

const ScrollButton: React.FC<ScrollButtonProps> = ({ partnersSectionRef }) => {
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [isNearTop, setIsNearTop] = useState(true);
  const [isBottom, setIsBottom] = useState(false);
  const { theme } = useTheme();

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const clientHeight = document.documentElement.clientHeight;
    const scrollHeight = document.documentElement.scrollHeight;

    setIsNearTop(scrollTop <= 100);
    if (partnersSectionRef.current) {
      const partnersSectionTop = partnersSectionRef.current.offsetTop;
      setIsNearBottom(scrollTop + clientHeight >= partnersSectionTop);
    } else {
      setIsNearBottom(scrollTop + clientHeight >= scrollHeight - 100);
    }
    setIsBottom(scrollTop + clientHeight >= scrollHeight - 10);
  }, [partnersSectionRef]);

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  if (isNearTop || isBottom) {
    return null;
  }

  return (
    <button
      onClick={isNearBottom ? scrollToTop : scrollToBottom}
      className="fixed bottom-8 right-8 z-50 transition-all duration-500 transform opacity-100"
      aria-label={isNearBottom ? 'Scroll to top' : 'Scroll to bottom'}
    >
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300 scale-110"></div>

        {/* Button background */}
        <div
          className={`relative flex items-center justify-center w-14 h-14 rounded-full border border-[#0288D1]/50 group-hover:border-[#0288D1] shadow-[0_0_15px_rgba(2,136,209,0.3)] group-hover:shadow-[0_0_25px_rgba(2,136,209,0.5)] transition-all duration-300 ${
            theme === 'dark' ? 'bg-[#0A1416]' : 'bg-white'
          }`}
        >
          {isNearBottom ? (
            <FaChevronUp
              className="text-[#0288D1] group-hover:text-[#E1F5FE] transition-colors duration-300"
              size={20}
            />
          ) : (
            <FaChevronDown
              className="text-[#0288D1] group-hover:text-[#E1F5FE] transition-colors duration-300"
              size={20}
            />
          )}
        </div>
      </div>
    </button>
  );
};

export default ScrollButton;
