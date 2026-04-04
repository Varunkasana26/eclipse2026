import React from 'react';
import { useApp } from '../context/AppContext';
import { Monitor, Calendar, Clock, Trash2, X, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyBookings = () => {
  const { getUserBookings, cancelBooking, computers, currentDate } = useApp();
  const navigate = useNavigate();
  const userBookings = getUserBookings();

  const getComputerName = (id) => {
    const comp = computers.find(c => c.id === id);
    return comp ? comp.name : `PC-${id}`;
  };

  const handleCancel = (bookingId) => {
    cancelBooking(bookingId);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">My Bookings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-4">
              <Monitor className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">No Bookings Yet</h2>
            <p className="text-slate-500 mt-2">You haven't booked any computers yet.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
            >
              Book a Computer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Monitor className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {getComputerName(booking.computerId)}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{booking.timeSlot}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Cancel Booking"
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
