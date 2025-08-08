import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTime } from "@/contexts/TimeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SessionDetailModal from "@/components/SessionDetailModal";
import { migrateReviewSchedule } from "@/utils/reviewScheduler";

const CalendarPage = ({
  sessions,
  calendarView,
  setCalendarView,
  currentDate,
  setCurrentDate,
  setEditingSession,
  setShowCardForm,
  loadDateSessions,
}) => {
  const { isToday, getCurrentDateString } = useTime();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateSessions, setSelectedDateSessions] = useState([]);
  const [reviewSessions, setReviewSessions] = useState([]);
  const [allSessionsData, setAllSessionsData] = useState({}); // 모든 날짜의 세션 데이터 캐시
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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

  // 4) 해당 날짜의 세션 목록 (완료/진행중만)
  const getSessionsForDate = (date) => {
    if (!date) return [];
    // 시간대 문제를 피하기 위해 로컬 날짜 사용
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    const dateSessions = allSessionsData[key] || [];
    return dateSessions.filter((s) => s.status === 'completed' || s.status === 'in-progress');
  };

  // 5) 해당 날짜가 복습 예정일인 세션들 찾기
  const getReviewSessionsForDate = (date) => {
    if (!date) return [];
    // 시간대 문제를 피하기 위해 로컬 날짜 사용
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    const allSessions = Object.values(allSessionsData).flat();
    
    console.log(`${key} 날짜의 복습 세션 검색 시작:`, allSessions.length, '개 세션 확인');
    
    const reviewSessions = allSessions.filter((s) => {
      // review_due 필드로 확인
      if (s.review_due === key) {
        console.log('review_due로 매치된 세션:', s.title, s.review_due);
        return true;
      }
      
      // review_schedule 배열에서도 확인
      if (s.review_schedule && Array.isArray(s.review_schedule)) {
        // 기존 문자열 배열 형태
        if (typeof s.review_schedule[0] === 'string') {
          const match = s.review_schedule.includes(key);
          if (match) console.log('문자열 배열로 매치된 세션:', s.title, s.review_schedule);
          return match;
        }
        
        // 새로운 객체 배열 형태
        const migratedSchedule = migrateReviewSchedule(s.review_schedule);
        const match = migratedSchedule.some(item => item.date === key && !item.completed);
        if (match) console.log('객체 배열로 매치된 세션:', s.title, migratedSchedule);
        return match;
      }
      
      return false;
    });
    
    console.log(`${key} 날짜의 복습 세션 결과:`, reviewSessions.length, '개');
    return reviewSessions;
  };

  // 6) 제목을 지정된 길이로 자르기
  const truncateTitle = (title, maxLength) => {
    if (!title) return '';
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  // 7) 학습 유형에 따른 색상 클래스
  const getLearningTypeColor = (learningType) => {
    if (learningType === 'deep') {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    } else if (learningType === 'maintain') {
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  // 월이 변경될 때마다 해당 월의 모든 세션 데이터 로드
  useEffect(() => {
    const loadMonthSessions = async () => {
      if (!loadDateSessions) return;
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const monthData = {};
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        // 시간대 문제를 피하기 위해 로컬 날짜 사용
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        try {
          if (window.electronAPI) {
            const result = await window.electronAPI.loadDateSessions(dateStr);
            monthData[dateStr] = result?.success ? result.sessions : [];
          }
        } catch (error) {
          console.error(`세션 로드 오류 (${dateStr}):`, error);
          monthData[dateStr] = [];
        }
      }
      
      setAllSessionsData(monthData);
    };
    
    loadMonthSessions();
  }, [currentDate, loadDateSessions]);

  // 날짜 클릭 핸들러
  const handleDateClick = async (date) => {
    if (!date) return;
    
    console.log('날짜 클릭됨:', date.getDate(), '일');
    
    // 시간대 문제를 피하기 위해 로컬 날짜 사용
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    setSelectedDate(dateStr);
    
    // 해당 날짜의 완료된 세션들
    const completedSessions = getSessionsForDate(date);
    setSelectedDateSessions(completedSessions);
    
    // 해당 날짜가 복습 예정일인 세션들
    const reviewSessionsForDate = getReviewSessionsForDate(date);
    setReviewSessions(reviewSessionsForDate);
  };

  // 세션 클릭 핸들러
  const handleSessionClick = (session) => {
    setSelectedSessionDetail(session);
    setShowDetailModal(true);
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
              // 시간대 문제를 피하기 위해 로컬 날짜 사용
              const dateStr = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : null;
              const today = date ? isToday(dateStr) : false;
              const sessionsToday = getSessionsForDate(date);
              const reviewSessionsToday = getReviewSessionsForDate(date);
              
              // 디버깅용 - 선택된 날짜나 오늘만 표시
              if (date && (dateStr === selectedDate || today)) {
                console.log(`캘린더 ${date.getDate()}일 상태 (${dateStr === selectedDate ? '선택됨' : '오늘'}):`, {
                  date: date,
                  dateStr: dateStr,
                  today: today,
                  selected: dateStr === selectedDate,
                  currentDateString: getCurrentDateString()
                });
              }

              /* 셀 스타일 */
              const base =
                "border border-border min-h-[100px] p-2 transition-colors";
              const bg = !date
                ? "bg-muted/50"
                : today
                  ? "bg-primary/5"
                  : dateStr === selectedDate
                    ? "bg-secondary/20"
                    : "bg-background";
              const hover = date ? "hover:bg-muted/50 cursor-pointer" : "";

              return (
                <div 
                  key={idx} 
                  className={`${base} ${bg} ${hover}`}
                  onClick={() => {
                    console.log('div 클릭:', date ? date.getDate() : 'null');
                    handleDateClick(date);
                  }}
                >
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

                      {/* 세션 배지 - 일반 세션과 복습 세션 */}
                      <div className="flex flex-wrap gap-1">
                        {/* 일반 세션 (완료/진행중) */}
                        {sessionsToday
                          .slice(0, calendarView === "month" ? 2 : 3)
                          .map((s) => (
                            <Badge
                              key={s.id}
                              className={`text-xs px-1 py-0.5 cursor-pointer hover:opacity-80 ${getLearningTypeColor(s.learningType)}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSessionClick(s);
                              }}
                            >
                              {truncateTitle(s.title, 5)}
                            </Badge>
                          ))}
                        
                        {/* 복습 세션 (다른 색상으로 표시) */}
                        {reviewSessionsToday
                          .slice(0, calendarView === "month" ? 2 : 3)
                          .map((s) => (
                            <Badge
                              key={`review-${s.id}`}
                              className="text-xs px-1 py-0.5 cursor-pointer hover:opacity-80 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSessionClick(s);
                              }}
                            >
                              📚{truncateTitle(s.title, 4)}
                            </Badge>
                          ))}
                        
                        {/* 더보기 표시 */}
                        {(sessionsToday.length + reviewSessionsToday.length) > (calendarView === "month" ? 4 : 6) && (
                          <Badge 
                            variant="outline" 
                            className="text-xs px-1 py-0.5"
                          >
                            +{(sessionsToday.length + reviewSessionsToday.length) - (calendarView === "month" ? 4 : 6)}
                          </Badge>
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

      {/* 선택된 날짜의 세션 상세 정보 */}
      {selectedDate && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedDate(null)}
              >
                닫기
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 왼쪽: 완료된 세션들 */}
              <div>
                <h4 className="text-md font-medium mb-3 text-green-700 dark:text-green-400">
                  완료된 세션 ({selectedDateSessions.length})
                </h4>
                <div className="space-y-2">
                  {selectedDateSessions.length > 0 ? (
                    selectedDateSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors"
                        onClick={() => handleSessionClick(session)}
                      >
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getLearningTypeColor(session.learningType)}`}>
                            {session.learningType === 'deep' ? 'Deep' : session.learningType === 'maintain' ? 'Maintain' : ''}
                          </Badge>
                          <span className="font-medium">
                            {truncateTitle(session.title, 7)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.start && session.end ? `${session.start}-${session.end}` : session.start}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">완료된 세션이 없습니다.</p>
                  )}
                </div>
              </div>

              {/* 오른쪽: 복습 예정 세션들 */}
              <div>
                <h4 className="text-md font-medium mb-3 text-blue-700 dark:text-blue-400">
                  복습 예정 ({reviewSessions.length})
                </h4>
                <div className="space-y-2">
                  {reviewSessions.length > 0 ? (
                    reviewSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                        onClick={() => handleSessionClick(session)}
                      >
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getLearningTypeColor(session.learningType)}`}>
                            {session.learningType === 'deep' ? 'Deep' : session.learningType === 'maintain' ? 'Maintain' : ''}
                          </Badge>
                          <span className="font-medium">
                            {truncateTitle(session.title, 7)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.date}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">복습 예정 세션이 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 세션 상세 모달 */}
      <SessionDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        session={selectedSessionDetail}
        setEditingSession={setEditingSession}
        setShowCardForm={setShowCardForm}
      />
    </div>
  );
};

export default CalendarPage;
