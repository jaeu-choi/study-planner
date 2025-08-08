import React, { createContext, useContext, useState, useEffect } from 'react';

// 전역 시간 관리 컨텍스트
const TimeContext = createContext();

export const useTime = () => {
  const context = useContext(TimeContext);
  if (!context) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
};

export const TimeProvider = ({ children }) => {
  // 앱의 현재 시간 기준점 (실제 현재 시간)
  const [currentTime, setCurrentTime] = useState(() => new Date());
  
  // 현재 날짜 문자열 (YYYY-MM-DD 형식)
  const getCurrentDateString = () => {
    const now = currentTime;
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // 현재 시간 문자열 (HH:MM 형식)
  const getCurrentTimeString = () => {
    const now = new Date(); // 실시간 현재 시간 사용
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // 현재 시간 문자열 (초 포함, HH:MM:SS 형식)
  const getCurrentTimeStringWithSeconds = () => {
    const now = new Date(); // 실시간 현재 시간 사용
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };
  
  // 오늘인지 확인하는 헬퍼 함수
  const isToday = (dateString) => {
    return dateString === getCurrentDateString();
  };
  
  // 특정 날짜가 현재 시간 기준으로 과거/현재/미래인지 확인
  const getDateStatus = (dateString) => {
    const today = getCurrentDateString();
    if (dateString < today) return 'past';
    if (dateString > today) return 'future';
    return 'today';
  };
  
  // 타이머나 다른 기능을 위해 수동으로 시간 업데이트
  const updateCurrentTime = (newTime = new Date()) => {
    console.log('전역 시간 업데이트:', newTime);
    setCurrentTime(newTime);
  };
  
  // 앱 시작 시 현재 시간으로 초기화
  useEffect(() => {
    console.log('TimeProvider 초기화 - 현재 시간:', currentTime);
    
    // 선택적: 매분마다 자동 업데이트 (실시간 앱의 경우)
    const interval = setInterval(() => {
      const now = new Date();
      // 날짜가 바뀐 경우에만 업데이트
      if (now.toDateString() !== currentTime.toDateString()) {
        console.log('날짜 변경 감지 - 전역 시간 자동 업데이트');
        setCurrentTime(now);
      }
    }, 60000); // 1분마다 체크
    
    return () => clearInterval(interval);
  }, [currentTime]);
  
  const value = {
    // 현재 시간 기준점
    currentTime,
    getCurrentDateString,
    getCurrentTimeString,
    getCurrentTimeStringWithSeconds,
    
    // 유틸리티 함수들
    isToday,
    getDateStatus,
    
    // 수동 업데이트 (타이머 등을 위해)
    updateCurrentTime,
    
    // 추가 유틸리티
    formatDate: (dateString) => {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    },
    
    formatShortDate: (dateString) => {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        weekday: 'short'
      });
    }
  };
  
  return (
    <TimeContext.Provider value={value}>
      {children}
    </TimeContext.Provider>
  );
};

export default TimeContext;