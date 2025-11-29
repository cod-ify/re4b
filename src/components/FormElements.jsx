import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// --- Helper Hook for Clicking Outside ---
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// --- Components ---

export const Input = ({ label, icon, className = "", type = "text", ...props }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>}
    <div className="relative group">
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
          {icon}
        </span>
      )}
      <input 
        type={type}
        className={`w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium 
          focus:ring-4 focus:ring-blue-50 focus:border-blue-400 focus:bg-white outline-none transition-all placeholder:text-slate-400
          dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:focus:bg-slate-800 dark:focus:ring-blue-900/30 
          ${icon ? 'pl-10' : ''} 
          ${type === 'number' ? 'font-numbers' : ''}
        `}
        {...props}
      />
    </div>
  </div>
);

export const Select = ({ label, options, value, onChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();

  useOnClickOutside(ref, () => setIsOpen(false));

  const handleSelect = (option) => {
    const syntheticEvent = { target: { value: option } };
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={ref}>
      {label && <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all duration-200 outline-none
            ${isOpen 
              ? 'border-blue-400 ring-4 ring-blue-50 bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100 dark:ring-blue-900/30' 
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
        >
          <span className="truncate">{value || "Select..."}</span>
          <ChevronDown 
            size={16} 
            className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} 
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
              {options.map((option) => {
                const isSelected = option === value;
                return (
                  <div
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors
                      ${isSelected 
                        ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    <span>{option}</span>
                    {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const DatePicker = ({ label, value, onChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); 
  
  // States for internal custom dropdowns
  const [showMonthList, setShowMonthList] = useState(false);
  const [showYearList, setShowYearList] = useState(false);

  const ref = useRef();

  useOnClickOutside(ref, () => {
    setIsOpen(false);
    setShowMonthList(false);
    setShowYearList(false);
  });

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      setViewDate(new Date(y, m - 1, d));
    }
  }, [value, isOpen]);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleDaySelect = (day) => {
    const month = viewDate.getMonth() + 1; 
    const year = viewDate.getFullYear();
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    onChange({ target: { value: formattedDate } });
    setIsOpen(false);
  };

  const changeMonth = (offset) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const handleMonthSelect = (monthIndex) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
    setShowMonthList(false);
  };

  const handleYearSelect = (year) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setShowYearList(false);
  };

  const renderCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      let isSelected = false;
      if (value) {
        const [vy, vm, vd] = value.split('-').map(Number);
        isSelected = vy === year && vm === (month + 1) && vd === d;
      }

      const today = new Date();
      const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;

      days.push(
        <button
          key={d}
          type="button"
          onClick={() => handleDaySelect(d)}
          className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all
            ${isSelected 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
              : isToday 
                ? 'text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 20}, (_, i) => currentYear - 10 + i);

  return (
    <div className={`space-y-1.5 ${className}`} ref={ref}>
      {label && <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all duration-200 outline-none
            ${isOpen 
              ? 'border-blue-400 ring-4 ring-blue-50 bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100 dark:ring-blue-900/30' 
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span>{value || "dd/mm/yyyy"}</span>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-visible animate-in fade-in zoom-in-95 duration-100 origin-top min-w-[280px]">
            
            {/* Header with Custom Dropdowns */}
            <div className="flex justify-between items-center mb-4 gap-2 relative">
              <div className="flex gap-1 items-center relative z-10">
                
                {/* Month Selector */}
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => { setShowMonthList(!showMonthList); setShowYearList(false); }}
                    className="flex items-center gap-1 font-bold text-slate-900 dark:text-white text-sm hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors"
                  >
                    {monthNames[viewDate.getMonth()]} <ChevronDown size={14} className="text-slate-400" />
                  </button>
                  
                  {/* Custom Month Dropdown */}
                  {showMonthList && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto w-32 custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                      {monthNames.map((m, i) => (
                        <div 
                          key={m} 
                          onClick={() => handleMonthSelect(i)}
                          className={`px-3 py-2 text-sm cursor-pointer transition-colors ${viewDate.getMonth() === i ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          {m}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Year Selector */}
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => { setShowYearList(!showYearList); setShowMonthList(false); }}
                    className="flex items-center gap-1 font-bold text-slate-900 dark:text-white text-sm hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors"
                  >
                    {viewDate.getFullYear()} <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  {/* Custom Year Dropdown */}
                  {showYearList && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto w-24 custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                      {years.map((y) => (
                        <div 
                          key={y} 
                          onClick={() => handleYearSelect(y)}
                          className={`px-3 py-2 text-sm cursor-pointer transition-colors ${viewDate.getFullYear() === y ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          {y}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-1">
                <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid (Z-Index lower than dropdowns) */}
            <div className="grid grid-cols-7 gap-1 relative z-0">
              {renderCalendarDays()}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
               <button type="button" onClick={() => { onChange({ target: { value: '' } }); setIsOpen(false); }} className="text-xs text-slate-400 hover:text-red-500">Clear</button>
               <button type="button" onClick={() => { 
                 const today = new Date();
                 const formatted = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}`;
                 onChange({ target: { value: formatted } });
                 setIsOpen(false);
               }} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Today</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const TextArea = ({ label, className = "", ...props }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>}
    <textarea 
      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:ring-4 focus:ring-blue-50 focus:border-blue-400 focus:bg-white outline-none transition-all resize-none min-h-[100px]
      dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:focus:bg-slate-800 dark:focus:ring-blue-900/30"
      {...props}
    />
  </div>
);