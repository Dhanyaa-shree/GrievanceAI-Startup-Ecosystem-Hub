import React, { useState, useEffect } from 'react';

const CalendarWidget = ({
  selectedDate,
  onDateSelect,
  minDate = null,
  maxDate = null,
  availableDates = null, // Array of date strings that are available
  disabledDates = null, // Array of date strings that are disabled
  highlightWeekends = false,
  showMonthNav = true,
  customClass = '',
  monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  dateFormat = 'YYYY-MM-DD'
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // Initialize selected day from prop
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      setSelectedDay(date.getDate());
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [selectedDate]);

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Check if date is today
  const isToday = (year, month, day) => {
    const today = new Date();
    return year === today.getFullYear() && 
           month === today.getMonth() && 
           day === today.getDate();
  };

  // Check if date is in the past
  const isPastDate = (year, month, day) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if date is in the future beyond maxDate
  const isBeyondMaxDate = (year, month, day) => {
    if (!maxDate) return false;
    const date = new Date(year, month, day);
    const max = new Date(maxDate);
    max.setHours(0, 0, 0, 0);
    return date > max;
  };

  // Check if date is before minDate
  const isBeforeMinDate = (year, month, day) => {
    if (!minDate) return false;
    const date = new Date(year, month, day);
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    return date < min;
  };

  // Check if date is available (if availableDates provided)
  const isDateAvailable = (year, month, day) => {
    if (availableDates && availableDates.length > 0) {
      const dateStr = formatDate(year, month, day);
      return availableDates.includes(dateStr);
    }
    return true;
  };

  // Check if date is disabled (if disabledDates provided)
  const isDateDisabled = (year, month, day) => {
    if (disabledDates && disabledDates.length > 0) {
      const dateStr = formatDate(year, month, day);
      return disabledDates.includes(dateStr);
    }
    return false;
  };

  // Check if date is weekend (Saturday or Sunday)
  const isWeekend = (year, month, day) => {
    const date = new Date(year, month, day);
    return date.getDay() === 0 || date.getDay() === 6;
  };

  // Format date to string
  const formatDate = (year, month, day) => {
    const date = new Date(year, month, day);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    
    switch (dateFormat) {
      case 'YYYY-MM-DD':
        return `${y}-${m}-${d}`;
      case 'DD-MM-YYYY':
        return `${d}-${m}-${y}`;
      case 'MM/DD/YYYY':
        return `${m}/${d}/${y}`;
      case 'DD/MM/YYYY':
        return `${d}/${m}/${y}`;
      default:
        return `${y}-${m}-${d}`;
    }
  };

  // Handle date click
  const handleDateClick = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Check if date is selectable
    if (isPastDate(year, month, day)) return;
    if (isBeforeMinDate(year, month, day)) return;
    if (isBeyondMaxDate(year, month, day)) return;
    if (isDateDisabled(year, month, day)) return;
    if (!isDateAvailable(year, month, day)) return;
    
    // If weekends should be disabled
    if (!highlightWeekends && isWeekend(year, month, day)) return;

    const dateStr = formatDate(year, month, day);
    setSelectedDay(day);
    if (onDateSelect) {
      onDateSelect(dateStr);
    }
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDay(null);
    if (onDateSelect) {
      onDateSelect(null);
    }
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDay(null);
    if (onDateSelect) {
      onDateSelect(null);
    }
  };

  // Go to today
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    const dateStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
    setSelectedDay(today.getDate());
    if (onDateSelect) {
      onDateSelect(dateStr);
    }
  };

  // Get date status for styling
  const getDateStatus = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const isPast = isPastDate(year, month, day);
    const isBeforeMin = isBeforeMinDate(year, month, day);
    const isBeyondMax = isBeyondMaxDate(year, month, day);
    const isDisabled = isDateDisabled(year, month, day);
    const isAvail = isDateAvailable(year, month, day);
    const isWeekendDay = isWeekend(year, month, day);
    const isTodayDay = isToday(year, month, day);
    const isSelected = selectedDay === day && selectedDate === formatDate(year, month, day);

    let status = 'available';
    
    if (isSelected) status = 'selected';
    else if (isTodayDay) status = 'today';
    else if (isPast || isBeforeMin || isBeyondMax || isDisabled) status = 'disabled';
    else if (!isAvail) status = 'unavailable';
    else if (isWeekendDay && !highlightWeekends) status = 'weekend';
    
    return status;
  };

  // Render calendar
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    
    // Empty cells for days before month start
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-empty-cell"></div>
      );
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const status = getDateStatus(day);
      const isClickable = status === 'available' || status === 'today';
      
      days.push(
        <div
          key={day}
          className={`calendar-day-cell ${status} ${isClickable ? 'clickable' : ''}`}
          onClick={() => isClickable && handleDateClick(day)}
        >
          <span className="day-number">{day}</span>
          {status === 'today' && <span className="today-indicator">●</span>}
        </div>
      );
    }
    
    return days;
  };

  // Check if can go to previous month (not before minDate month)
  const canGoPrevious = () => {
    if (!minDate) return true;
    const current = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const min = new Date(minDate);
    min.setDate(1);
    return current > min;
  };

  // Check if can go to next month (not after maxDate month)
  const canGoNext = () => {
    if (!maxDate) return true;
    const current = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const max = new Date(maxDate);
    max.setDate(1);
    return current < max;
  };

  return (
    <div className={`calendar-widget ${customClass}`}>
      {/* Header */}
      <div className="calendar-widget-header">
        <div className="calendar-month-nav">
          {showMonthNav && (
            <button 
              className="nav-btn prev"
              onClick={goToPreviousMonth}
              disabled={!canGoPrevious()}
            >
              ‹
            </button>
          )}
          <span className="calendar-month-label">
            {monthLabels[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          {showMonthNav && (
            <button 
              className="nav-btn next"
              onClick={goToNextMonth}
              disabled={!canGoNext()}
            >
              ›
            </button>
          )}
        </div>
        <button className="today-btn" onClick={goToToday}>
          Today
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="calendar-weekdays">
        {dayLabels.map((day) => (
          <span key={day} className="weekday-label">{day}</span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {renderCalendar()}
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot available"></span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot selected"></span>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot today"></span>
          <span>Today</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot unavailable"></span>
          <span>Unavailable</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot disabled"></span>
          <span>Disabled</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;

