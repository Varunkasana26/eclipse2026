import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Monitor, Calendar, Clock, X, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const { computers, timeSlots, currentDate, setCurrentDate, isSlotBooked, bookSlot } = useApp();
  const [selectedComputer, setSelectedComputer] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBookSlot = () => {
    if (!selectedComputer || !selectedSlot) return;
    const success = bookSlot(selectedComputer.id, currentDate, selectedSlot);
    if (success) {
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedComputer(null);
        setSelectedSlot(null);
      }, 1500);
    }
  };

  const isSlotDisabled = (computerId, slot) => {
    return isSlotBooked(computerId, currentDate, slot);
  };

  const freeCount = computers.filter(c => c.status === 'free').length;
  const occupiedCount = computers.filter(c => c.status === 'occupied').length;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-xl">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Computer Lab Booking</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span>{user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-600">Free: {freeCount}</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-600">Occupied: {occupiedCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="text-sm text-slate-600 border-none focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {computers.map((computer) => (
            <button
              key={computer.id}
              onClick={() => {
                setSelectedComputer(computer);
                setSelectedSlot(null);
              }}
              className={`p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                computer.status === 'free'
                  ? 'bg-white hover:shadow-lg border-2 border-green-200 hover:border-green-400'
                  : 'bg-white hover:shadow-lg border-2 border-red-200 hover:border-red-400'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`p-3 rounded-xl ${
                  computer.status === 'free' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Monitor className={`w-6 h-6 ${
                    computer.status === 'free' ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-800">{computer.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{computer.specs}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  computer.status === 'free' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {computer.status === 'free' ? 'Free' : 'Occupied'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </main>

      {selectedComputer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedComputer.name}</h2>
                  <p className="text-sm text-slate-500">{selectedComputer.specs}</p>
                </div>
                <button
                  onClick={() => setSelectedComputer(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">Select Time Slot</span>
              </div>

              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {timeSlots.map((slot) => {
                  const disabled = isSlotDisabled(selectedComputer.id, slot);
                  return (
                    <button
                      key={slot}
                      disabled={disabled}
                      onClick={() => !disabled && setSelectedSlot(slot)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                        selectedSlot === slot
                          ? 'bg-blue-500 text-white'
                          : disabled
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              {selectedSlot && (
                <button
                  onClick={handleBookSlot}
                  className="w-full mt-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Book {selectedComputer.name} at {selectedSlot}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {bookingSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <p className="text-xl font-semibold text-slate-800">Booking Confirmed!</p>
            <p className="text-slate-500 mt-2">Redirecting...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
