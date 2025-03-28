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
      glowing: boolean;
      glowIntensity: number;
      glowDirection: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2 + 0.5; // Smaller particles for more professional look
        this.speedX = (Math.random() - 0.5) * 0.2; // Slower movement
        this.speedY = (Math.random() - 0.5) * 0.2;
        this.glowing = Math.random() > 0.7; // 30% of particles will glow
        this.glowIntensity = Math.random() * 0.5 + 0.2; // Random glow intensity
        this.glowDirection = Math.random() > 0.5 ? 1 : -1; // Direction of glow pulsation

        // Futuristic color palette
        if (isDarkMode) {
          // Cosmic palette for dark mode
          const colors = [
            '#FFFFFF', // White
            '#E1F5FE', // Light Blue
            '#B3E5FC', // Lighter Blue
            '#4FC3F7', // Blue
            '#29B6F6', // Bright Blue
            '#9C27B0', // Purple
            '#673AB7', // Deep Purple
            '#3F51B5', // Indigo
          ];
          this.color = colors[Math.floor(Math.random() * colors.length)];
          this.alpha = Math.random() * 0.4 + 0.1; // More subtle
        } else {
          // Neo-futuristic palette for light mode
          const colors = [
            '#0288D1', // Blue
            '#29B6F6', // Light Blue
            '#4FC3F7', // Lighter Blue
            '#81D4FA', // Very Light Blue
            '#9C27B0', // Purple
            '#673AB7', // Deep Purple
            '#3F51B5', // Indigo
          ];
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

        // Update glow intensity for glowing particles
        if (this.glowing) {
          this.glowIntensity += 0.01 * this.glowDirection;
          if (this.glowIntensity > 0.7 || this.glowIntensity < 0.2) {
            this.glowDirection *= -1;
          }
        }
      }

      draw() {
        if (!ctx) return;

        // Draw regular particle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fill();

        // Add glow effect for some particles
        if (this.glowing) {
          const gradient = ctx.createRadialGradient(
            this.x,
            this.y,
            this.size * 0.5,
            this.x,
            this.y,
            this.size * 4,
          );
          gradient.addColorStop(0, this.color);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
          ctx.globalAlpha = this.glowIntensity * 0.2;
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      }
    }

    // Create particles - fewer for better performance and cleaner look
    const particleCount = Math.min(100, Math.floor((canvas.width * canvas.height) / 15000));
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

          if (distance < 100) {
            // Longer connection distance for more cosmic feel
            ctx.beginPath();
            // Fix the template string format - explicitly cast the calculated opacity to string
            const opacity = (0.03 * (1 - distance / 100)).toString();
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

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" style={{ pointerEvents: 'none' }} />;
};

export default ParticleBackground;
