// SessionDetailModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Star,
  FolderOpen,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Edit2,
} from "lucide-react";
import {
  migrateReviewSchedule,
  markReviewCompleted,
  markReviewIncomplete,
  isAllReviewsCompleted,
  getCompletedReviewCount,
} from "@/utils/reviewScheduler";

export default function SessionDetailModal({
  open,
  onOpenChange,
  session,
  setEditingSession,
  setShowCardForm,
}) {
  const [localSession, setLocalSession] = useState(session || null);

  // session이 변경될 때 로컬 상태도 업데이트
  useEffect(() => {
    if (session) {
      setLocalSession(session);
    }
  }, [session]);

  if (!session) return null;

  // localSession이 null인 경우 session을 사용
  const currentSession = localSession || session;

  // 복습 일정 토글 핸들러
  const handleReviewToggle = async (reviewId, completed) => {
    try {
      console.log("복습 토글:", {
        reviewId,
        completed,
        sessionId: currentSession.id,
      });

      // 로컬 상태 업데이트
      let updatedSchedule;
      if (completed) {
        updatedSchedule = markReviewCompleted(
          currentSession.review_schedule,
          reviewId,
        );
      } else {
        updatedSchedule = markReviewIncomplete(
          currentSession.review_schedule,
          reviewId,
        );
      }

      const updatedSession = {
        ...currentSession,
        review_schedule: updatedSchedule,
      };

      // 모든 복습이 완료되었는지 확인
      const allCompleted = isAllReviewsCompleted(updatedSchedule);
      if (allCompleted) {
        updatedSession.all_reviews_completed = true;
        updatedSession.all_reviews_completed_at = new Date().toISOString();
        console.log("모든 복습 완료! 🎉");
      } else {
        updatedSession.all_reviews_completed = false;
        updatedSession.all_reviews_completed_at = null;
      }

      setLocalSession(updatedSession);

      // 백엔드에 저장
      if (window.electronAPI) {
        const result = await window.electronAPI.saveSession(updatedSession);
        if (result?.success) {
          console.log("복습 상태 저장 성공");
        } else {
          console.error("복습 상태 저장 실패:", result?.error);
          alert("복습 상태 저장에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("복습 토글 오류:", error);
      alert("복습 상태 변경 중 오류가 발생했습니다.");
    }
  };

  /* ——— 헬퍼: 첨부폴더 열기 (Electron) ——— */
  const openFolder = (path) =>
    window.electron?.openPath?.(path) ||
    alert("폴더 열기 기능은 데스크톱 앱에서만 작동합니다.");

  /* ——— 렌더 ——— */ return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold">
              {session.title}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingSession(session);
                setShowCardForm(true);
                onOpenChange(false);
              }}
              className="flex items-center gap-2 mr-5"
            >
              <Edit2 className="w-4 h-4" />
              수정
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[80vh]">
          <div className="p-6 space-y-8">
            {/* 기본 정보 섹션 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-muted">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">
                  기본 정보
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">날짜</div>
                  <div className="font-medium">
                    {localSession?.date || session?.date}
                  </div>
                </div>

                {(localSession?.start || session?.start) && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      시간
                    </div>
                    <div className="font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {session.start} - {session.end || "진행중"}
                    </div>
                  </div>
                )}

                {session.learningType && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      학습 유형
                    </div>
                    <Badge
                      className={`${
                        session.learningType === "deep"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {session.learningType === "deep" ? "Deep" : "Maintain"}
                    </Badge>
                  </div>
                )}

                {session.eft_calculated && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      집중시간
                    </div>
                    <div className="font-medium">
                      {session.eft_calculated}분
                    </div>
                  </div>
                )}

                {session.mood_energy && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      기분/에너지
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i <= session.mood_energy
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 목표 및 평가 섹션 */}
            {(session.goal_pre || session.goal_post) && (
              <section className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-muted">
                  <Target className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">
                    목표 및 평가
                  </h2>
                </div>

                {session.goal_pre && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border-l-4 border-blue-500">
                    <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      사전 목표
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {session.goal_pre}
                    </p>
                  </div>
                )}

                {session.goal_post && (
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border-l-4 border-green-500">
                    <h3 className="font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      사후 평가
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {session.goal_post}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* 성과 섹션 */}
            {session.outcomes && (
              <section className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-muted">
                  <CheckCircle className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">
                    성과
                  </h2>
                </div>

                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {session.outcomes}
                  </p>
                </div>
              </section>
            )}

            {/* 점수 평가 섹션 */}
            {session.scores && Object.keys(session.scores).length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-muted">
                  <Star className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">
                    점수 평가
                  </h2>
                </div>

                <div className="space-y-4">
                  {Object.entries(session.scores).map(([id, scoreData]) => {
                    const percentage =
                      scoreData.total > 0
                        ? (scoreData.score / scoreData.total) * 100
                        : 0;
                    return (
                      <div
                        key={id}
                        className="bg-muted/30 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">
                            {scoreData.title || "평가 항목"}
                          </h3>
                          <Badge variant="outline">
                            {scoreData.score}/{scoreData.total}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Progress value={percentage} className="flex-1" />
                            <span className="text-sm font-medium min-w-[3rem]">
                              {Math.round(percentage)}%
                            </span>
                          </div>

                          {scoreData.comment && (
                            <p className="text-sm text-muted-foreground">
                              {scoreData.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 방해 요소 섹션 */}
            {session.distractions && (
              <section className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-muted">
                  <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">
                    방해 요소
                  </h2>
                </div>

                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border-l-4 border-orange-500">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {session.distractions}
                  </p>
                </div>
              </section>
            )}

            {/* 다음 첫 과제 섹션 */}
            {session.next_first_task && (
              <section className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-muted">
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">
                    다음 첫 과제
                  </h2>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border-l-4 border-purple-500">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {session.next_first_task}
                  </p>
                </div>
              </section>
            )}

            {/* 첨부파일 섹션 */}
            {session.attachments?.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-muted">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">
                      첨부파일
                    </h2>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        if (!window.electronAPI) {
                          alert("Electron API를 사용할 수 없습니다.");
                          return;
                        }

                        const result =
                          await window.electronAPI.openAttachmentFolder(
                            session.id,
                            session.date,
                          );

                        if (!result?.success) {
                          alert(
                            `폴더 열기 실패: ${result?.message || "알 수 없는 오류"}`,
                          );
                        }
                      } catch (error) {
                        console.error("첨부파일 폴더 열기 오류:", error);
                        alert(`폴더 열기 중 오류 발생: ${error.message}`);
                      }
                    }}
                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                  >
                    폴더 열기
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {session.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <FolderOpen className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">
                            {file.originalName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(file.attachedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 복습 일정 섹션 */}
            {(currentSession.review_due ||
              (currentSession.review_schedule &&
                currentSession.review_schedule.length > 0)) && (
              <section className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-muted">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">
                    복습 일정
                  </h2>
                  {/* 전체 완료 상태 표시 */}
                  {currentSession.all_reviews_completed && (
                    <Badge variant="default" className="bg-blue-600 text-white">
                      완료
                    </Badge>
                  )}
                </div>

                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  {/* 다음 복습 일정 */}
                  {currentSession.review_due && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2">
                        다음 복습
                      </h3>
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        {new Date(
                          currentSession.review_due + "T00:00:00",
                        ).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                        })}
                      </Badge>
                    </div>
                  )}

                  {/* 전체 복습 일정 (에빙하우스 곡선) - 토글 기능 추가 */}
                  {currentSession.review_schedule &&
                    currentSession.review_schedule.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-2">
                          복습 일정 ({currentSession.review_schedule.length}회)
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {migrateReviewSchedule(
                            currentSession.review_schedule,
                          ).map((reviewItem, index) => {
                            const isPast =
                              reviewItem.date <
                              new Date().toISOString().split("T")[0];
                            const isCurrent =
                              reviewItem.date === currentSession.review_due;

                            return (
                              <Badge
                                key={reviewItem.id}
                                variant={
                                  reviewItem.completed
                                    ? "default"
                                    : isCurrent
                                      ? "default"
                                      : isPast
                                        ? "secondary"
                                        : "outline"
                                }
                                className={`text-xs px-2 py-1 cursor-pointer hover:opacity-80 ${
                                  reviewItem.completed
                                    ? "bg-blue-600 text-white"
                                    : isCurrent
                                      ? "bg-green-600 text-white"
                                      : isPast
                                        ? "opacity-60"
                                        : ""
                                }`}
                                onClick={() =>
                                  handleReviewToggle(
                                    reviewItem.id,
                                    !reviewItem.completed,
                                  )
                                }
                              >
                                <div className="flex items-center gap-1">
                                  {reviewItem.completed && (
                                    <CheckCircle className="w-3 h-3" />
                                  )}
                                  {new Date(
                                    reviewItem.date + "T00:00:00",
                                  ).toLocaleDateString("ko-KR", {
                                    month: "short",
                                    day: "numeric",
                                    weekday: "short",
                                  })}
                                  {reviewItem.completed}
                                </div>
                              </Badge>
                            );
                          })}
                        </div>

                        {/* 진행도 표시 */}
                        {(() => {
                          const completedCount = getCompletedReviewCount(
                            currentSession.review_schedule,
                          );
                          const totalCount = migrateReviewSchedule(
                            currentSession.review_schedule,
                          ).length;
                          return (
                            <div className="mt-2">
                              <Progress
                                value={(completedCount / totalCount) * 100}
                                className="h-1"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                복습 진도: {completedCount}/{totalCount} 완료
                              </p>
                            </div>
                          );
                        })()}

                        {currentSession.auto_review_enabled && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            망각곡선 기반 자동 생성 일정
                          </p>
                        )}

                        {currentSession.all_reviews_completed && (
                          <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                모든 복습이 완료된 세션카드입니다.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
