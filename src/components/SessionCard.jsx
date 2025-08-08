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
import { useTime } from "@/contexts/TimeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SessionDetailModal from "./SessionDetailModal";
import { generateReviewSchedule, getNextReviewDate } from "@/utils/reviewScheduler";

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
  const { getCurrentTimeString } = useTime();

  /* ───── 카드 요약 데이터 ───── */
  const { icon: StatusIcon, cls, label } = statusMap[session.status];
  const nextStatus = () =>
    FLOW[(FLOW.indexOf(session.status) + 1) % FLOW.length];

  /* ───── 핸들러 ───── */
  const toggleStatus = async () => {
    const newStatus = nextStatus();
    let updatedSession = { ...session, status: newStatus };
    
    // 상태 변경에 따른 시간 자동 설정
    if (session.status === 'pending' && newStatus === 'in-progress') {
      // 시작전 → 진행중: 시작 시간 자동 설정
      const currentTime = getCurrentTimeString();
      updatedSession.start = currentTime;
      console.log('세션 시작 시간 자동 설정:', currentTime);
    } else if (session.status === 'in-progress' && newStatus === 'completed') {
      // 진행중 → 완료됨: 종료 시간 자동 설정
      const currentTime = getCurrentTimeString();
      updatedSession.end = currentTime;
      console.log('세션 종료 시간 자동 설정:', currentTime);
      
      // EFT 시간 재계산
      if (updatedSession.start && updatedSession.end) {
        const start = new Date(`2000-01-01 ${updatedSession.start}`);
        const end = new Date(`2000-01-01 ${updatedSession.end}`);
        const diffMinutes = (end - start) / 60000;
        updatedSession.eft_time = Math.max(0, diffMinutes);
        updatedSession.eft_calculated = Math.round(
          updatedSession.eft_time * (updatedSession.eft_factor || 0.6)
        );
        console.log('EFT 재계산:', {
          start: updatedSession.start,
          end: updatedSession.end,
          eft_time: updatedSession.eft_time,
          eft_calculated: updatedSession.eft_calculated
        });
      }
    }
    
    // 상태가 완료됨으로 변경되고 자동 복습이 활성화된 경우 복습 일정 생성
    if (newStatus === 'completed' && updatedSession.auto_review_enabled !== false) {
      console.log('상태 변경으로 인한 복습 일정 생성 체크:', {
        newStatus,
        auto_review_enabled: updatedSession.auto_review_enabled,
        existing_schedule: updatedSession.review_schedule
      });
      
      // 기존에 복습 일정이 없거나 비어있는 경우에만 새로 생성
      if (!updatedSession.review_schedule || updatedSession.review_schedule.length === 0) {
        try {
          console.log('복습 일정 생성 시작 (상태 변경):', updatedSession.date);
          
          const reviewSchedule = generateReviewSchedule(updatedSession.date);
          updatedSession.review_schedule = reviewSchedule;
          
          // review_due 필드는 다음 복습 일정으로 설정
          const nextReview = getNextReviewDate(reviewSchedule);
          if (nextReview) {
            updatedSession.review_due = nextReview;
          }
          
          // auto_review_enabled 필드가 없으면 true로 설정
          if (updatedSession.auto_review_enabled === undefined) {
            updatedSession.auto_review_enabled = true;
          }
          
          console.log('상태 변경으로 복습 일정 생성 완료:', {
            reviewSchedule,
            nextReview,
            sessionData: updatedSession
          });
        } catch (error) {
          console.error('복습 일정 생성 오류 (상태 변경):', error);
        }
      }
    }
    
    if (window.electronAPI) {
      // Electron 환경: 새로운 파일 시스템 사용
      try {
        const result = await window.electronAPI.saveSession(updatedSession);
        if (result?.success) {
          // 성공하면 상위 컴포넌트에서 세션 목록 다시 로드
          window.location.reload(); // 임시로 페이지 새로고침 (나중에 개선 가능)
        } else {
          alert('세션 상태 변경에 실패했습니다: ' + (result?.error || '알 수 없는 오류'));
        }
      } catch (error) {
        console.error('세션 상태 변경 오류:', error);
        alert('세션 상태 변경 중 오류가 발생했습니다.');
      }
    } else {
      // 웹 환경: 기존 localStorage 사용
      saveSessions(
        sessions.map((s) =>
          s.id === session.id ? updatedSession : s,
        ),
      );
    }
  };

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

              <p
                className="font-semibold text-base text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                onClick={() => setOpenDetail(true)}
              >
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
                onClick={async () => {
                  if (!confirm("삭제하시겠습니까?")) return;
                  
                  if (window.electronAPI) {
                    // Electron 환경: 새로운 파일 시스템 사용
                    try {
                      const result = await window.electronAPI.deleteSession(session.id, session.date);
                      if (result?.success) {
                        // 성공하면 상위 컴포넌트에서 세션 목록 다시 로드
                        window.location.reload(); // 임시로 페이지 새로고침 (나중에 개선 가능)
                      } else {
                        alert('세션 삭제에 실패했습니다: ' + (result?.error || '알 수 없는 오류'));
                      }
                    } catch (error) {
                      console.error('세션 삭제 오류:', error);
                      alert('세션 삭제 중 오류가 발생했습니다.');
                    }
                  } else {
                    // 웹 환경: 기존 localStorage 사용
                    saveSessions(sessions.filter((s) => s.id !== session.id));
                  }
                }}
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
        </CardContent>
      </Card>

      <SessionDetailModal
        open={openDetail}
        onOpenChange={setOpenDetail}
        session={session}
        setEditingSession={setEditingSession}
        setShowCardForm={setShowCardForm}
      />
    </>
  );
}
