// SessionDetailModal.jsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Star, FolderOpen, X } from "lucide-react";

export default function SessionDetailModal({ open, onOpenChange, session }) {
  if (!session) return null;

  /* ——— 헬퍼: 첨부폴더 열기 (Electron) ——— */
  const openFolder = (path) =>
    window.electron?.openPath?.(path) ||
    alert("폴더 열기 기능은 데스크톱 앱에서만 작동합니다.");

  /* ——— 렌더 ——— */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-xl font-bold">
            {session.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh]">
          <article className="prose dark:prose-invert max-w-none p-6">
            {/* ─ 기본 정보 ─ */}
            <h3>기본 정보</h3>
            <p>
              <strong>날짜:</strong> {session.date}
            </p>
            {session.learningType && (
              <p>
                <strong>학습 유형:</strong>{" "}
                {session.learningType === "deep" ? "Deep" : "Maintain"}
              </p>
            )}
            {session.eft_calculated && (
              <p>
                <strong>집중시간:</strong> {session.eft_calculated}분
              </p>
            )}

            {/* ─ 사전·사후 목표/평가 ─ */}
            {session.goal_pre && (
              <>
                <h3>사전 목표</h3>
                <p>{session.goal_pre}</p>
              </>
            )}

            {session.goal_post && (
              <>
                <h3>사후 평가</h3>
                <p>{session.goal_post}</p>
              </>
            )}

            {/* ─ 성과(achievement) ─ */}
            {session.achievement && (
              <>
                <h3>성과</h3>
                <p>{session.achievement}</p>
              </>
            )}

            {/* ─ 점수 평가(별점 + 코멘트) ─ */}
            {(session.score_rating || session.score_comment) && (
              <>
                <h3>점수 평가</h3>
                {session.score_rating && (
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i <= session.score_rating
                            ? "fill-yellow-400 text-yellow-400 dark:fill-yellow-300 dark:text-yellow-300"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                )}
                {session.score_comment && <p>{session.score_comment}</p>}
              </>
            )}

            {/* ─ 방해 요소 ─ */}
            {session.blockers && (
              <>
                <h3>방해 요소</h3>
                <p>{session.blockers}</p>
              </>
            )}

            {/* ─ 다음 첫 과제 ─ */}
            {session.next_task && (
              <>
                <h3>다음 첫 과제</h3>
                <p>{session.next_task}</p>
              </>
            )}

            {/* ─ 첨부파일 ─ */}
            {session.attachments?.length > 0 && (
              <>
                <h3>첨부파일</h3>
                <ul>
                  {session.attachments.map((f) => (
                    <li key={f.id} className="flex items-center gap-2">
                      {f.fileName}
                      <button
                        onClick={() => openFolder(f.folderPath)}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FolderOpen className="w-4 h-4" />
                        열기
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* ─ 복습 예정 ─ */}
            {session.review_due && (
              <>
                <h3>복습 예정일</h3>
                <Badge variant="outline">{session.review_due}</Badge>
              </>
            )}
          </article>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
