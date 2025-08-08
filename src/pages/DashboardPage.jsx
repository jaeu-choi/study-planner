import React, { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useTime } from "@/contexts/TimeContext";
import SessionCard from "../components/SessionCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const DashboardPage = ({
  sessions,
  saveSessions,
  setEditingSession,
  setShowCardForm,
  selectedDate,
  setSelectedDate,
  loadDateSessions,
}) => {
  const [loading, setLoading] = useState(false);
  const { getCurrentDateString, isToday, formatShortDate } = useTime();

  // 날짜 변경 시 세션 로드 (로딩 상태 업데이트)
  const handleLoadDateSessions = async (date) => {
    setLoading(true);
    try {
      await loadDateSessions(date);
    } finally {
      setLoading(false);
    }
  };

  // 날짜 네비게이션
  const navigateDate = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + (direction === "prev" ? -1 : 1));
    const newDate = current.toISOString().split("T")[0];
    setSelectedDate(newDate);
    handleLoadDateSessions(newDate);
  };

  const goToToday = () => {
    const today = getCurrentDateString();
    console.log("goToToday 클릭 - 현재 날짜:", today);
    setSelectedDate(today);
    handleLoadDateSessions(today);
  };

  // 현재 날짜에 맞는 세션들 사용
  const displaySessions = sessions;
  const pendingSessions = displaySessions.filter((s) => s.status === "pending");
  const inProgressSessions = displaySessions.filter(
    (s) => s.status === "in-progress",
  );
  const completedSessions = displaySessions.filter(
    (s) => s.status === "completed",
  );

  const totalStudyTime = displaySessions
    .filter((s) => s.status === "completed")
    .reduce((acc, s) => acc + (s.eft_calculated || 0), 0);

  const isTodaySelected = isToday(selectedDate);

  // 디버깅용
  console.log(
    "DashboardPage - selectedDate:",
    selectedDate,
    "isToday:",
    isTodaySelected,
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">DashBoard</h1>

            {/* 날짜 네비게이션 */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate("prev")}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-2 min-w-[140px] justify-center">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {formatShortDate(selectedDate)}
                </span>
                {isTodaySelected && (
                  <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                    오늘
                  </span>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate("next")}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {!isTodaySelected && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="text-xs"
              >
                오늘로
              </Button>
            )}
          </div>

          <Button
            onClick={() => {
              setEditingSession(null);
              setShowCardForm(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />새 세션 카드
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <CardDescription>
                {isToday ? "오늘 세션" : "선택된 날짜 세션"}
              </CardDescription>
              <CardTitle className="text-2xl">
                {loading ? "..." : displaySessions.length}
              </CardTitle>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <CardDescription>
                {isToday ? "오늘 학습시간" : "선택된 날짜 학습시간"}
              </CardDescription>
              <CardTitle className="text-2xl">
                {loading
                  ? "..."
                  : `${Math.floor(totalStudyTime / 60)}h ${totalStudyTime % 60}m`}
              </CardTitle>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <CardDescription>완료 세션</CardDescription>
              <CardTitle className="text-2xl">
                {completedSessions.length}
              </CardTitle>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <CardDescription>대기중 세션</CardDescription>
              <CardTitle className="text-2xl">
                {pendingSessions.length}
              </CardTitle>
            </CardContent>
          </Card>
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold mb-4 text-foreground">Sessions</h1>
      </div>
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[600px] rounded-lg border"
      >
        {/* 시작전 패널 */}
        <ResizablePanel defaultSize={33} minSize={20}>
          <div className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-muted-foreground">시작전</h2>
              <span className="text-sm bg-muted px-2 py-1 rounded-full">
                {pendingSessions.length}
              </span>
            </div>
            <div className="space-y-3 h-full overflow-y-auto pr-2">
              {pendingSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  sessions={displaySessions}
                  saveSessions={saveSessions}
                  setEditingSession={setEditingSession}
                  setShowCardForm={setShowCardForm}
                  loadDateSessions={loadDateSessions}
                  selectedDate={selectedDate}
                />
              ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* 진행중 패널 */}
        <ResizablePanel defaultSize={33} minSize={20}>
          <div className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-yellow-600 dark:text-yellow-400">
                진행중
              </h2>
              <span className="text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full">
                {inProgressSessions.length}
              </span>
            </div>
            <div className="space-y-3 h-full overflow-y-auto pr-2">
              {inProgressSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  sessions={displaySessions}
                  saveSessions={saveSessions}
                  setEditingSession={setEditingSession}
                  setShowCardForm={setShowCardForm}
                  loadDateSessions={loadDateSessions}
                  selectedDate={selectedDate}
                />
              ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* 완료 패널 */}
        <ResizablePanel defaultSize={34} minSize={20}>
          <div className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-green-600 dark:text-green-300">
                완료됨
              </h2>
              <span className="text-sm bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                {completedSessions.length}
              </span>
            </div>
            <div className="space-y-3 h-full overflow-y-auto pr-2">
              {completedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  sessions={displaySessions}
                  saveSessions={saveSessions}
                  setEditingSession={setEditingSession}
                  setShowCardForm={setShowCardForm}
                  loadDateSessions={loadDateSessions}
                  selectedDate={selectedDate}
                />
              ))}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default DashboardPage;
