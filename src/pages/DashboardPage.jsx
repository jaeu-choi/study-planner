import React from "react";
import { Plus } from "lucide-react";
import SessionCard from "../components/SessionCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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
}) => {
  const pendingSessions = sessions.filter((s) => s.status === "pending");
  const inProgressSessions = sessions.filter((s) => s.status === "in-progress");
  const completedSessions = sessions.filter((s) => s.status === "completed");

  const totalStudyTime = sessions
    .filter((s) => s.status === "completed")
    .reduce((acc, s) => acc + (s.eft_calculated || 0), 0);

  const todaySessions = sessions.filter(
    (s) => s.date === new Date().toISOString().split("T")[0],
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold mb-4 text-foreground">DashBoard</h1>
          <Button
            onClick={() => {
              setEditingSession(null);
              setShowCardForm(true);
            }}
            className="mb-6 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />새 세션 카드
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <CardDescription>오늘 세션</CardDescription>
              <CardTitle className="text-2xl">{todaySessions.length}</CardTitle>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <CardDescription>총 학습시간</CardDescription>
              <CardTitle className="text-2xl">
                {Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m
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
                  sessions={sessions}
                  saveSessions={saveSessions}
                  setEditingSession={setEditingSession}
                  setShowCardForm={setShowCardForm}
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
                  sessions={sessions}
                  saveSessions={saveSessions}
                  setEditingSession={setEditingSession}
                  setShowCardForm={setShowCardForm}
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
              <h2 className="font-semibold text-green-600 dark:text-green-400">
                완료됨
              </h2>
              <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                {completedSessions.length}
              </span>
            </div>
            <div className="space-y-3 h-full overflow-y-auto pr-2">
              {completedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  sessions={sessions}
                  saveSessions={saveSessions}
                  setEditingSession={setEditingSession}
                  setShowCardForm={setShowCardForm}
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

