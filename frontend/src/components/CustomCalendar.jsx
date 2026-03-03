import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft as ChevronLeft, FaChevronRight as ChevronRight } from 'react-icons/fa';

const CustomCalendar = ({ value, onChange, onClose, minDate, rangeStart, rangeEnd }) => {
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );
  const [hoveredDate, setHoveredDate] = useState(null);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const days = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (date) => {
    if (!date) return;
    
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      const selected = new Date(date);
      selected.setHours(0, 0, 0, 0);
      if (selected < min) return;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    onChange(formattedDate);
    onClose();
  };

  const isSelected = (date) => {
    if (!date || !value) return false;
    const selected = new Date(value);
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const isDisabled = (date) => {
    if (!date) return false;
    
    const check = new Date(date);
    check.setHours(0, 0, 0, 0);
    
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      return check < min;
    }
    
    return false;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isInRange = (date) => {
    if (!date || !rangeStart) return false;

    const start = new Date(rangeStart);
    start.setHours(0, 0, 0, 0);

    const endSource = hoveredDate || rangeEnd;
    if (!endSource) return false;

    const end = new Date(endSource);
    end.setHours(0, 0, 0, 0);

    if (end < start) return false;

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    return d >= start && d <= end;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="absolute top-full left-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl z-[9999] min-w-[320px]"
    >
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ChevronLeft size={16} className="text-white" />
        </button>
        <h3 className="text-white font-black uppercase text-sm tracking-wider">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ChevronRight size={16} className="text-white" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-black uppercase text-white/40 tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          const selected = isSelected(date);
          const disabled = isDisabled(date);
          const today = isToday(date);
          const inRange = isInRange(date);

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              onMouseEnter={() => {
                if (!date || disabled || !rangeStart) return;
                setHoveredDate(date);
              }}
              onMouseLeave={() => {
                setHoveredDate(null);
              }}
              disabled={!date || disabled}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all
                ${!date ? 'invisible' : ''}
                ${disabled ? 'text-white/20 cursor-not-allowed' : 'text-white hover:bg-white/10'}
                ${inRange && !selected ? 'bg-[#ff003c]/40 text-white' : ''}
                ${selected ? 'bg-[#ff003c] text-white shadow-lg' : ''}
                ${today && !selected ? 'border border-[#ff003c]' : ''}
              `}
            >
              {date ? date.getDate() : ''}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
        <button
          onClick={onClose}
          className="text-xs font-black uppercase text-white/60 hover:text-white transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={() => {
            const today = new Date();
            handleDateClick(today);
          }}
          className="text-xs font-black uppercase text-[#ff003c] hover:text-white transition-colors"
        >
          Aujourd'hui
        </button>
      </div>
    </motion.div>
  );
};

export default CustomCalendar;
