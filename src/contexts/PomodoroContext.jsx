import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const PomodoroContext = createContext();

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};

export const PomodoroProvider = ({ children }) => {
  // 타이머 기본 상태
  const [totalSeconds, setTotalSeconds] = useState(25 * 60); // 기본 25분
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState(null); // 타이머 시작 시간
  const [pausedDuration, setPausedDuration] = useState(0); // 일시정지된 총 시간
  const [lastPauseTime, setLastPauseTime] = useState(null); // 마지막 일시정지 시간
  
  // 실시간 업데이트를 위한 ref
  const intervalRef = useRef(null);
  
  // localStorage 키
  const STORAGE_KEY = 'pomodoro-state';
  
  // 현재 남은 시간 계산
  const getRemainingSeconds = () => {
    if (!isRunning && !isPaused) {
      return totalSeconds;
    }
    
    if (!startTime) {
      return totalSeconds;
    }
    
    const now = Date.now();
    let elapsedSeconds;
    
    if (isPaused && lastPauseTime) {
      // 일시정지 상태: 마지막 일시정지 시점까지의 경과시간만 계산
      elapsedSeconds = Math.floor((lastPauseTime - startTime - pausedDuration) / 1000);
    } else if (isRunning) {
      // 실행 중: 현재까지의 경과시간에서 일시정지된 시간 제외
      elapsedSeconds = Math.floor((now - startTime - pausedDuration) / 1000);
    } else {
      elapsedSeconds = 0;
    }
    
    const remaining = Math.max(0, totalSeconds - elapsedSeconds);
    return remaining;
  };
  
  // 상태를 localStorage에 저장
  const saveState = () => {
    const state = {
      totalSeconds,
      isRunning,
      isPaused,
      startTime,
      pausedDuration,
      lastPauseTime,
      savedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };
  
  // localStorage에서 상태 복원
  const loadState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        
        // 타이머가 실행 중이었다면 복원
        if (state.isRunning || state.isPaused) {
          setTotalSeconds(state.totalSeconds);
          setStartTime(state.startTime);
          setPausedDuration(state.pausedDuration);
          setLastPauseTime(state.lastPauseTime);
          setIsRunning(state.isRunning);
          setIsPaused(state.isPaused);
          
          console.log('뽀모도로 타이머 상태 복원:', state);
          return true;
        }
      }
    } catch (error) {
      console.error('뽀모도로 상태 복원 실패:', error);
    }
    return false;
  };
  
  // 타이머 시작
  const startTimer = () => {
    const now = Date.now();
    
    if (!isRunning && !isPaused) {
      // 새로 시작
      setStartTime(now);
      setPausedDuration(0);
      setLastPauseTime(null);
      console.log('뽀모도로 타이머 시작');
    } else if (isPaused) {
      // 일시정지에서 재개
      const pauseElapsed = now - lastPauseTime;
      setPausedDuration(prev => prev + pauseElapsed);
      setLastPauseTime(null);
      console.log('뽀모도로 타이머 재개');
    }
    
    setIsRunning(true);
    setIsPaused(false);
  };
  
  // 타이머 일시정지
  const pauseTimer = () => {
    setIsRunning(false);
    setIsPaused(true);
    setLastPauseTime(Date.now());
    console.log('뽀모도로 타이머 일시정지');
  };
  
  // 타이머 정지
  const stopTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setStartTime(null);
    setPausedDuration(0);
    setLastPauseTime(null);
    console.log('뽀모도로 타이머 정지');
    
    // localStorage에서 제거
    localStorage.removeItem(STORAGE_KEY);
  };
  
  // 타이머 리셋
  const resetTimer = () => {
    stopTimer();
    console.log('뽀모도로 타이머 리셋');
  };
  
  // 시간 설정 (타이머가 정지 상태일 때만)
  const setTimer = (newTotalSeconds) => {
    if (!isRunning && !isPaused) {
      setTotalSeconds(newTotalSeconds);
    }
  };
  
  // 컴포넌트 마운트 시 상태 복원
  useEffect(() => {
    loadState();
  }, []);
  
  // 상태 변경 시 저장
  useEffect(() => {
    if (isRunning || isPaused) {
      saveState();
    }
  }, [totalSeconds, isRunning, isPaused, startTime, pausedDuration, lastPauseTime]);
  
  // 실시간 업데이트 및 타이머 완료 체크
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const remaining = getRemainingSeconds();
        
        if (remaining <= 0) {
          // 타이머 완료
          setIsRunning(false);
          setIsPaused(false);
          console.log('뽀모도로 타이머 완료');
          
          // 알림 (권한이 있는 경우)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('뽀모도로 완료!', {
              body: `${Math.floor(totalSeconds / 60)}분 집중 완료`,
              icon: '/favicon.ico'
            });
          }
          
          // localStorage에서 제거
          localStorage.removeItem(STORAGE_KEY);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, totalSeconds, startTime, pausedDuration, lastPauseTime]);
  
  const value = {
    // 상태
    totalSeconds,
    isRunning,
    isPaused,
    getRemainingSeconds,
    
    // 컨트롤 함수들
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    setTimer,
    
    // 유틸리티
    formatTime: (totalSec) => {
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    },
    
    getProgressPercentage: () => {
      const remaining = getRemainingSeconds();
      return ((totalSeconds - remaining) / totalSeconds) * 100;
    }
  };
  
  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
};

export default PomodoroContext;