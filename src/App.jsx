import React, { useState, useEffect } from "react";
import SessionCardForm from "./components/SessionCardForm";
import DashboardPage from "./pages/DashboardPage";
import CalendarPage from "./pages/CalendarPage";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./index.css";
// 메인 앱 컴포넌트
const StudyPlannerApp = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sessions, setSessions] = useState([]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [calendarView, setCalendarView] = useState("month");
  
  // 실제 오늘 날짜로 강제 초기화 (로컬 시간대 기준)
  const getCurrentDate = () => {
    return new Date();
  };
  
  const getCurrentDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [currentDate, setCurrentDate] = useState(() => getCurrentDate());
  const [selectedDate, setSelectedDate] = useState(() => getCurrentDateString());

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

  // 앱 시작 시 현재 날짜로 강제 업데이트
  useEffect(() => {
    console.log('앱 시작 - 현재 날짜로 강제 설정');
    const now = new Date();
    const nowStr = getCurrentDateString();
    console.log('설정할 날짜:', nowStr, '현재 시간:', now);
    console.log('로컬 날짜 정보:', {
      getFullYear: now.getFullYear(),
      getMonth: now.getMonth() + 1,
      getDate: now.getDate()
    });
    
    setCurrentDate(now);
    setSelectedDate(nowStr);
    
    // 추가로 상태 확인용 로그
    setTimeout(() => {
      console.log('설정 후 selectedDate:', nowStr);
    }, 100);
  }, []);

  // currentDate와 selectedDate 동기화
  useEffect(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (selectedDate !== dateStr) {
      setSelectedDate(dateStr);
    }
  }, [currentDate]);

  useEffect(() => {
    const date = new Date(selectedDate + 'T00:00:00');
    if (currentDate.toISOString().split('T')[0] !== selectedDate) {
      setCurrentDate(date);
    }
  }, [selectedDate]);

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
        ) : (
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
        )}

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
    </ThemeProvider>
  );
};

export default StudyPlannerApp;
