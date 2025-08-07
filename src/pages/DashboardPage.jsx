import React from "react";
import { Plus } from "lucide-react";
import SessionCard from "../components/SessionCard";

const DashboardPage = ({ sessions, saveSessions, setEditingSession, setShowCardForm }) => {
  const pendingSessions = sessions.filter((s) => s.status === "pending");
  const inProgressSessions = sessions.filter(
    (s) => s.status === "in-progress",
  );
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
        <h1 className="text-2xl font-bold mb-4">학습 대시보드</h1>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">오늘 세션</p>
            <p className="text-2xl font-bold">{todaySessions.length}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">총 학습시간</p>
            <p className="text-2xl font-bold">
              {Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">완료 세션</p>
            <p className="text-2xl font-bold">{completedSessions.length}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">대기중 세션</p>
            <p className="text-2xl font-bold">{pendingSessions.length}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingSession(null);
            setShowCardForm(true);
          }}
          className="mb-6 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />새 세션 카드
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <h2 className="font-semibold mb-3 text-gray-700">
            시작전 ({pendingSessions.length})
          </h2>
          <div className="space-y-3">
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

        <div>
          <h2 className="font-semibold mb-3 text-yellow-600">
            진행중 ({inProgressSessions.length})
          </h2>
          <div className="space-y-3">
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

        <div>
          <h2 className="font-semibold mb-3 text-green-600">
            완료됨 ({completedSessions.length})
          </h2>
          <div className="space-y-3">
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
      </div>
    </div>
  );
};

export default DashboardPage;