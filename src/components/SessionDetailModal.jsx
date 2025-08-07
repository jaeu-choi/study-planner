import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Star, X } from "lucide-react";

/**
 * SessionDetailModal – 노션 페이지 느낌의 article 팝업
 *
 * props
 *  open        : boolean      외부 상태
 *  onOpenChange: (boolean) => void
 *  session     : Session 객체
 */
const SessionDetailModal = ({ open, onOpenChange, session }) => {
  if (!session) return null;

  const statusColor =
    session.status === "completed"
      ? "text-green-600"
      : session.status === "in-progress"
        ? "text-yellow-600"
        : "text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* DialogTrigger는 외부(SessionCard)에서 대신 사용 */}
      <DialogContent className="max-w-2xl p-0">
        {/* 헤더 */}
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-xl font-bold">
            {session.title}
          </DialogTitle>
          <div className={`text-sm ${statusColor}`}>{session.status}</div>
          <DialogClose className="absolute top-4 right-4">
            <X className="w-5 h-5" />
          </DialogClose>
        </DialogHeader>

        {/* 스크롤 영역 */}
        <ScrollArea className="h-[70vh]">
          <article className="prose dark:prose-invert max-w-none p-6">
            <section>
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
                  <strong>총 집중시간:</strong> {session.eft_calculated}분
                </p>
              )}
            </section>

            <section>
              <h3>목표</h3>
              <p>{session.goal_pre || "목표 미설정"}</p>
            </section>

            {session.goal_post && (
              <section>
                <h3>결과</h3>
                <p>{session.goal_post}</p>
              </section>
            )}

            {session.mood_energy && (
              <section>
                <h3>에너지</h3>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i <= session.mood_energy
                          ? "fill-yellow-400 text-yellow-400 dark:fill-yellow-300 dark:text-yellow-300"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </section>
            )}

            {session.review_due && (
              <section>
                <h3>복습 예정일</h3>
                <Badge variant="outline">{session.review_due}</Badge>
              </section>
            )}

            {session.attachments?.length > 0 && (
              <section>
                <h3>첨부파일</h3>
                <ul>
                  {session.attachments.map((f) => (
                    <li key={f.id}>
                      <a
                        href={f.relativePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {f.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SessionDetailModal;
