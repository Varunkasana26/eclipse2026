import React, { useEffect, useRef } from 'react';

// Expose a global toast mechanism
window.showToast = (message, type = 'success') => {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  const isError = type === 'error';
  toast.className = `glass-toast flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-xl transition-all duration-500 transform translate-x-full opacity-0 ${
    isError 
      ? 'bg-rose-500/10 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.3)] text-rose-100'
      : 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-emerald-100'
  }`;
  
  toast.innerHTML = `
    <div class="w-2 h-2 rounded-full ${isError ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}"></div>
    <p class="text-sm font-medium tracking-wide">${message}</p>
  `;

  toastContainer.appendChild(toast);

  // Slide in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });

  // Slide out and remove
  setTimeout(() => {
    toast.style.transform = 'translate-x-full';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
};

export default function GlobalEffects() {
  const cardsRef = useRef([]);

  useEffect(() => {
    // Collect all cards for tilt effect
    const updateCards = () => {
      // Find elements that look like cards (simplified selector)
      cardsRef.current = document.querySelectorAll('section, .hover-tilt');
    };
    
    updateCards();
    const observerObj = new MutationObserver(updateCards);
    observerObj.observe(document.body, { childList: true, subtree: true });

    // Parallax tilt for cards
    const handleMouseMove = (e) => {
      cardsRef.current.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const isInside = 
          e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom;
          
        if (isInside) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -8; // soft tilt
          const rotateY = ((x - centerX) / centerX) * 8;
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
          card.style.boxShadow = '0 15px 50px rgba(0, 255, 255, 0.15)';
          card.style.borderColor = 'rgba(0, 255, 255, 0.4)';
        } else {
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
          card.style.boxShadow = '';
          card.style.borderColor = '';
        }
      });
    };

    // Ripple effect for buttons
    const handleMouseClick = (e) => {
      const btn = e.target.closest('button');
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const circle = document.createElement('span');
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;
        
        // ensure position relative overflow hidden on btn via css
        btn.classList.add('overflow-hidden', 'relative');
        
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - rect.left - radius}px`;
        circle.style.top = `${e.clientY - rect.top - radius}px`;
        circle.classList.add('ripple');
        
        const rippleElement = btn.querySelector('.ripple');
        if (rippleElement) {
          rippleElement.remove();
        }
        btn.appendChild(circle);
      }
    };

    // Scroll reveal observer
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    const setupScrollReveal = () => {
      document.querySelectorAll('section, .reveal-on-scroll').forEach((el) => {
        if (!el.classList.contains('reveal-hidden') && !el.classList.contains('reveal-visible')) {
          el.classList.add('reveal-hidden');
          scrollObserver.observe(el);
        }
      });
    };
    
    setupScrollReveal();
    const revealObserver = new MutationObserver(setupScrollReveal);
    revealObserver.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleMouseClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleMouseClick);
      observerObj.disconnect();
      revealObserver.disconnect();
      scrollObserver.disconnect();
    };
  }, []);

  return (
    <div id="toast-container" className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" />
  );
}
