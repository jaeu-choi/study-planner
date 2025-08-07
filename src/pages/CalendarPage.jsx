import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CalendarPage = ({
  sessions,
  calendarView,
  setCalendarView,
  currentDate,
  setCurrentDate,
  setEditingSession,
  setShowCardForm,
}) => {
  /* ---------- helpers ---------- */

  // 1) 한 달에 표시할 날짜(앞뒤 빈칸 포함)를 7의 배수로 맞춰 반환
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];

    // 앞부분 빈칸
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    // 실제 날짜
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    // 뒷부분 빈칸
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    return days;
  };

  // 2) 특정 날짜가 속한 주(일~토) 반환
  const getWeekDays = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // 일요일

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  // 3) 월 이동
  const navigateMonth = (dir) => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + dir);
    setCurrentDate(next);
  };

  // 4) 해당 날짜의 세션 목록
  const getSessionsForDate = (date) => {
    if (!date) return [];
    const key = date.toISOString().split("T")[0];
    return sessions.filter((s) => s.date === key);
  };

  /* ---------- 렌더용 데이터 ---------- */

  const days =
    calendarView === "month"
      ? getDaysInMonth(currentDate)
      : getWeekDays(currentDate);

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  /* ---------- JSX ---------- */

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-foreground">학습 캘린더</h1>

          <div className="flex gap-2">
            <Button
              variant={calendarView === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setCalendarView("week")}
            >
              주간
            </Button>
            <Button
              variant={calendarView === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setCalendarView("month")}
            >
              월간
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <h2 className="text-xl font-semibold text-foreground">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>

          <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 캘린더 */}
      <Card className="overflow-hidden">
        {/* 요일 라벨 */}
        <CardHeader className="p-0">
          <div className="grid grid-cols-7 bg-muted">
            {weekDays.map((d) => (
              <div
                key={d}
                className="p-3 text-center font-semibold text-sm text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
        </CardHeader>

        {/* 날짜 셀 */}
        <CardContent className="p-0">
          <div
            className={`grid grid-cols-7 ${calendarView === "month" ? "auto-rows-min" : ""}`}
          >
            {days.map((date, idx) => {
              const today = date
                ? date.toDateString() === new Date().toDateString()
                : false;
              const sessionsToday = getSessionsForDate(date);

              /* 셀 스타일 */
              const base =
                "border border-border min-h-[100px] p-2 transition-colors";
              const bg = !date
                ? "bg-muted/50"
                : today
                  ? "bg-primary/5"
                  : "bg-background";
              const hover =
                date && !today ? "hover:bg-muted/50 cursor-pointer" : "";

              return (
                <div key={idx} className={`${base} ${bg} ${hover}`}>
                  {date && (
                    <>
                      {/* 날짜 숫자 */}
                      <div
                        className={`text-sm mb-1 ${
                          today
                            ? "font-bold text-primary"
                            : date.getDay() === 0
                              ? "text-red-500 dark:text-red-400"
                              : "text-foreground"
                        }`}
                      >
                        {date.getDate()}
                      </div>

                      {/* 세션 배지 */}
                      <div className="space-y-1">
                        {sessionsToday
                          .slice(0, calendarView === "month" ? 2 : 4)
                          .map((s) => {
                            const variant =
                              s.status === "pending" ? "outline" : "secondary";
                            const color =
                              s.status === "completed"
                                ? "text-green-600 dark:text-green-400"
                                : s.status === "in-progress"
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-muted-foreground";

                            return (
                              <Badge
                                key={s.id}
                                variant={variant}
                                className={`text-xs p-1 w-full justify-start truncate ${color}`}
                                onClick={() => {
                                  setEditingSession(s);
                                  setShowCardForm(true);
                                }}
                              >
                                <div className="w-full">
                                  <div className="font-medium truncate">
                                    {s.start}
                                  </div>
                                  <div className="truncate text-xs opacity-75">
                                    {s.goal_pre}
                                  </div>
                                </div>
                              </Badge>
                            );
                          })}

                        {/* 더보기 표시 */}
                        {sessionsToday.length >
                          (calendarView === "month" ? 2 : 4) && (
                          <div className="text-xs text-muted-foreground text-center">
                            +
                            {sessionsToday.length -
                              (calendarView === "month" ? 2 : 4)}
                            개 더보기
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;
