import React, { useEffect, useRef } from "react";

// 🔹 Particle class moved OUTSIDE the component
class Particle {
  constructor(canvas, ctx, colors) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Random initial position inside canvas
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;

    // Random size
    this.radius = Math.random() * 2 + 1;

    // Random color
    this.color = colors[Math.floor(Math.random() * colors.length)];

    // Random movement speed
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.speedY = (Math.random() - 0.5) * 0.5;
  }

  // 🔹 Draw particle on canvas
  draw() {
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = this.color;

    this.ctx.fillStyle = this.color;
    this.ctx.fill();

    // reset shadow to avoid performance loss on clearRect
    this.ctx.shadowBlur = 0;
  }

  // 🔹 Update position and redraw
  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    // Wrap around edges
    if (this.x < 0) this.x = this.canvas.width;
    if (this.x > this.canvas.width) this.x = 0;
    if (this.y < 0) this.y = this.canvas.height;
    if (this.y > this.canvas.height) this.y = 0;

    this.draw();
  }
}

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Get canvas and context
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let particles = [];
    // Adjust logic to fit screen sizes roughly
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 50 : 100;

    // Using blue and red to match our dashboard theme, plus default dot whites
    const colors = ["rgba(255,255,255,0.7)"];

    // 🔹 Create particles
    function createParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas, ctx, colors));
      }
    }

    // 🔹 Handle resizing of screen
    function handleResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles();
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    let animationId;

    // 🔹 Animation loop
    function animate() {
      // Clear the canvas fully each frame so trails don't stack indefinitely
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => p.update());

      animationId = requestAnimationFrame(animate);
    }

    animate();

    // 🔹 Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1] opacity-40 mix-blend-screen"
      style={{ top: 0, left: 0, width: "100%", height: "100%" }}
    />
  );
}
