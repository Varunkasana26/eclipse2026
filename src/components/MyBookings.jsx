import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, ChevronLeft, Clock, Server, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyBookings = () => {
  const { getUserBookings, cancelBooking, computers } = useApp();
  const navigate = useNavigate();
  const userBookings = getUserBookings();

  const getComputerName = (id) => {
    const comp = computers.find((c) => c.id === id);
    return comp ? comp.name : `GPU-NODE-${id}`;
  };

  const handleCancel = (bookingId) => {
    cancelBooking(bookingId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold">My GPU Allocations</h1>
              <p className="text-sm text-slate-400">Manage active and upcoming reservation slots</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userBookings.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-2xl mb-4">
              <Server className="w-8 h-8 text-cyan-300" />
            </div>
            <h2 className="text-xl font-semibold">No Allocations Yet</h2>
            <p className="text-slate-400 mt-2">You have not allocated a GPU node yet.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg transition-colors"
            >
              Allocate a GPU
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                      <Server className="w-5 h-5 text-cyan-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{getComputerName(booking.computerId)}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{booking.timeSlot}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="p-2 text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Cancel Allocation"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyBookings;
