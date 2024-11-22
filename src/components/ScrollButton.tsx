// src/components/ScrollButton.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';

interface ScrollButtonProps {
  partnersSectionRef: React.RefObject<HTMLElement>;
}

const ScrollButton: React.FC<ScrollButtonProps> = ({ partnersSectionRef }) => {
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [isNearTop, setIsNearTop] = useState(true);
  const [isBottom, setIsBottom] = useState(false);

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
      className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
    >
      {isNearBottom ? <FaChevronUp size={24} /> : <FaChevronDown size={24} />}
    </button>
  );
};

export default ScrollButton;
