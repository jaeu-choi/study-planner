import React, { useState, useEffect } from "react";
import SessionCardForm from "./components/SessionCardForm";
import DashboardPage from "./pages/DashboardPage";
import CalendarPage from "./pages/CalendarPage";

// 메인 앱 컴포넌트
const StudyPlannerApp = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sessions, setSessions] = useState([]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [calendarView, setCalendarView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // 로컬 스토리지에서 세션 불러오기
  useEffect(() => {
    const savedSessions = localStorage.getItem("studySessions");
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // 세션 저장
  const saveSessions = (newSessions) => {
    setSessions(newSessions);
    localStorage.setItem("studySessions", JSON.stringify(newSessions));
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 */}
      <nav className="bg-white border-b">
        <div className="px-6 py-3 flex items-center gap-6">
          <h1 className="text-xl font-bold text-blue-600">Study Planner</h1>
          <button
            onClick={() => setCurrentPage("dashboard")}
            className={`px-4 py-2 rounded ${currentPage === "dashboard" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"}`}
          >
            대시보드
          </button>
          <button
            onClick={() => setCurrentPage("calendar")}
            className={`px-4 py-2 rounded ${currentPage === "calendar" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"}`}
          >
            캘린더
          </button>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      {currentPage === "dashboard" ? (
        <DashboardPage 
          sessions={sessions}
          saveSessions={saveSessions}
          setEditingSession={setEditingSession}
          setShowCardForm={setShowCardForm}
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
        />
      )}

      {/* 세션 카드 폼 모달 */}
      {showCardForm && (
        <SessionCardForm
          session={editingSession}
          sessions={sessions}
          saveSessions={saveSessions}
          onClose={() => {
            setShowCardForm(false);
            setEditingSession(null);
          }}
        />
      )}
    </div>
  );
};

export default StudyPlannerApp;
