/**
 * 파일시스템 관련 유틸리티 함수들
 */

/**
 * 세션 ID 생성 (YYYYMMDD-HHmmss-rand4 형식)
 * @returns {string} 생성된 세션 ID
 */
export const generateSessionId = () => {
  const now = new Date();
  
  // YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // HHmmss
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}${minutes}${seconds}`;
  
  // rand4 (0000-9999)
  const rand4 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${dateStr}-${timeStr}-${rand4}`;
};

/**
 * 태그 정규화 함수
 * @param {string} tag - 정규화할 태그
 * @returns {string} 정규화된 태그
 */
export const normalize = (tag) => {
  if (!tag || typeof tag !== 'string') return '';
  return tag.trim().replace(/\s+/g, ' ').toLowerCase();
};

/**
 * 주차 ID 계산 (월요일 기준, ISO 8601 방식)
 * @param {string|Date} date - 날짜 (YYYY-MM-DD 또는 Date 객체)
 * @returns {string} 주차 ID (YYYY-W##)
 */
export const getWeekId = (date) => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
  
  // ISO 8601 주차 계산
  const year = d.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  
  // 1월 1일이 몇 요일인지 확인 (0=일요일, 1=월요일)
  const startDay = startOfYear.getDay();
  
  // 첫 번째 월요일까지의 일수
  const daysToFirstMonday = startDay === 0 ? 1 : (8 - startDay);
  
  // 첫 번째 월요일 날짜
  const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
  
  // 입력된 날짜가 첫 번째 월요일 이전인 경우
  if (d < firstMonday) {
    // 전년도 마지막 주차 계산
    return getWeekId(new Date(year - 1, 11, 31));
  }
  
  // 첫 번째 월요일로부터 몇 일이 지났는지 계산
  const diffDays = Math.floor((d - firstMonday) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.floor(diffDays / 7) + 1;
  
  // 53주차를 넘어가는 경우 다음해 1주차로 처리
  if (weekNumber > 52) {
    const nextYear = year + 1;
    return `${nextYear}-W01`;
  }
  
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
};

/**
 * 해시태그 문자열에서 태그 배열 추출 및 정규화
 * @param {string} hashtagsString - 해시태그 문자열 (예: "#수학 #미적분 #연습")
 * @returns {string[]} 정규화된 태그 배열
 */
export const extractTags = (hashtagsString) => {
  if (!hashtagsString || typeof hashtagsString !== 'string') return [];
  
  return hashtagsString
    .split(/\s+/)
    .filter(tag => tag.startsWith('#'))
    .map(tag => normalize(tag.substring(1))) // # 제거 후 정규화
    .filter(tag => tag.length > 0);
};

/**
 * 태그 빈도수 계산
 * @param {string[]} tags - 태그 배열
 * @returns {Object} 태그별 빈도수 객체
 */
export const calculateTagFreq = (tags) => {
  const freq = {};
  tags.forEach(tag => {
    const normalized = normalize(tag);
    if (normalized) {
      freq[normalized] = (freq[normalized] || 0) + 1;
    }
  });
  return freq;
};

/**
 * 여러 세션의 태그 빈도수 합산
 * @param {Object[]} sessions - 세션 배열
 * @returns {Object} 전체 태그 빈도수
 */
export const aggregateTagFreq = (sessions) => {
  const totalFreq = {};
  
  sessions.forEach(session => {
    if (session.hashtags) {
      const tags = extractTags(session.hashtags);
      tags.forEach(tag => {
        const normalized = normalize(tag);
        if (normalized) {
          totalFreq[normalized] = (totalFreq[normalized] || 0) + 1;
        }
      });
    }
  });
  
  return totalFreq;
};

/**
 * 날짜별 폴더 경로 생성
 * @param {string} userDataPath - 사용자 데이터 경로
 * @param {string} date - 날짜 (YYYY-MM-DD)
 * @returns {Object} 경로 정보 객체
 */
export const getDatePaths = (userDataPath, date) => {
  const path = require('path');
  
  const dateFolder = path.join(userDataPath, 'sessions', date);
  const sessionsFolder = path.join(dateFolder, 'sessions');
  const attachmentsFolder = path.join(dateFolder, 'attachments');
  const metadataPath = path.join(dateFolder, 'metadata.json');
  
  return {
    dateFolder,
    sessionsFolder,
    attachmentsFolder,
    metadataPath
  };
};

/**
 * 세션 파일 경로 생성
 * @param {string} sessionsFolder - 세션 폴더 경로
 * @param {string} sessionId - 세션 ID
 * @returns {string} 세션 파일 경로
 */
export const getSessionFilePath = (sessionsFolder, sessionId) => {
  const path = require('path');
  return path.join(sessionsFolder, `session-${sessionId}.json`);
};

/**
 * 첨부파일 폴더 경로 생성
 * @param {string} attachmentsFolder - 첨부파일 루트 폴더
 * @param {string} sessionId - 세션 ID
 * @returns {string} 세션별 첨부파일 폴더 경로
 */
export const getAttachmentFolderPath = (attachmentsFolder, sessionId) => {
  const path = require('path');
  return path.join(attachmentsFolder, sessionId);
};