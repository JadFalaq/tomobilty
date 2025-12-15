'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  minDate?: string;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate = new Date().toISOString().split('T')[0],
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const startPickerRef = useRef<HTMLDivElement>(null);
  const endPickerRef = useRef<HTMLDivElement>(null);

  // Fermer les calendriers en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (startPickerRef.current && !startPickerRef.current.contains(event.target as Node)) {
        setShowStartPicker(false);
      }
      if (endPickerRef.current && !endPickerRef.current.contains(event.target as Node)) {
        setShowEndPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDate = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const isDateInRange = (date: string, start: string, end: string | null, hovered: string | null) => {
    if (!start) return false;
    
    const dateObj = new Date(date);
    const startObj = new Date(start);
    
    // Si on a une date de fin, utiliser celle-ci
    if (end) {
      const endObj = new Date(end);
      return dateObj >= startObj && dateObj <= endObj;
    }
    
    // Sinon, utiliser la date survolée pour l'aperçu
    if (hovered && showEndPicker) {
      const hoveredObj = new Date(hovered);
      return dateObj >= startObj && dateObj <= hoveredObj;
    }
    
    return false;
  };

  const isDateDisabled = (date: string) => {
    if (minDate && date < minDate) return true;
    if (showEndPicker && startDate && date < startDate) return true;
    return false;
  };

  const handleDateClick = (date: string) => {
    if (isDateDisabled(date)) return;

    if (showStartPicker) {
      onStartDateChange(date);
      setShowStartPicker(false);
    } else if (showEndPicker) {
      onEndDateChange(date);
      setShowEndPicker(false);
    }
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const days = [];

    // Jours vides avant le début du mois
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);
      const isDisabled = isDateDisabled(dateStr);
      const isStart = dateStr === startDate;
      const isEnd = dateStr === endDate;
      const isInRange = isDateInRange(dateStr, startDate, endDate, hoveredDate);
      const isHovered = dateStr === hoveredDate;

      days.push(
        <button
          key={day}
          type="button"
          disabled={isDisabled}
          onClick={() => handleDateClick(dateStr)}
          onMouseEnter={() => !isDisabled && setHoveredDate(dateStr)}
          onMouseLeave={() => setHoveredDate(null)}
          className={`
            h-10 w-full rounded-lg text-sm font-medium transition-all
            ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-primary-100 cursor-pointer'}
            ${isStart || isEnd ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}
            ${isInRange && !isStart && !isEnd ? 'bg-primary-100 text-primary-800' : ''}
            ${!isStart && !isEnd && !isInRange && !isDisabled ? 'text-gray-700' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="space-y-4">
      {/* Date de début */}
      <div className="relative" ref={startPickerRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date de début
        </label>
        <input
          type="text"
          readOnly
          value={startDate ? new Date(startDate).toLocaleDateString('fr-FR') : ''}
          onClick={() => {
            setShowStartPicker(!showStartPicker);
            setShowEndPicker(false);
          }}
          placeholder="Sélectionner la date de début"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer text-black"
        />
        
        {showStartPicker && (
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-semibold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                <div key={day} className="h-10 flex items-center justify-center text-xs font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </div>
        )}
      </div>

      {/* Date de fin */}
      <div className="relative" ref={endPickerRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date de fin
        </label>
        <input
          type="text"
          readOnly
          value={endDate ? new Date(endDate).toLocaleDateString('fr-FR') : ''}
          onClick={() => {
            setShowEndPicker(!showEndPicker);
            setShowStartPicker(false);
          }}
          placeholder="Sélectionner la date de fin"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer text-black"
        />
        
        {showEndPicker && (
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-semibold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                <div key={day} className="h-10 flex items-center justify-center text-xs font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>

            {startDate && hoveredDate && (
              <div className="mt-3 pt-3 border-t text-sm text-gray-600 text-center">
                Aperçu: {new Date(startDate).toLocaleDateString('fr-FR')} → {new Date(hoveredDate).toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
