import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CalendarPage = ({ 
  sessions, 
  calendarView, 
  setCalendarView, 
  currentDate, 
  setCurrentDate, 
  setEditingSession, 
  setShowCardForm 
}) => {
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

  const getWeekDays = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getSessionsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split("T")[0];
    return sessions.filter((s) => s.date === dateStr);
  };

  const days =
    calendarView === "month"
      ? getDaysInMonth(currentDate)
      : getWeekDays(currentDate);
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">학습 캘린더</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setCalendarView("week")}
              className={`px-3 py-1 rounded ${calendarView === "week" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              주간
            </button>
            <button
              onClick={() => setCalendarView("month")}
              className={`px-3 py-1 rounded ${calendarView === "month" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              월간
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center font-semibold text-sm">
              {day}
            </div>
          ))}
        </div>

        <div
          className={`grid grid-cols-7 ${calendarView === "month" ? "auto-rows-min" : ""}`}
        >
          {days.map((date, index) => {
            const daysSessions = getSessionsForDate(date);
            const isToday =
              date && date.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`border-t border-r ${calendarView === "month" ? "min-h-[100px]" : "min-h-[150px]"} p-2 ${
                  !date ? "bg-gray-50" : ""
                } ${isToday ? "bg-blue-50" : ""}`}
              >
                {date && (
                  <>
                    <div
                      className={`text-sm mb-1 ${isToday ? "font-bold text-blue-600" : ""}`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {daysSessions
                        .slice(0, calendarView === "month" ? 2 : 4)
                        .map((session) => (
                          <div
                            key={session.id}
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${
                              session.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : session.status === "in-progress"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                            onClick={() => {
                              setEditingSession(session);
                              setShowCardForm(true);
                            }}
                          >
                            <div className="font-medium truncate">
                              {session.start}
                            </div>
                            <div className="truncate">{session.goal_pre}</div>
                          </div>
                        ))}
                      {daysSessions.length >
                        (calendarView === "month" ? 2 : 4) && (
                        <div className="text-xs text-gray-500 text-center">
                          +
                          {daysSessions.length -
                            (calendarView === "month" ? 2 : 4)}{" "}
                          more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;