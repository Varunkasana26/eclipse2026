import React, { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        requestAnimationFrame(() => {
          cursorRef.current.style.transform = `translate(${e.clientX - 150}px, ${e.clientY - 150}px)`;
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-0 w-[300px] h-[300px] rounded-full will-change-transform"
      style={{
        background: 'radial-gradient(circle, rgba(0,255,255,0.15) 0%, transparent 60%)',
        filter: 'blur(60px)',
        transition: 'transform 0.1s cubic-bezier(0.2, 0, 0.2, 1)',
      }}
    />
  );
}
