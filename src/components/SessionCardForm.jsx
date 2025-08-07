import React, { useState } from "react";
import { X, Star } from "lucide-react";

const SessionCardForm = ({ onClose, session, sessions, saveSessions }) => {
  const [formData, setFormData] = useState(
    session || {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      start: "",
      end: "",
      status: "pending",
      goal_pre: "",
      goal_post: "",
      outcomes: "",
      artifacts: [],
      scores: {},
      eft_time: 90,
      eft_factor: 0.6,
      eft_calculated: 54,
      distractions: "",
      next_first_task: "",
      review_due: "",
      mood_energy: 3,
    },
  );

  const handleSubmit = () => {
    const newSessions = session
      ? sessions.map((s) => (s.id === session.id ? formData : s))
      : [...sessions, formData];

    saveSessions(newSessions);
    onClose();
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
    const name = prompt("평가 항목 이름:");
    if (name) {
      setFormData((prev) => ({
        ...prev,
        scores: { ...prev.scores, [name]: { score: 0, total: 5 } },
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            세션 카드 {session ? "수정" : "생성"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">날짜</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">시작</label>
              <input
                type="time"
                value={formData.start}
                onChange={(e) => handleInputChange("start", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">종료</label>
              <input
                type="time"
                value={formData.end}
                onChange={(e) => handleInputChange("end", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              사전 목표
            </label>
            <textarea
              value={formData.goal_pre}
              onChange={(e) => handleInputChange("goal_pre", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows="2"
              placeholder="예: 자가 퀴즈 5문항 중 ≥4 정답"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              사후 평가
            </label>
            <textarea
              value={formData.goal_post}
              onChange={(e) => handleInputChange("goal_post", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows="2"
              placeholder="예: 실제 4/5 정답, 실수 1개"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">성과</label>
            <textarea
              value={formData.outcomes}
              onChange={(e) => handleInputChange("outcomes", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
              placeholder="- 개념 요약 10문장&#10;- 빈 칠판 복원 1개&#10;- 대표문제 3문제 풀이"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">점수 평가</label>
              <button
                type="button"
                onClick={addScore}
                className="text-sm text-blue-600 hover:underline"
              >
                + 항목 추가
              </button>
            </div>
            {Object.entries(formData.scores).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 mb-2">
                <span className="flex-1 text-sm">{key}:</span>
                <input
                  type="number"
                  value={value.score}
                  onChange={(e) =>
                    handleInputChange("scores", {
                      ...formData.scores,
                      [key]: { ...value, score: Number(e.target.value) },
                    })
                  }
                  className="w-16 px-2 py-1 border rounded"
                  min="0"
                  max={value.total}
                />
                <span className="text-sm">/ {value.total}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              EFT (실제 집중 시간)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formData.eft_time}
                readOnly
                className="w-20 px-2 py-1 border rounded bg-gray-50"
              />
              <span>분 ×</span>
              <select
                value={formData.eft_factor}
                onChange={(e) =>
                  handleInputChange("eft_factor", Number(e.target.value))
                }
                className="px-2 py-1 border rounded"
              >
                <option value={1.0}>1.0</option>
                <option value={0.8}>0.8</option>
                <option value={0.6}>0.6</option>
                <option value={0.4}>0.4</option>
              </select>
              <span>=</span>
              <input
                type="number"
                value={formData.eft_calculated}
                readOnly
                className="w-20 px-2 py-1 border rounded bg-gray-50"
              />
              <span>분</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              방해 요소
            </label>
            <input
              type="text"
              value={formData.distractions}
              onChange={(e) =>
                handleInputChange("distractions", e.target.value)
              }
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="예: GPT 검색 중 YouTube 자동 재생"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              다음 첫 과제
            </label>
            <input
              type="text"
              value={formData.next_first_task}
              onChange={(e) =>
                handleInputChange("next_first_task", e.target.value)
              }
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="예: p.57 Q4 재풀이 5분"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              복습 예정일
            </label>
            <input
              type="date"
              value={formData.review_due}
              onChange={(e) =>
                handleInputChange("review_due", e.target.value)
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              기분/에너지
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleInputChange("mood_energy", i)}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 ${i <= formData.mood_energy ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">상태</label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="pending">시작전</option>
              <option value="in-progress">진행중</option>
              <option value="completed">완료됨</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              {session ? "수정" : "생성"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionCardForm;