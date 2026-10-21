import React, { useEffect, useRef } from 'react';

export interface FogCanvasProps {
  density?: 'off' | 'low' | 'high';
  className?: string;
  style?: React.CSSProperties;
}

export const FogCanvas: React.FC<FogCanvasProps> = ({
  density = 'low',
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (density === 'off') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle count: 12 for low, 22 for high (very lean CPU)
    const count = density === 'high' ? 22 : 12;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: height - Math.random() * (height * 0.45), // Concentrated at bottom ground
      radius: 120 + Math.random() * 180,
      vx: (Math.random() - 0.5) * 0.25, // Gentle drift
      vy: (Math.random() - 0.5) * 0.08,
      alpha: 0.02 + Math.random() * 0.035,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -p.radius) p.x = width + p.radius;
        if (p.x > width + p.radius) p.x = -p.radius;
        if (p.y < height * 0.5) p.y = height;
        if (p.y > height + p.radius) p.y = height * 0.55;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, `rgba(220, 225, 235, ${p.alpha})`);
        grad.addColorStop(0.6, `rgba(180, 190, 205, ${p.alpha * 0.4})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [density]);

  if (density === 'off') return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85,
        ...style,
      }}
    />
  );
};
