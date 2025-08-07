/**
 * 에빙하우스 망각곡선에 기반한 복습 일정 계산 유틸리티
 */

/**
 * 에빙하우스 망각곡선 복습 간격 (일 단위)
 * 1일 후, 3일 후, 7일 후, 20일 후, 45일 후
 */
const FORGETTING_CURVE_INTERVALS = [1, 3, 7, 20, 45];

/**
 * 주어진 날짜가 주말(토요일, 일요일)인지 확인
 * @param {Date} date - 확인할 날짜
 * @returns {boolean} 주말이면 true
 */
const isWeekend = (date) => {
  const dayOfWeek = date.getDay(); // 0: 일요일, 6: 토요일
  return dayOfWeek === 0 || dayOfWeek === 6;
};

/**
 * 주말을 피해서 가장 가까운 평일로 조정
 * @param {Date} date - 조정할 날짜
 * @returns {Date} 조정된 날짜 (평일)
 */
const adjustToWeekday = (date) => {
  const adjustedDate = new Date(date);
  
  while (isWeekend(adjustedDate)) {
    // 주말이면 다음 날로 이동 (월요일까지)
    adjustedDate.setDate(adjustedDate.getDate() + 1);
  }
  
  return adjustedDate;
};

/**
 * 특정 날짜에서 지정된 일수 후의 날짜 계산
 * @param {string|Date} startDate - 시작 날짜 (YYYY-MM-DD 또는 Date 객체)
 * @param {number} daysAfter - 며칠 후
 * @returns {string} 계산된 날짜 (YYYY-MM-DD 형식)
 */
const calculateDateAfter = (startDate, daysAfter) => {
  const date = typeof startDate === 'string' ? new Date(startDate + 'T00:00:00') : new Date(startDate);
  const targetDate = new Date(date);
  targetDate.setDate(targetDate.getDate() + daysAfter);
  
  return targetDate.toISOString().split('T')[0];
};

/**
 * 에빙하우스 망각곡선에 기반한 복습 일정 생성 (향상된 데이터 구조)
 * @param {string|Date} sessionDate - 세션 완료 날짜 (YYYY-MM-DD 또는 Date 객체)
 * @param {boolean} excludeWeekends - 주말 제외 여부 (기본값: true)
 * @returns {Array} 복습 일정 객체 배열
 */
const generateReviewSchedule = (sessionDate, excludeWeekends = true) => {
  // 시간대 문제를 피하기 위해 로컬 날짜로 처리
  const baseDate = typeof sessionDate === 'string' 
    ? new Date(sessionDate + 'T12:00:00') // 정오로 설정하여 시간대 문제 방지
    : new Date(sessionDate);
  
  const reviewSchedule = [];
  
  FORGETTING_CURVE_INTERVALS.forEach((interval, index) => {
    // 기본 복습 날짜 계산
    const reviewDate = new Date(baseDate);
    reviewDate.setDate(reviewDate.getDate() + interval);
    
    // 3일 후 복습만 주말 제외 (다른 일정은 그대로 유지)
    let finalReviewDate = reviewDate;
    if (excludeWeekends && interval === 3) {
      finalReviewDate = adjustToWeekday(reviewDate);
    }
    
    // 날짜를 YYYY-MM-DD 형식으로 변환
    const year = finalReviewDate.getFullYear();
    const month = String(finalReviewDate.getMonth() + 1).padStart(2, '0');
    const day = String(finalReviewDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // 복습 일정 객체 생성
    reviewSchedule.push({
      id: `review-${index + 1}`,
      date: dateStr,
      interval: interval,
      completed: false,
      completedAt: null
    });
  });
  
  return reviewSchedule;
};

/**
 * 기존 문자열 배열 형태의 복습 일정을 새로운 객체 형태로 마이그레이션
 * @param {string[]|Array} reviewSchedule - 기존 복습 일정
 * @returns {Array} 새로운 형태의 복습 일정 객체 배열
 */
const migrateReviewSchedule = (reviewSchedule) => {
  if (!reviewSchedule || reviewSchedule.length === 0) {
    return [];
  }
  
  // 이미 새로운 형태인 경우
  if (typeof reviewSchedule[0] === 'object' && reviewSchedule[0].hasOwnProperty('id')) {
    return reviewSchedule;
  }
  
  // 기존 문자열 배열을 새로운 형태로 변환
  return reviewSchedule.map((dateStr, index) => ({
    id: `review-${index + 1}`,
    date: dateStr,
    interval: FORGETTING_CURVE_INTERVALS[index],
    completed: false,
    completedAt: null
  }));
};

/**
 * 복습 일정 설명 텍스트 생성
 * @param {Array} reviewSchedule - 복습 일정 객체 배열
 * @returns {string} 복습 일정 설명
 */
const getReviewScheduleDescription = (reviewSchedule) => {
  if (!reviewSchedule || reviewSchedule.length === 0) {
    return '복습 일정 없음';
  }
  
  // 마이그레이션
  const migratedSchedule = migrateReviewSchedule(reviewSchedule);
  
  const descriptions = [];
  migratedSchedule.forEach((reviewItem) => {
    const dateObj = new Date(reviewItem.date + 'T00:00:00');
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
    
    let description = '';
    const interval = reviewItem.interval;
    if (interval === 1) {
      description = '1일 후';
    } else if (interval === 3) {
      description = '3일 후';
    } else if (interval === 7) {
      description = '1주 후';
    } else if (interval === 20) {
      description = '3주 후';
    } else if (interval === 45) {
      description = '7주 후';
    }
    
    const status = reviewItem.completed ? ' ✅' : '';
    descriptions.push(`${description} (${reviewItem.date} ${dayOfWeek})${status}`);
  });
  
  return descriptions.join(', ');
};

/**
 * 다음 복습 일정 가져오기 (현재 날짜 기준)
 * @param {Array} reviewSchedule - 복습 일정 객체 배열
 * @returns {string|null} 다음 복습 날짜 (YYYY-MM-DD) 또는 null
 */
const getNextReviewDate = (reviewSchedule) => {
  if (!reviewSchedule || reviewSchedule.length === 0) {
    return null;
  }
  
  // 마이그레이션
  const migratedSchedule = migrateReviewSchedule(reviewSchedule);
  
  const today = new Date().toISOString().split('T')[0];
  const futureReviews = migratedSchedule
    .filter(item => !item.completed && item.date > today)
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return futureReviews.length > 0 ? futureReviews[0].date : null;
};

/**
 * 특정 복습 일정을 완료로 표시
 * @param {Array} reviewSchedule - 복습 일정 객체 배열
 * @param {string} reviewId - 완료할 복습 ID
 * @returns {Array} 업데이트된 복습 일정
 */
const markReviewCompleted = (reviewSchedule, reviewId) => {
  if (!reviewSchedule || reviewSchedule.length === 0) {
    return reviewSchedule;
  }
  
  const migratedSchedule = migrateReviewSchedule(reviewSchedule);
  
  return migratedSchedule.map(item => {
    if (item.id === reviewId) {
      return {
        ...item,
        completed: true,
        completedAt: new Date().toISOString()
      };
    }
    return item;
  });
};

/**
 * 특정 복습 일정을 미완료로 표시
 * @param {Array} reviewSchedule - 복습 일정 객체 배열
 * @param {string} reviewId - 미완료로 변경할 복습 ID
 * @returns {Array} 업데이트된 복습 일정
 */
const markReviewIncomplete = (reviewSchedule, reviewId) => {
  if (!reviewSchedule || reviewSchedule.length === 0) {
    return reviewSchedule;
  }
  
  const migratedSchedule = migrateReviewSchedule(reviewSchedule);
  
  return migratedSchedule.map(item => {
    if (item.id === reviewId) {
      return {
        ...item,
        completed: false,
        completedAt: null
      };
    }
    return item;
  });
};

/**
 * 모든 복습이 완료되었는지 확인
 * @param {Array} reviewSchedule - 복습 일정 객체 배열
 * @returns {boolean} 모든 복습 완료 여부
 */
const isAllReviewsCompleted = (reviewSchedule) => {
  if (!reviewSchedule || reviewSchedule.length === 0) {
    return false;
  }
  
  const migratedSchedule = migrateReviewSchedule(reviewSchedule);
  return migratedSchedule.every(item => item.completed);
};

/**
 * 완료된 복습 개수 확인
 * @param {Array} reviewSchedule - 복습 일정 객체 배열
 * @returns {number} 완료된 복습 개수
 */
const getCompletedReviewCount = (reviewSchedule) => {
  if (!reviewSchedule || reviewSchedule.length === 0) {
    return 0;
  }
  
  const migratedSchedule = migrateReviewSchedule(reviewSchedule);
  return migratedSchedule.filter(item => item.completed).length;
};

/**
 * 복습 완료 시 다음 복습 일정으로 업데이트 (기존 호환성용)
 * @param {Array} currentSchedule - 현재 복습 일정
 * @param {string} completedDate - 완료된 복습 날짜
 * @returns {Array} 업데이트된 복습 일정
 */
const updateReviewScheduleAfterCompletion = (currentSchedule, completedDate) => {
  if (!currentSchedule || currentSchedule.length === 0) {
    return [];
  }
  
  const migratedSchedule = migrateReviewSchedule(currentSchedule);
  
  // 완료된 날짜 이후의 일정만 남기기
  return migratedSchedule.filter(item => item.date > completedDate);
};

// 환경에 따른 exports 처리
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 환경 - CommonJS
  module.exports = {
    generateReviewSchedule,
    getReviewScheduleDescription,
    getNextReviewDate,
    updateReviewScheduleAfterCompletion,
    migrateReviewSchedule,
    markReviewCompleted,
    markReviewIncomplete,
    isAllReviewsCompleted,
    getCompletedReviewCount,
    FORGETTING_CURVE_INTERVALS
  };
} else if (typeof window !== 'undefined') {
  // 브라우저 환경 - 전역 객체로 노출
  window.reviewScheduler = {
    generateReviewSchedule,
    getReviewScheduleDescription,
    getNextReviewDate,
    updateReviewScheduleAfterCompletion,
    migrateReviewSchedule,
    markReviewCompleted,
    markReviewIncomplete,
    isAllReviewsCompleted,
    getCompletedReviewCount,
    FORGETTING_CURVE_INTERVALS
  };
}

// ES Module exports (for bundlers like Vite/Webpack)
export {
  generateReviewSchedule,
  getReviewScheduleDescription,
  getNextReviewDate,
  updateReviewScheduleAfterCompletion,
  migrateReviewSchedule,
  markReviewCompleted,
  markReviewIncomplete,
  isAllReviewsCompleted,
  getCompletedReviewCount,
  FORGETTING_CURVE_INTERVALS
};

export default {
  generateReviewSchedule,
  getReviewScheduleDescription,
  getNextReviewDate,
  updateReviewScheduleAfterCompletion,
  migrateReviewSchedule,
  markReviewCompleted,
  markReviewIncomplete,
  isAllReviewsCompleted,
  getCompletedReviewCount,
  FORGETTING_CURVE_INTERVALS
};