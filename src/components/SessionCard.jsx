import React from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  Star,
  Edit2,
  Trash2,
} from "lucide-react";

const SessionCard = ({ session, sessions, saveSessions, setEditingSession, setShowCardForm }) => {
  const statusConfig = {
    pending: {
      icon: Circle,
      color: "text-gray-400",
      bg: "bg-gray-50",
      label: "시작전",
    },
    "in-progress": {
      icon: AlertCircle,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
      label: "진행중",
    },
    completed: {
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-50",
      label: "완료됨",
    },
  };

  const config = statusConfig[session.status];
  const StatusIcon = config.icon;

  const handleDelete = () => {
    if (confirm("이 세션을 삭제하시겠습니까?")) {
      const newSessions = sessions.filter((s) => s.id !== session.id);
      saveSessions(newSessions);
    }
  };

  const handleStatusChange = () => {
    const statusFlow = ["pending", "in-progress", "completed"];
    const currentIndex = statusFlow.indexOf(session.status);
    const nextStatus = statusFlow[(currentIndex + 1) % 3];

    const newSessions = sessions.map((s) =>
      s.id === session.id ? { ...s, status: nextStatus } : s,
    );
    saveSessions(newSessions);
  };

  return (
    <div className={`border rounded-lg p-4 ${config.bg}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleStatusChange}
            className="hover:scale-110 transition"
          >
            <StatusIcon className={`w-5 h-5 ${config.color}`} />
          </button>
          <span className={`text-sm font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setEditingSession(session);
              setShowCardForm(true);
            }}
            className="p-1 hover:bg-white rounded"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-white rounded"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{session.date}</span>
          <Clock className="w-4 h-4 ml-2" />
          <span>
            {session.start} - {session.end || "진행중"}
          </span>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">목표</p>
          <p className="text-sm text-gray-600">
            {session.goal_pre || "목표 미설정"}
          </p>
        </div>

        {session.goal_post && (
          <div>
            <p className="text-sm font-medium text-gray-700">결과</p>
            <p className="text-sm text-gray-600">{session.goal_post}</p>
          </div>
        )}

        {session.eft_calculated && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">집중시간:</span>
            <span className="text-sm font-medium">
              {session.eft_calculated}분
            </span>
          </div>
        )}

        {session.mood_energy && (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i <= session.mood_energy ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
              />
            ))}
          </div>
        )}

        {session.review_due && (
          <div className="text-sm text-blue-600">
            복습 예정: {session.review_due}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionCard;