import React, { useState } from "react";
import {
  X,
  Star,
  Plus,
  Trash2,
  Paperclip,
  FileText,
  Image,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { generateReviewSchedule, getReviewScheduleDescription, getNextReviewDate } from "@/utils/reviewScheduler";

const SessionCardForm = ({ 
  onClose, 
  session, 
  sessions, 
  saveSessions,
  selectedDate,
  loadDateSessions 
}) => {
  // 세션 ID를 미리 생성하여 일관성 유지
  const generateSessionId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}${minutes}${seconds}`;
    
    const rand4 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${dateStr}-${timeStr}-${rand4}`;
  };

  const [formData, setFormData] = useState(
    session || {
      id: session?.id || generateSessionId(), // 새 세션의 경우 미리 ID 생성
      date: selectedDate || new Date().toISOString().split("T")[0],
      title: "",
      hashtags: "",
      learningType: null, // 'deep' or 'maintain'
      start: "",
      end: "",
      status: "pending",
      goal_pre: "",
      goal_post: "",
      outcomes: "",
      attachments: [],
      scores: {},
      eft_time: 90,
      eft_factor: 0.6,
      eft_calculated: 54,
      distractions: "",
      next_first_task: "",
      review_due: "",
      review_schedule: [], // 자동 생성된 복습 일정 배열
      auto_review_enabled: true, // 자동 복습 일정 사용 여부
      mood_energy: 3,
    },
  );

  const handleSubmit = async () => {
    try {
      // 세션 데이터 준비
      let sessionToSave = { ...formData };
      
      // 자동 복습 일정 생성 (완료 상태이고 자동 복습이 활성화된 경우)
      console.log('세션 저장 전 체크:', {
        status: sessionToSave.status,
        auto_review_enabled: sessionToSave.auto_review_enabled,
        existing_schedule: sessionToSave.review_schedule
      });
      
      if (sessionToSave.status === 'completed' && sessionToSave.auto_review_enabled) {
        console.log('복습 일정 생성 조건 만족');
        
        // 기존에 복습 일정이 없거나 비어있는 경우에만 새로 생성
        if (!sessionToSave.review_schedule || sessionToSave.review_schedule.length === 0) {
          console.log('복습 일정 생성 시작:', sessionToSave.date);
          
          try {
            const reviewSchedule = generateReviewSchedule(sessionToSave.date);
            sessionToSave.review_schedule = reviewSchedule;
            
            // review_due 필드는 다음 복습 일정으로 설정
            const nextReview = getNextReviewDate(reviewSchedule);
            if (nextReview) {
              sessionToSave.review_due = nextReview;
            }
            
            console.log('자동 복습 일정 생성 완료:', {
              reviewSchedule,
              nextReview,
              sessionData: sessionToSave
            });
          } catch (error) {
            console.error('복습 일정 생성 오류:', error);
          }
        } else {
          console.log('기존 복습 일정 존재, 생성 건너뜀');
        }
      } else {
        console.log('복습 일정 생성 조건 불만족:', {
          status: sessionToSave.status,
          auto_enabled: sessionToSave.auto_review_enabled
        });
      }
      
      if (window.electronAPI) {
        // Electron 환경: 새로운 파일 시스템 사용
        const result = await window.electronAPI.saveSession(sessionToSave);
        
        if (result?.success) {
          // 선택된 날짜의 세션 다시 로드
          if (loadDateSessions) {
            await loadDateSessions(sessionToSave.date);
          }
          onClose();
        } else {
          alert('세션 저장에 실패했습니다: ' + (result?.error || '알 수 없는 오류'));
        }
      } else {
        // 웹 환경: 기존 localStorage 사용
        const sessionWithId = {
          ...sessionToSave,
          id: sessionToSave.id || Date.now().toString()
        };
        
        const newSessions = session
          ? sessions.map((s) => (s.id === session.id ? sessionWithId : s))
          : [...sessions, sessionWithId];

        saveSessions(newSessions);
        onClose();
      }
    } catch (error) {
      console.error('세션 저장 오류:', error);
      alert('세션 저장 중 오류가 발생했습니다.');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "eft_factor" || field === "start" || field === "end") {
        if (updated.start && updated.end) {
          const start = new Date(`2000-01-01 ${updated.start}`);
          const end = new Date(`2000-01-01 ${updated.end}`);
          const diffMinutes = (end - start) / 60000;
          updated.eft_time = Math.max(0, diffMinutes);
          updated.eft_calculated = Math.round(
            updated.eft_time * updated.eft_factor,
          );
        }
      }

      return updated;
    });
  };

  const addScore = () => {
    const id = Date.now().toString();
    setFormData((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [id]: {
          title: "",
          score: 0,
          total: 5,
          comment: "",
        },
      },
    }));
  };

  const removeScore = (id) => {
    setFormData((prev) => {
      const newScores = { ...prev.scores };
      delete newScores[id];
      return {
        ...prev,
        scores: newScores,
      };
    });
  };

  const updateScore = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [id]: {
          ...prev.scores[id],
          [field]: value,
        },
      },
    }));
  };

  const attachFile = async () => {
    try {
      console.log("파일 첨부 시도 중... formData.id:", formData.id);
      console.log("window.electronAPI:", window.electronAPI);

      if (!window.electronAPI) {
        alert(
          "Electron API를 사용할 수 없습니다. 개발자 도구 콘솔을 확인해주세요.",
        );
        return;
      }

      // 일관된 세션 ID 사용 (미리 생성된 ID)
      const result = await window.electronAPI.attachFile(
        formData.id,
        formData.date,
      );
      console.log("파일 첨부 결과:", result);

      if (result?.success && result.files) {
        setFormData((prev) => ({
          ...prev,
          attachments: [...(prev.attachments || []), ...result.files],
        }));
      } else {
        alert(result?.message || "파일 첨부에 실패했습니다.");
      }
    } catch (error) {
      console.error("파일 첨부 오류:", error);
      alert("파일 첨부 중 오류가 발생했습니다: " + error.message);
    }
  };

  const removeAttachment = async (fileId, fileName) => {
    try {
      const result = await window.electronAPI?.removeAttachment(
        formData.id,
        fileName,
        formData.date,
      );
      if (result?.success) {
        setFormData((prev) => ({
          ...prev,
          attachments: prev.attachments.filter((file) => file.id !== fileId),
        }));
      } else {
        alert(result?.message || "파일 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("파일 삭제 오류:", error);
      alert("파일 삭제 중 오류가 발생했습니다.");
    }
  };

  const openAttachment = async (fileName) => {
    try {
      const result = await window.electronAPI?.openAttachment(
        formData.id,
        fileName,
        formData.date,
      );
      if (!result?.success) {
        alert(result?.message || "파일 열기에 실패했습니다.");
      }
    } catch (error) {
      console.error("파일 열기 오류:", error);
      alert("파일 열기 중 오류가 발생했습니다.");
    }
  };

  const getFileIcon = (type) => {
    const imageTypes = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
    if (imageTypes.includes(type)) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            세션 카드 {session ? "수정" : "생성"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="예: 미적분 연습문제 풀이"
            />
          </div>

          <div>
            <Label htmlFor="hashtags">해시태그</Label>
            <Input
              id="hashtags"
              type="text"
              value={formData.hashtags}
              onChange={(e) => handleInputChange("hashtags", e.target.value)}
              placeholder="예: #수학 #미적분 #연습문제"
            />
          </div>

          <div>
            <Label>학습 유형</Label>
            <div className="flex gap-2 mt-1">
              <Button
                type="button"
                variant={formData.learningType === "deep" ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange("learningType", formData.learningType === "deep" ? null : "deep")}
                className={`${formData.learningType === "deep" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"}`}
              >
                Deep
              </Button>
              <Button
                type="button"
                variant={formData.learningType === "maintain" ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange("learningType", formData.learningType === "maintain" ? null : "maintain")}
                className={`${formData.learningType === "maintain" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"}`}
              >
                Maintain
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Deep: 새로운 개념 학습 • Maintain: 복습 및 유지
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">날짜</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="start">시작</Label>
              <Input
                id="start"
                type="time"
                value={formData.start}
                onChange={(e) => handleInputChange("start", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="end">종료</Label>
              <Input
                id="end"
                type="time"
                value={formData.end}
                onChange={(e) => handleInputChange("end", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="goal_pre">사전 목표</Label>
            <Textarea
              id="goal_pre"
              value={formData.goal_pre}
              onChange={(e) => handleInputChange("goal_pre", e.target.value)}
              rows={2}
              placeholder="예: 자가 퀴즈 5문항 중 ≥4 정답"
            />
          </div>

          <div>
            <Label htmlFor="goal_post">사후 평가</Label>
            <Textarea
              id="goal_post"
              value={formData.goal_post}
              onChange={(e) => handleInputChange("goal_post", e.target.value)}
              rows={2}
              placeholder="예: 실제 4/5 정답, 실수 1개"
            />
          </div>

          <div>
            <Label htmlFor="outcomes">성과</Label>
            <Textarea
              id="outcomes"
              value={formData.outcomes}
              onChange={(e) => handleInputChange("outcomes", e.target.value)}
              rows={3}
              placeholder="- 개념 요약 10문장&#10;- 빈 칠판 복원 1개&#10;- 대표문제 3문제 풀이"
            />
            
            {/* 파일 첨부 */}
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Label>첨부파일</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={attachFile}
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  파일 첨부
                </Button>
              </div>
              
              {formData.attachments && formData.attachments.length > 0 && (
                <div className="space-y-2">
                  {formData.attachments.map((file) => (
                    <div key={file.id} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.originalName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} •{" "}
                          {new Date(file.attachedAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openAttachment(file.fileName)}
                        className="shrink-0"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(file.id, file.fileName)}
                        className="text-destructive hover:text-destructive/80 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <Label>점수 평가</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addScore}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  항목 추가
                </Button>
              </div>
              {Object.entries(formData.scores).map(([id, scoreData]) => {
                const percentage = scoreData.total > 0 ? (scoreData.score / scoreData.total) * 100 : 0;
                return (
                  <Card key={id} className="mb-3">
                    <CardContent className="p-3">
                      <div className="space-y-3">
                        {/* 제목 입력 */}
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="평가 항목 제목 (예: 지수로그 기본개념문제)"
                            value={scoreData.title}
                            onChange={(e) => updateScore(id, "title", e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeScore(id)}
                            className="text-destructive hover:text-destructive/80 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* 점수 입력 및 진행률 */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={scoreData.score}
                              onChange={(e) => updateScore(id, "score", Number(e.target.value))}
                              className="w-12 text-center"
                              min={0}
                              max={scoreData.total}
                            />
                            <span className="text-sm">/</span>
                            <Input
                              type="number"
                              value={scoreData.total}
                              onChange={(e) => updateScore(id, "total", Number(e.target.value))}
                              className="w-12 text-center"
                              min={1}
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Progress value={percentage} className="flex-1" />
                              <span className="text-sm text-muted-foreground min-w-[3rem]">
                                {Math.round(percentage)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 코멘트 입력 */}
                        <Input
                          placeholder="코멘트 (예: 지수법칙을 헷갈림)"
                          value={scoreData.comment}
                          onChange={(e) => updateScore(id, "comment", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>

          <div>
            <Label>EFT (실제 집중 시간)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={formData.eft_time}
                readOnly
                className="w-20 bg-muted"
              />
              <span>분 ×</span>
              <Select
                value={formData.eft_factor.toString()}
                onValueChange={(value) => handleInputChange("eft_factor", Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.0">1.0</SelectItem>
                  <SelectItem value="0.8">0.8</SelectItem>
                  <SelectItem value="0.6">0.6</SelectItem>
                  <SelectItem value="0.4">0.4</SelectItem>
                </SelectContent>
              </Select>
              <span>=</span>
              <Input
                type="number"
                value={formData.eft_calculated}
                readOnly
                className="w-20 bg-muted"
              />
              <span>분</span>
            </div>
          </div>

          <div>
            <Label htmlFor="distractions">방해 요소</Label>
            <Input
              id="distractions"
              type="text"
              value={formData.distractions}
              onChange={(e) =>
                handleInputChange("distractions", e.target.value)
              }
              placeholder="예: GPT 검색 중 YouTube 자동 재생"
            />
          </div>

          <div>
            <Label htmlFor="next_first_task">다음 첫 과제</Label>
            <Input
              id="next_first_task"
              type="text"
              value={formData.next_first_task}
              onChange={(e) =>
                handleInputChange("next_first_task", e.target.value)
              }
              placeholder="예: p.57 Q4 재풀이 5분"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>복습 일정</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto_review" className="text-sm font-normal">
                  자동 일정 생성
                </Label>
                <input
                  id="auto_review"
                  type="checkbox"
                  checked={formData.auto_review_enabled}
                  onChange={(e) =>
                    handleInputChange("auto_review_enabled", e.target.checked)
                  }
                  className="w-4 h-4"
                />
              </div>
            </div>
            
            {formData.auto_review_enabled ? (
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
                  <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                    에빙하우스 망각곡선 기반 복습 일정
                  </h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    세션 완료 시 자동으로 다음 일정이 생성됩니다:
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-4">
                    <li>• 1일 후 (내일)</li>
                    <li>• 3일 후 (평일로 조정)</li>
                    <li>• 7일 후 (1주 후)</li>
                    <li>• 20일 후 (약 3주 후)</li>
                    <li>• 45일 후 (약 7주 후)</li>
                  </ul>
                  
                  {formData.review_schedule && formData.review_schedule.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        현재 복습 일정:
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {getReviewScheduleDescription(formData.review_schedule)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="review_due">수동 복습 예정일</Label>
                <Input
                  id="review_due"
                  type="date"
                  value={formData.review_due}
                  onChange={(e) =>
                    handleInputChange("review_due", e.target.value)
                  }
                />
              </div>
            )}
          </div>

          <div>
            <Label>기분/에너지</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Button
                  key={i}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInputChange("mood_energy", i)}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 ${i <= formData.mood_energy ? "fill-yellow-400 text-yellow-400 dark:fill-yellow-300 dark:text-yellow-300" : "text-muted-foreground"}`}
                  />
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>상태</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">시작전</SelectItem>
                <SelectItem value="in-progress">진행중</SelectItem>
                <SelectItem value="completed">완료됨</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1"
            >
              {session ? "수정" : "생성"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionCardForm;