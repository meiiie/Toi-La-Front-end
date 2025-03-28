'use client';

import type React from 'react';
import { useRef, useEffect } from 'react';

interface ParticleBackgroundProps {
  isDarkMode: boolean;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full screen
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2 + 0.5; // Smaller particles for more professional look
        this.speedX = (Math.random() - 0.5) * 0.2; // Slower movement
        this.speedY = (Math.random() - 0.5) * 0.2;

        // Minimalist color palette based on theme
        if (isDarkMode) {
          // White/blue particles on dark background
          const colors = ['#FFFFFF', '#E1F5FE', '#B3E5FC', '#4FC3F7', '#29B6F6'];
          this.color = colors[Math.floor(Math.random() * colors.length)];
          this.alpha = Math.random() * 0.4 + 0.1; // More subtle
        } else {
          // Blue particles on light background
          const colors = ['#0288D1', '#29B6F6', '#4FC3F7', '#81D4FA', '#B3E5FC'];
          this.color = colors[Math.floor(Math.random() * colors.length)];
          this.alpha = Math.random() * 0.3 + 0.05; // Very subtle
        }
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around edges
        if (this.x > canvas!.width) this.x = 0;
        else if (this.x < 0) this.x = canvas!.width;

        if (this.y > canvas!.height) this.y = 0;
        else if (this.y < 0) this.y = canvas!.height;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Create particles - fewer for better performance and cleaner look
    const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw and update particles
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      // Draw connections between nearby particles - more subtle connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 80) {
            // Shorter connection distance for cleaner look
            ctx.beginPath();
            // Fix the template string format - explicitly cast the calculated opacity to string
            const opacity = (0.05 * (1 - distance / 80)).toString();
            const connectionColor = isDarkMode
              ? `rgba(255, 255, 255, ${opacity})`
              : `rgba(2, 136, 209, ${opacity})`;
            ctx.strokeStyle = connectionColor;
            ctx.lineWidth = 0.3; // Thinner lines
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isDarkMode]);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 z-0" style={{ pointerEvents: 'none' }} />
  );
};

export default ParticleBackground;
