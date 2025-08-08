import React, { useState, useEffect } from "react";
import SessionCardForm from "./components/SessionCardForm";
import DashboardPage from "./pages/DashboardPage";
import CalendarPage from "./pages/CalendarPage";
import TimerPage from "./pages/TimerPage";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TimeProvider } from "@/contexts/TimeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./index.css";
// 메인 앱 컴포넌트
const StudyPlannerApp = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sessions, setSessions] = useState([]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [calendarView, setCalendarView] = useState("month");
  
  // 페이지별 날짜 상태 (사용자 탐색용)
  const [currentDate, setCurrentDate] = useState(() => new Date()); // 캘린더용
  const [selectedDate, setSelectedDate] = useState(() => {
    // 대시보드용 - 초기값은 오늘
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // 선택된 날짜의 세션들 불러오기
  const loadDateSessions = async (date) => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.loadDateSessions(date);
        if (result?.success) {
          setSessions(result.sessions);
        } else {
          setSessions([]);
        }
      } catch (error) {
        console.error('세션 로드 오류:', error);
        setSessions([]);
      }
    } else {
      // 웹 환경에서는 localStorage 사용
      const savedSessions = localStorage.getItem("studySessions");
      if (savedSessions) {
        const allSessions = JSON.parse(savedSessions);
        const dateSessions = allSessions.filter(s => s.date === date);
        setSessions(dateSessions);
      } else {
        setSessions([]);
      }
    }
  };


  // 초기 로드 및 날짜 변경 시 세션 로드
  useEffect(() => {
    loadDateSessions(selectedDate);
  }, [selectedDate]);

  // 세션 저장 (새로운 파일 시스템과 localStorage 호환)
  const saveSessions = (newSessions) => {
    // 웹 환경에서만 localStorage 사용
    if (!window.electronAPI) {
      setSessions(newSessions);
      localStorage.setItem("studySessions", JSON.stringify(newSessions));
    }
    // Electron 환경에서는 새로운 파일 시스템에서 자동 처리하므로 
    // React 상태는 loadDateSessions를 통해서만 업데이트
  };

  return (
    <ThemeProvider>
      <TimeProvider>
        <div className="min-h-screen bg-background">
        {/* 네비게이션 */}
        <nav className="bg-card border-b">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-primary">Study Planner</h1>
              <Button
                variant={currentPage === "dashboard" ? "default" : "ghost"}
                onClick={() => setCurrentPage("dashboard")}
              >
                대시보드
              </Button>
              <Button
                variant={currentPage === "calendar" ? "default" : "ghost"}
                onClick={() => setCurrentPage("calendar")}
              >
                캘린더
              </Button>
              <Button
                variant={currentPage === "timer" ? "default" : "ghost"}
                onClick={() => setCurrentPage("timer")}
              >
                타이머
              </Button>
            </div>
            <ThemeToggle />
          </div>
        </nav>
        {/* 메인 콘텐츠 */}
        {currentPage === "dashboard" ? (
          <DashboardPage
            sessions={sessions}
            saveSessions={saveSessions}
            setEditingSession={setEditingSession}
            setShowCardForm={setShowCardForm}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            loadDateSessions={loadDateSessions}
          />
        ) : currentPage === "calendar" ? (
          <CalendarPage
            sessions={sessions}
            calendarView={calendarView}
            setCalendarView={setCalendarView}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            setEditingSession={setEditingSession}
            setShowCardForm={setShowCardForm}
            loadDateSessions={loadDateSessions}
          />
        ) : currentPage === "timer" ? (
          <TimerPage />
        ) : null}

        {/* 세션 카드 폼 모달 */}
        {showCardForm && (
          <SessionCardForm
            session={editingSession}
            sessions={sessions}
            saveSessions={saveSessions}
            selectedDate={selectedDate}
            loadDateSessions={loadDateSessions}
            onClose={() => {
              setShowCardForm(false);
              setEditingSession(null);
            }}
          />
        )}
        </div>
      </TimeProvider>
    </ThemeProvider>
  );
};

export default StudyPlannerApp;
