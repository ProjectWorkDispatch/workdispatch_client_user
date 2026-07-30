import { useMemo, useState } from "react";
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Modal } from "./Modal";
import { Button } from "./Button";

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MIN_HOURS_AHEAD = 12;

function getMinDate() {
  const d = new Date(Date.now() + MIN_HOURS_AHEAD * 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const DateTimePickerModal = ({ open, onClose, onConfirm, title = "Seleccionar fecha y hora", initialDate, mode = "datetime" }) => {
  const minDate = useMemo(() => getMinDate(), []);

  const initDate = initialDate ? new Date(initialDate) : minDate;
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  const [selectedDate, setSelectedDate] = useState(() => (initDate >= minDate ? initDate : minDate));
  const [selectedHour, setSelectedHour] = useState(initDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(Math.ceil(initDate.getMinutes() / 5) * 5);
  const [error, setError] = useState("");

  const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const isDayDisabled = (day) => {
    if (mode === "date") return false;
    const d = new Date(viewYear, viewMonth, day, 23, 59, 59, 999);
    return d.getTime() < minDate.getTime();
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const handleSelectDay = (day) => {
    if (isDayDisabled(day)) return;
    const d = new Date(viewYear, viewMonth, day);
    if (mode === "date") {
      d.setHours(12, 0, 0, 0);
      setSelectedDate(d);
      setError("");
      return;
    }
    d.setHours(selectedHour, selectedMinute, 0, 0);
    if (d < minDate) {
      d.setHours(minDate.getHours(), minDate.getMinutes(), 0, 0);
      setSelectedHour(d.getHours());
      setSelectedMinute(d.getMinutes());
    }
    setSelectedDate(d);
    setError("");
  };

  const adjustHour = (delta) => {
    let h = selectedHour + delta;
    if (h > 23) h = 0;
    if (h < 0) h = 23;
    setSelectedHour(h);
    const d = new Date(selectedDate);
    d.setHours(h, selectedMinute, 0, 0);
    if (d < minDate) { const nd = new Date(minDate); setSelectedHour(nd.getHours()); setSelectedMinute(nd.getMinutes()); setSelectedDate(nd); return; }
    setSelectedDate(d);
    setError("");
  };

  const adjustMinute = (delta) => {
    let m = selectedMinute + delta * 5;
    if (m > 55) m = 0;
    if (m < 0) m = 55;
    setSelectedMinute(m);
    const d = new Date(selectedDate);
    d.setHours(selectedHour, m, 0, 0);
    if (d < minDate) { const nd = new Date(minDate); setSelectedHour(nd.getHours()); setSelectedMinute(nd.getMinutes()); setSelectedDate(nd); return; }
    setSelectedDate(d);
    setError("");
  };

  const handleConfirm = () => {
    if (mode === "date") {
      const final = new Date(selectedDate);
      final.setHours(12, 0, 0, 0);
      setError("");
      onConfirm(final.toISOString());
      return;
    }
    const final = new Date(selectedDate);
    final.setHours(selectedHour, selectedMinute, 0, 0);
    if (final.getTime() < minDate.getTime()) {
      setError(`La entrevista debe ser al menos ${MIN_HOURS_AHEAD} horas después de ahora.`);
      return;
    }
    setError("");
    onConfirm(final.toISOString());
  };

  const currentMonthStart = new Date(viewYear, viewMonth, 1);
  const minMonthStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const canGoPrev = currentMonthStart.getTime() > minMonthStart.getTime();

  const selDay = selectedDate.getDate();
  const selMonth = selectedDate.getMonth();
  const selYear = selectedDate.getFullYear();
  const formattedDate = `${selDay} de ${MONTHS[selMonth]} de ${selYear}`;
  const formattedTime = `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-1">
          <button type="button" onClick={handlePrevMonth} disabled={!canGoPrev} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeftIcon className="size-5 text-gray-900 dark:text-gray-100" />
          </button>
          <span className="text-base font-bold text-gray-900 dark:text-gray-100">{MONTHS[viewMonth]} {viewYear}</span>
          <button type="button" onClick={handleNextMonth} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronRightIcon className="size-5 text-gray-900 dark:text-gray-100" />
          </button>
        </div>

        <div className="grid grid-cols-7">
          {DAYS_OF_WEEK.map((d) => (
            <span key={d} className="text-center text-[11px] font-bold text-gray-400 dark:text-gray-500 py-1">{d}</span>
          ))}
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const disabled = isDayDisabled(day);
            const isToday = isSameDay(new Date(), new Date(viewYear, viewMonth, day));
            const isSelected = day === selDay && viewMonth === selMonth && viewYear === selYear;
            return (
              <button key={`d-${day}`} type="button" disabled={disabled} onClick={() => handleSelectDay(day)}
                className={`aspect-[1.2] flex items-center justify-center text-sm rounded-lg transition
                  ${isSelected ? "bg-yellow-400 font-bold text-gray-900" : isToday ? "border border-yellow-400 font-semibold text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}
                  ${disabled ? "text-gray-300 dark:text-gray-600 cursor-not-allowed hover:bg-transparent" : "cursor-pointer"}
                `}
              >{day}</button>
            );
          })}
        </div>

        <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
          {mode === "date" ? formattedDate : `${formattedDate} - ${formattedTime}`}
        </p>

        {mode !== "date" && (
          <div className="flex items-center justify-center gap-1">
            <div className="flex flex-col items-center">
              <button type="button" onClick={() => adjustHour(1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <ChevronUpIcon className="size-4 text-gray-700 dark:text-gray-300" />
              </button>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-5 py-2 min-w-[60px] text-center">
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{String(selectedHour).padStart(2, "0")}</span>
              </div>
              <button type="button" onClick={() => adjustHour(-1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <ChevronDownIcon className="size-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-[-8px]">:</span>
            <div className="flex flex-col items-center">
              <button type="button" onClick={() => adjustMinute(1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <ChevronUpIcon className="size-4 text-gray-700 dark:text-gray-300" />
              </button>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-5 py-2 min-w-[60px] text-center">
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{String(selectedMinute).padStart(2, "0")}</span>
              </div>
              <button type="button" onClick={() => adjustMinute(-1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <ChevronDownIcon className="size-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-600 text-center">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm}>Confirmar</Button>
        </div>
      </div>
    </Modal>
  );
};
