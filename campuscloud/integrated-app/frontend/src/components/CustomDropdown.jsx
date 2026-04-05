import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomDropdown({ value, onChange, options, disabled, id }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  return (
    <div className="relative w-full" ref={containerRef} id={id}>
      <style>{`
        @keyframes dropdownOpen {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes staggerFadeIn {
          from { opacity: 0; transform: translateX(-5px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 255, 0.6);
        }
      `}</style>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-slate-100 outline-none backdrop-blur-md transition-all duration-300 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:border-cyan-400/40 disabled:opacity-50"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : 'Select...'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 w-full" style={{ animation: 'dropdownOpen 200ms ease-out forwards' }}>
          <div className="max-h-60 overflow-y-auto rounded-xl bg-[#020617] border border-white/10 backdrop-blur-xl custom-scrollbar p-1 shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
            {options.map((opt, index) => (
              <button
                key={opt.value}
                type="button"
                className="w-full text-left px-4 py-2 text-sm text-slate-200 rounded-lg transition-all duration-200 hover:bg-white/10 hover:shadow-[0_0_10px_rgba(0,255,255,0.1)] hover:text-white"
                style={{ animation: `staggerFadeIn 200ms ease-out forwards`, animationDelay: `${index * 30}ms`, opacity: 0 }}
                onClick={() => {
                  onChange({ target: { value: opt.value } });
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
