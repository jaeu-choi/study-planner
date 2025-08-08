import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, Plus, Minus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePomodoro } from '@/contexts/PomodoroContext';

const TimerPage = () => {
  // UI 상태
  const [showSettings, setShowSettings] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);
  
  // 뽀모도로 컨텍스트 사용
  const {
    totalSeconds,
    isRunning,
    isPaused,
    getRemainingSeconds,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    setTimer,
    formatTime,
    getProgressPercentage
  } = usePomodoro();

  // 실시간 데이터 계산
  const remainingSeconds = getRemainingSeconds();
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progressPercentage = getProgressPercentage();


  // 시간 조정 (+5분, +10분, -5분, -10분)
  const adjustTime = (minutesToAdd) => {
    const newTotalSeconds = Math.max(60, totalSeconds + (minutesToAdd * 60)); // 최소 1분
    setTimer(newTotalSeconds);
  };

  // 사용자 지정 시간 설정
  const setCustomTime = () => {
    const newTotalSeconds = Math.max(1, customMinutes) * 60;
    setTimer(newTotalSeconds);
    setShowSettings(false);
  };

  // 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // UI 실시간 업데이트를 위한 강제 리렌더링
  const [, forceUpdate] = useState({});
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        forceUpdate({}); // 매초마다 컴포넌트 리렌더링
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);


  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">뽀모도로 타이머</h1>
        <p className="text-muted-foreground">집중 시간을 효과적으로 관리하세요</p>
      </div>

      {/* 메인 타이머 카드 */}
      <Card className="mb-6">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">
            {isRunning ? '집중 중' : isPaused ? '일시정지' : '대기 중'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 타이머 디스플레이 */}
          <div className="text-center">
            <div className="text-6xl font-mono font-bold text-primary mb-4">
              {formatTime(remainingSeconds)}
            </div>
            
            {/* 프로그레스 바 */}
            <div className="space-y-2">
              <Progress 
                value={progressPercentage} 
                className="h-3"
              />
              <p className="text-sm text-muted-foreground">
                {Math.floor(progressPercentage)}% 완료 ({formatTime(totalSeconds - remainingSeconds)} / {formatTime(totalSeconds)})
              </p>
            </div>
          </div>

          {/* 컨트롤 버튼 */}
          <div className="flex justify-center gap-4">
            {!isRunning && !isPaused && (
              <Button
                onClick={startTimer}
                className="flex items-center gap-2 px-6 py-3"
                size="lg"
              >
                <Play className="w-5 h-5" />
                시작
              </Button>
            )}

            {isRunning && (
              <Button
                onClick={pauseTimer}
                variant="outline"
                className="flex items-center gap-2 px-6 py-3"
                size="lg"
              >
                <Pause className="w-5 h-5" />
                일시정지
              </Button>
            )}

            {isPaused && (
              <Button
                onClick={startTimer}
                className="flex items-center gap-2 px-6 py-3"
                size="lg"
              >
                <Play className="w-5 h-5" />
                재개
              </Button>
            )}

            {(isRunning || isPaused) && (
              <Button
                onClick={stopTimer}
                variant="destructive"
                className="flex items-center gap-2 px-6 py-3"
                size="lg"
              >
                <Square className="w-5 h-5" />
                정지
              </Button>
            )}

            <Button
              onClick={resetTimer}
              variant="outline"
              className="flex items-center gap-2 px-6 py-3"
              size="lg"
            >
              <RotateCcw className="w-5 h-5" />
              리셋
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 시간 조정 패널 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            시간 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 빠른 조정 버튼 */}
          <div>
            <Label className="text-sm font-medium mb-2 block">빠른 조정</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => adjustTime(-10)}
                variant="outline"
                size="sm"
                disabled={isRunning}
              >
                <Minus className="w-4 h-4 mr-1" />
                10분
              </Button>
              <Button
                onClick={() => adjustTime(-5)}
                variant="outline"
                size="sm"
                disabled={isRunning}
              >
                <Minus className="w-4 h-4 mr-1" />
                5분
              </Button>
              <Button
                onClick={() => adjustTime(5)}
                variant="outline"
                size="sm"
                disabled={isRunning}
              >
                <Plus className="w-4 h-4 mr-1" />
                5분
              </Button>
              <Button
                onClick={() => adjustTime(10)}
                variant="outline"
                size="sm"
                disabled={isRunning}
              >
                <Plus className="w-4 h-4 mr-1" />
                10분
              </Button>
            </div>
          </div>

          {/* 사용자 지정 시간 */}
          <div>
            <Label className="text-sm font-medium mb-2 block">사용자 지정</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min="1"
                max="120"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20"
                disabled={isRunning}
              />
              <span className="text-sm text-muted-foreground">분</span>
              <Button
                onClick={setCustomTime}
                size="sm"
                disabled={isRunning}
              >
                설정
              </Button>
            </div>
          </div>

          {/* 프리셋 */}
          <div>
            <Label className="text-sm font-medium mb-2 block">프리셋</Label>
            <div className="flex gap-2 flex-wrap">
              {[15, 25, 30, 45, 60].map((preset) => (
                <Button
                  key={preset}
                  onClick={() => {
                    setCustomMinutes(preset);
                    const newTotalSeconds = preset * 60;
                    setTimer(newTotalSeconds);
                  }}
                  variant={Math.floor(totalSeconds / 60) === preset ? "default" : "outline"}
                  size="sm"
                  disabled={isRunning}
                >
                  {preset}분
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 상태 정보 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">설정 시간</p>
              <p className="text-lg font-semibold">{formatTime(totalSeconds)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">남은 시간</p>
              <p className="text-lg font-semibold">{formatTime(remainingSeconds)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimerPage;