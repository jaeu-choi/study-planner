import React, { useState } from "react";
import {
  Calendar,
  CheckCircle,
  Circle,
  AlertCircle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SessionDetailModal from "./SessionDetailModal";

const SessionCard = ({
  session,
  sessions,
  saveSessions,
  setEditingSession,
  setShowCardForm,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);

  /* ---------- 상태 표시 설정 ---------- */
  const statusConfig = {
    pending: { icon: Circle, color: "text-muted-foreground", label: "시작전" },
    "in-progress": {
      icon: AlertCircle,
      color: "text-yellow-600 dark:text-yellow-400",
      label: "진행중",
    },
    completed: {
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      label: "완료됨",
    },
  };
  const config = statusConfig[session.status];
  const StatusIcon = config.icon;
  const statusFlow = ["pending", "in-progress", "completed"];
  const nextStatus = (curr) =>
    statusFlow[(statusFlow.indexOf(curr) + 1) % statusFlow.length];

  /* ---------- 제목 처리 ---------- */
  const rawTitle = session.title || "제목 없음";
  const isLong = rawTitle.length > 10;
  const collapsedTitle = isLong ? `${rawTitle.slice(0, 10)}…` : rawTitle;
  const titleClass =
    "font-semibold text-base text-foreground min-w-0" +
    (isLong ? (showDetails ? " line-clamp-2" : " truncate") : "");

  /* ---------- 이벤트 ---------- */
  const handleStatusChange = () => {
    const newSessions = sessions.map((s) =>
      s.id === session.id ? { ...s, status: nextStatus(session.status) } : s,
    );
    saveSessions(newSessions);
  };

  const handleDelete = () => {
    if (confirm("이 세션을 삭제하시겠습니까?")) {
      saveSessions(sessions.filter((s) => s.id !== session.id));
    }
  };

  /* ---------- 렌더 ---------- */
  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          {/* 1행 : 체크‧제목‧상태‧편집‧삭제 */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 hover:scale-110 transition"
                onClick={handleStatusChange}
              >
                <StatusIcon className={`w-4 h-4 ${config.color}`} />
              </Button>

              <p className={titleClass}>
                {showDetails ? rawTitle : collapsedTitle}
              </p>

              <Badge variant="secondary" className={config.color}>
                {config.label}
              </Badge>
            </div>

            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setEditingSession(session);
                  setShowCardForm(true);
                }}
              >
                <Edit2 className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={handleDelete}
              >
                <Trash2 className="w-3 h-3 text-destructive hover:text-destructive/80" />
              </Button>
            </div>
          </div>

          {/* 2행 : 날짜‧학습유형‧토글 */}
          <div className="pl-1 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="truncate">{session.date}</span>

              {session.learningType && (
                <Badge
                  variant="secondary"
                  className={`ml-2 text-xs px-2 py-0.5 shrink-0 ${
                    session.learningType === "deep"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                  }`}
                >
                  {session.learningType === "deep" ? "Deep" : "Maintain"}
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={() => setShowDetails((p) => !p)}
            >
              {showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* 상세 부분 (접힘/펼침) */}
          {showDetails && (
            <div className="pl-1 space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">목표</p>
                <p className="text-sm text-muted-foreground">
                  {session.goal_pre || "목표 미설정"}
                </p>
              </div>

              {session.goal_post && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    결과
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.goal_post}
                  </p>
                </div>
              )}

              {session.eft_calculated && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">집중시간:</span>
                  <span className="font-medium text-foreground">
                    {session.eft_calculated}분
                  </span>
                </div>
              )}

              {session.mood_energy && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i <= session.mood_energy
                          ? "fill-yellow-400 text-yellow-400 dark:fill-yellow-300 dark:text-yellow-300"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              )}

              {session.review_due && (
                <Badge
                  variant="outline"
                  className="text-blue-600 dark:text-blue-400"
                >
                  복습 예정: {session.review_due}
                </Badge>
              )}
            </div>
          )}

          {/* 더보기 버튼 */}
          <Button
            variant="link"
            size="sm"
            className="pl-1"
            onClick={() => setOpenDetail(true)}
          >
            더보기
          </Button>
        </CardContent>
      </Card>

      {/* 상세 모달 */}
      <SessionDetailModal
        open={openDetail}
        onOpenChange={setOpenDetail}
        session={session}
      />
    </>
  );
};

export default SessionCard;
