import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, CheckCircle, Clock, Cpu, Gauge, Server, X } from 'lucide-react';
import { AnimatePresence, MotionConfig, animate, motion, useReducedMotion } from 'framer-motion';

const easeOutCubic = [0.22, 1, 0.36, 1];

const enterStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const enterItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: easeOutCubic },
  },
};

const AnimatedCounter = ({ value, suffix = '', className = '' }) => {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      prevValue.current = value;
      return;
    }

    const controls = animate(prevValue.current, value, {
      duration: 0.7,
      ease: easeOutCubic,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    prevValue.current = value;

    return () => controls.stop();
  }, [reduceMotion, value]);

  return (
    <p className={className}>
      {display}
      {suffix}
    </p>
  );
};

const Dashboard = () => {
  const { computers, timeSlots, currentDate, setCurrentDate, isSlotBooked, bookSlot } = useApp();
  const [selectedComputer, setSelectedComputer] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const stats = useMemo(() => {
    const total = computers.length;
    const free = computers.filter((c) => c.status === 'free').length;
    const occupied = total - free;
    const utilization = total ? Math.round((occupied / total) * 100) : 0;
    return { total, free, occupied, utilization };
  }, [computers]);

  const handleBookSlot = () => {
    if (!selectedComputer || !selectedSlot) return;
    const success = bookSlot(selectedComputer.id, currentDate, selectedSlot);

    if (success) {
      setBookingError('');
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedComputer(null);
        setSelectedSlot(null);
      }, 1400);
      return;
    }

    setBookingError('This GPU slot is already allocated. Please choose another slot.');
  };

  const isSlotDisabled = (computerId, slot) => {
    return isSlotBooked(computerId, currentDate, slot);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="gpu-animated-bg min-h-screen text-slate-100 relative isolate overflow-hidden">
        <motion.main
          initial="hidden"
          animate="visible"
          variants={enterStagger}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10"
        >
          <motion.section
            variants={enterItem}
            layout
            className="bg-gradient-to-r from-slate-900/95 via-slate-900/95 to-cyan-950/95 border border-slate-800 rounded-2xl p-6 sm:p-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <p className="text-cyan-300 text-sm font-semibold tracking-wide uppercase">GPU Cluster</p>
                <h1 className="text-2xl sm:text-3xl font-bold mt-2">GPU Allocation Console</h1>
                <p className="text-slate-300 mt-3 max-w-2xl">
                  Reserve available GPU nodes for training, inference, and lab workloads.
                </p>
              </div>
              <motion.div layout className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3 w-fit">
                <Calendar className="w-4 h-4 text-cyan-300" />
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="bg-transparent text-slate-100 text-sm border-none focus:outline-none"
                />
              </motion.div>
            </div>
          </motion.section>

          <motion.section variants={enterItem} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div layout className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400 text-sm">Total Nodes</p>
              <AnimatedCounter value={stats.total} className="text-2xl font-bold mt-2" />
            </motion.div>
            <motion.div layout className="bg-slate-900 border border-emerald-900 rounded-xl p-4">
              <p className="text-emerald-300 text-sm">Available</p>
              <AnimatedCounter value={stats.free} className="text-2xl font-bold mt-2 text-emerald-300" />
            </motion.div>
            <motion.div layout className="bg-slate-900 border border-rose-900 rounded-xl p-4">
              <p className="text-rose-300 text-sm">Allocated</p>
              <AnimatedCounter value={stats.occupied} className="text-2xl font-bold mt-2 text-rose-300" />
            </motion.div>
            <motion.div layout className="bg-slate-900 border border-cyan-900 rounded-xl p-4">
              <p className="text-cyan-300 text-sm">Utilization</p>
              <AnimatedCounter value={stats.utilization} suffix="%" className="text-2xl font-bold mt-2 text-cyan-300" />
            </motion.div>
          </motion.section>

          <motion.section variants={enterItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence initial={false}>
              {computers.map((computer, index) => {
                const available = computer.status === 'free';
                const active = selectedComputer?.id === computer.id;

                return (
                  <motion.button
                    key={computer.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: index * 0.02, ease: easeOutCubic } }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSelectedComputer(computer);
                      setSelectedSlot(null);
                      setBookingError('');
                    }}
                    className={`text-left rounded-2xl border p-5 transition ${
                      available ? 'bg-slate-900 border-slate-700 hover:border-cyan-500' : 'bg-slate-900 border-slate-800 hover:border-rose-500'
                    } ${active ? 'border-cyan-400 shadow-[0_0_0_1px_rgba(56,189,248,0.5),0_0_30px_rgba(34,211,238,0.22)]' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                        <Server className={`w-5 h-5 ${available ? 'text-cyan-300' : 'text-rose-300'}`} />
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          available ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {available ? 'Available' : 'Allocated'}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{computer.name}</h3>
                    <p className="mt-2 text-sm text-slate-400">{computer.specs}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                      <Cpu className="w-4 h-4" />
                      <span>Click to view allocation slots</span>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.section>
        </motion.main>

        <AnimatePresence>
          {selectedComputer && (
            <motion.div
              key="gpu-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                layoutId={`gpu-card-${selectedComputer.id}`}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.34, ease: easeOutCubic } }}
                exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.2 } }}
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden"
              >
                <div className="p-5 border-b border-slate-800 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">{selectedComputer.name}</h2>
                    <p className="text-sm text-slate-400 mt-1">{selectedComputer.specs}</p>
                  </div>
                  <button
                    onClick={() => setSelectedComputer(null)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <motion.div layout className="p-5">
                  <div className="flex items-center gap-2 mb-4 text-slate-300">
                    <Clock className="w-4 h-4 text-cyan-300" />
                    <span className="text-sm font-medium">Select Allocation Window</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {timeSlots.map((slot) => {
                      const disabled = isSlotDisabled(selectedComputer.id, slot);
                      return (
                        <motion.button
                          layout
                          key={slot}
                          disabled={disabled}
                          onClick={() => !disabled && setSelectedSlot(slot)}
                          className={`py-2 px-2 rounded-lg text-sm font-medium transition ${
                            selectedSlot === slot
                              ? 'bg-cyan-500 text-slate-950'
                              : disabled
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                          }`}
                        >
                          {slot}
                        </motion.button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="popLayout">
                    {bookingError && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-4 text-sm bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-lg p-3"
                      >
                        {bookingError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {selectedSlot && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={handleBookSlot}
                        className="w-full mt-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg transition"
                      >
                        Allocate {selectedComputer.name} at {selectedSlot}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {bookingSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 flex flex-col items-center"
              >
                <CheckCircle className="w-14 h-14 text-emerald-400 mb-4" />
                <p className="text-xl font-semibold text-slate-100">GPU Allocation Confirmed</p>
                <p className="text-slate-400 mt-2">Provisioning your slot...</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-cyan-300">
                  <Gauge className="w-4 h-4" />
                  <span>Queue priority updated</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};

export default Dashboard;
