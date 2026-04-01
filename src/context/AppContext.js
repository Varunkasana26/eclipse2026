import React, { createContext, useContext, useState } from 'react';
import { computers as initialComputers, initialBookings, users, timeSlots } from '../data/dummyData';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user] = useState(users[0]);
  const [computers, setComputers] = useState(initialComputers);
  const [bookings, setBookings] = useState(initialBookings);
  const [currentDate, setCurrentDate] = useState('2026-04-01');

  const getBookingsForComputer = (computerId, date) => {
    return bookings.filter(b => b.computerId === computerId && b.date === date);
  };

  const getUserBookings = () => {
    if (!user) return [];
    return bookings.filter(b => b.userId === user.id);
  };

  const isSlotBooked = (computerId, date, timeSlot) => {
    return bookings.some(b => 
      b.computerId === computerId && 
      b.date === date && 
      b.timeSlot === timeSlot
    );
  };

  const bookSlot = (computerId, date, timeSlot) => {
    if (!user) return false;
    if (isSlotBooked(computerId, date, timeSlot)) return false;
    
    const newBooking = {
      id: bookings.length + 1,
      userId: user.id,
      computerId,
      date,
      timeSlot
    };
    setBookings([...bookings, newBooking]);
    
    setComputers(computers.map(c => 
      c.id === computerId ? { ...c, status: 'occupied' } : c
    ));
    
    return true;
  };

  const cancelBooking = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || booking.userId !== user?.id) return false;
    
    setBookings(bookings.filter(b => b.id !== bookingId));
    
    const hasOtherBookings = bookings.some(b => b.computerId === booking.computerId && b.id !== bookingId);
    if (!hasOtherBookings) {
      setComputers(computers.map(c => 
        c.id === booking.computerId ? { ...c, status: 'free' } : c
      ));
    }
    
    return true;
  };

  return (
    <AppContext.Provider value={{
      user,
      computers,
      bookings,
      timeSlots,
      currentDate,
      setCurrentDate,
      getBookingsForComputer,
      getUserBookings,
      isSlotBooked,
      bookSlot,
      cancelBooking
    }}>
      {children}
    </AppContext.Provider>
  );
};
