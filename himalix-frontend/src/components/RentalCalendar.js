import React, { useState, useEffect } from 'react';
import './RentalCalendar.css';

const RentalCalendar = ({ availability = [], onRangeChange, readOnly }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Parse availability strings to Date objects
  const bookedRanges = availability.map(range => ({
    start: new Date(range.startDate),
    end: new Date(range.endDate)
  }));

  // Format date helper: YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  };

  // Helper to check if a date is booked
  const isDateBooked = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return bookedRanges.some(range => {
      const start = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate());
      const end = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate());
      return d >= start && d <= end;
    });
  };

  // Helper to check if there are any booked dates between two dates
  const hasBookedDatesBetween = (start, end) => {
    let curr = new Date(start.getTime());
    while (curr <= end) {
      if (isDateBooked(curr)) return true;
      curr.setDate(curr.getDate() + 1);
    }
    return false;
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateClick = (day) => {
    if (readOnly) return;
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // Prevent selecting past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return;

    if (isDateBooked(selectedDate)) return;

    if (!startDate || (startDate && endDate)) {
      setStartDate(selectedDate);
      setEndDate(null);
      if (onRangeChange) onRangeChange(null);
    } else if (startDate && !endDate) {
      if (selectedDate < startDate) {
        setStartDate(selectedDate);
      } else {
        // Check if there is any booked date in between
        if (hasBookedDatesBetween(startDate, selectedDate)) {
          setStartDate(selectedDate);
        } else {
          setEndDate(selectedDate);
          const diffTime = Math.abs(selectedDate - startDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive selection
          if (onRangeChange) {
            onRangeChange({
              startDate: formatDate(startDate),
              endDate: formatDate(selectedDate),
              days: diffDays
            });
          }
        }
      }
    }
  };

  const handlePrevMonth = () => {
    const now = new Date();
    if (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() === now.getMonth()) {
      return;
    }
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    onRangeChange(null);
  };

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty spaces before first day
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const thisDate = new Date(year, month, day);
      const isPast = thisDate < today;
      const isBooked = isDateBooked(thisDate);
      
      let dayClass = 'calendar-day';
      if (isPast) dayClass += ' disabled past';
      else if (isBooked) dayClass += ' disabled booked';
      
      const isStart = startDate && formatDate(thisDate) === formatDate(startDate);
      const isEnd = endDate && formatDate(thisDate) === formatDate(endDate);
      const isBetween = startDate && endDate && thisDate > startDate && thisDate < endDate;

      if (isStart) dayClass += ' range-start';
      if (isEnd) dayClass += ' range-end';
      if (isBetween) dayClass += ' range-between';

      days.push(
        <div
          key={`day-${day}`}
          className={dayClass}
          onClick={() => !isPast && !isBooked && handleDateClick(day)}
        >
          <span className="day-number">{day}</span>
          {isBooked && <span className="booked-strikethrough"></span>}
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="premium-calendar-container">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={handlePrevMonth}>
          &larr;
        </button>
        <h3 className="calendar-month-title">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button className="calendar-nav-btn" onClick={handleNextMonth}>
          &rarr;
        </button>
      </div>

      <div className="calendar-weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="calendar-days-grid">{renderDays()}</div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color available"></span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-color booked"></span>
          <span>Booked / Reserved</span>
        </div>
        <div className="legend-item">
          <span className="legend-color selected"></span>
          <span>Your Range</span>
        </div>
      </div>

      {(startDate || endDate) && (
        <div className="calendar-selection-summary">
          <div className="selection-details">
            {startDate && (
              <div>
                <strong>Start:</strong> {formatDate(startDate)}
              </div>
            )}
            {endDate && (
              <div>
                <strong>End:</strong> {formatDate(endDate)}
              </div>
            )}
          </div>
          <button className="calendar-clear-btn" onClick={handleClear}>
            Clear Range
          </button>
        </div>
      )}
    </div>
  );
};

export default RentalCalendar;
