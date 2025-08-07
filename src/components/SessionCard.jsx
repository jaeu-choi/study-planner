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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SessionDetailModal from "./SessionDetailModal";

const statusMap = {
  pending: { icon: Circle, cls: "text-muted-foreground", label: "시작전" },
  "in-progress": {
    icon: AlertCircle,
    cls: "text-yellow-600 dark:text-yellow-400",
    label: "진행중",
  },
  completed: {
    icon: CheckCircle,
    cls: "text-green-600 dark:text-green-400",
    label: "완료됨",
  },
};
const FLOW = ["pending", "in-progress", "completed"];

export default function SessionCard({
  session,
  sessions,
  saveSessions,
  setEditingSession,
  setShowCardForm,
}) {
  const [openDetail, setOpenDetail] = useState(false);
  const [expanded, setExpanded] = useState(false);

  /* ───── 카드 요약 데이터 ───── */
  const { icon: StatusIcon, cls, label } = statusMap[session.status];
  const nextStatus = () =>
    FLOW[(FLOW.indexOf(session.status) + 1) % FLOW.length];

  /* ───── 핸들러 ───── */
  const toggleStatus = () =>
    saveSessions(
      sessions.map((s) =>
        s.id === session.id ? { ...s, status: nextStatus() } : s,
      ),
    );

  /* ───── 렌더 ───── */
  return (
    <>
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* 1행: 제목/상태/편집·삭제 */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={toggleStatus}
              >
                <StatusIcon className={`w-4 h-4 ${cls}`} />
              </Button>

              <p className="font-semibold text-base text-foreground truncate">
                {session.title || "제목 없음"}
              </p>
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
                <Edit2 className="w-3 h-3 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={() =>
                  confirm("삭제하시겠습니까?") &&
                  saveSessions(sessions.filter((s) => s.id !== session.id))
                }
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          </div>

          {/* 2행: 날짜 / 학습유형 / 펼침버튼 */}
          <div className="pl-1 flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-4 h-4" />
              <span className="truncate">{session.date}</span>
              {session.learningType && (
                <Badge
                  variant="secondary"
                  className={`ml-2 text-xs px-2 py-0.5 ${
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
              onClick={() => setExpanded((p) => !p)}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* 3행: 목표 / 집중시간 (접힘) */}
          {expanded && (
            <div className="pl-1 space-y-2 text-sm">
              <p>
                <strong>목표:</strong> {session.goal_pre || "목표 미설정"}
              </p>
              {session.eft_calculated && (
                <p>
                  <strong>집중시간:</strong> {session.eft_calculated}분
                </p>
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

      <SessionDetailModal
        open={openDetail}
        onOpenChange={setOpenDetail}
        session={session}
      />
    </>
  );
}
