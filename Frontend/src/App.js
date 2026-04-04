import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Dashboard from './components/Dashboard';
import MyBookings from './components/MyBookings';

const Navigation = () => {
  const { user, getUserBookings } = useApp();
  const navigate = useNavigate();
  const bookingCount = getUserBookings().length;

  return (
    <nav className="bg-slate-950/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-300 hover:text-white font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/bookings')}
              className="text-slate-300 hover:text-white font-semibold transition-colors relative px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              My Allocations
              {bookingCount > 0 && (
                <span className="absolute top-1 -right-1 bg-cyan-500 text-slate-950 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {bookingCount}
                </span>
              )}
            </button>
          </div>
          <div className="text-xs sm:text-sm text-slate-300 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700">
            Operator: <span className="font-semibold text-white">{user?.name}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

const AppContent = () => {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
