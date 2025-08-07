/**
 * 세션 파일 저장/로드 서비스
 */

const fs = require('fs');
const path = require('path');
const { 
  getDatePaths, 
  getSessionFilePath, 
  getAttachmentFolderPath,
  aggregateTagFreq,
  getWeekId 
} = require('../utils/fileSystem');
const { withLock, getMetadataLockPath, cleanupStaleLock } = require('../utils/lockManager');

/**
 * 날짜별 폴더 구조 확인/생성
 * @param {string} userDataPath - 사용자 데이터 경로
 * @param {string} date - 날짜 (YYYY-MM-DD)
 * @returns {Object} 생성된 경로 정보
 */
const ensureDateFolder = (userDataPath, date) => {
  const paths = getDatePaths(userDataPath, date);
  
  // 필요한 폴더들 생성
  [paths.dateFolder, paths.sessionsFolder, paths.attachmentsFolder].forEach(folderPath => {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  });
  
  return paths;
};

/**
 * 메타데이터 읽기
 * @param {string} metadataPath - metadata.json 경로
 * @returns {Object} 메타데이터 객체
 */
const readMetadata = (metadataPath) => {
  try {
    if (!fs.existsSync(metadataPath)) {
      return null;
    }
    
    const content = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading metadata:', error);
    return null;
  }
};

/**
 * 메타데이터 생성/업데이트
 * @param {string} metadataPath - metadata.json 경로
 * @param {string} date - 날짜
 * @param {Object[]} sessions - 세션 배열
 */
const writeMetadata = (metadataPath, date, sessions) => {
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const tagFreq = aggregateTagFreq(sessions);
  const weekId = getWeekId(date);
  
  const metadata = {
    date,
    weekId,
    total: sessions.length,
    completed: completedSessions.length,
    sessionIds: sessions.map(s => s.id),
    tagFreq
  };
  
  // 원자적 쓰기: 임시파일 → 이름변경
  const tempPath = metadataPath + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(metadata, null, 2), 'utf8');
  fs.renameSync(tempPath, metadataPath);
};

/**
 * 날짜별 세션 로드
 * @param {string} userDataPath - 사용자 데이터 경로
 * @param {string} date - 날짜 (YYYY-MM-DD)
 * @returns {Object[]} 세션 배열
 */
export const loadDateSessions = (userDataPath, date) => {
  const paths = getDatePaths(userDataPath, date);
  
  if (!fs.existsSync(paths.dateFolder)) {
    return [];
  }
  
  try {
    const metadata = readMetadata(paths.metadataPath);
    if (!metadata || !metadata.sessionIds) {
      return [];
    }
    
    const sessions = [];
    
    for (const sessionId of metadata.sessionIds) {
      const sessionPath = getSessionFilePath(paths.sessionsFolder, sessionId);
      
      if (fs.existsSync(sessionPath)) {
        const content = fs.readFileSync(sessionPath, 'utf8');
        const session = JSON.parse(content);
        sessions.push(session);
      } else {
        console.warn(`Session file not found: ${sessionPath}`);
      }
    }
    
    return sessions;
  } catch (error) {
    console.error('Error loading date sessions:', error);
    return [];
  }
};

/**
 * 세션 저장
 * @param {string} userDataPath - 사용자 데이터 경로
 * @param {Object} session - 세션 데이터
 * @returns {Promise<{success: boolean, sessionId: string}>} 저장 결과
 */
export const saveSession = async (userDataPath, session) => {
  const date = session.date;
  const sessionId = session.id;
  
  try {
    // 1. 폴더 구조 확인/생성
    const paths = ensureDateFolder(userDataPath, date);
    const lockPath = getMetadataLockPath(paths.dateFolder);
    
    // 오래된 락 파일 정리
    cleanupStaleLock(lockPath);
    
    // 2. 락과 함께 저장 작업 실행
    await withLock(lockPath, async () => {
      // 2.1 세션 JSON 저장
      const sessionPath = getSessionFilePath(paths.sessionsFolder, sessionId);
      const tempSessionPath = sessionPath + '.tmp';
      
      fs.writeFileSync(tempSessionPath, JSON.stringify(session, null, 2), 'utf8');
      fs.renameSync(tempSessionPath, sessionPath);
      
      // 2.2 첨부파일 폴더 생성 (필요한 경우)
      if (session.attachments && session.attachments.length > 0) {
        const attachmentFolder = getAttachmentFolderPath(paths.attachmentsFolder, sessionId);
        if (!fs.existsSync(attachmentFolder)) {
          fs.mkdirSync(attachmentFolder, { recursive: true });
        }
      }
      
      // 2.3 현재 세션 목록 읽기
      const existingSessions = loadDateSessions(userDataPath, date);
      
      // 2.4 세션 업데이트 또는 추가
      const sessionIndex = existingSessions.findIndex(s => s.id === sessionId);
      if (sessionIndex >= 0) {
        existingSessions[sessionIndex] = session;
      } else {
        existingSessions.push(session);
      }
      
      // 2.5 메타데이터 갱신
      writeMetadata(paths.metadataPath, date, existingSessions);
    });
    
    return { success: true, sessionId };
  } catch (error) {
    console.error('Error saving session:', error);
    return { success: false, error: error.message, sessionId };
  }
};

/**
 * 세션 삭제
 * @param {string} userDataPath - 사용자 데이터 경로
 * @param {string} sessionId - 세션 ID
 * @param {string} date - 날짜 (YYYY-MM-DD)
 * @returns {Promise<{success: boolean}>} 삭제 결과
 */
export const deleteSession = async (userDataPath, sessionId, date) => {
  try {
    const paths = getDatePaths(userDataPath, date);
    const lockPath = getMetadataLockPath(paths.dateFolder);
    
    if (!fs.existsSync(paths.dateFolder)) {
      return { success: false, error: 'Date folder not found' };
    }
    
    // 오래된 락 파일 정리
    cleanupStaleLock(lockPath);
    
    await withLock(lockPath, async () => {
      // 1. 세션 파일 삭제
      const sessionPath = getSessionFilePath(paths.sessionsFolder, sessionId);
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
      }
      
      // 2. 첨부파일 폴더 삭제
      const attachmentFolder = getAttachmentFolderPath(paths.attachmentsFolder, sessionId);
      if (fs.existsSync(attachmentFolder)) {
        // 폴더 내 모든 파일 삭제
        const files = fs.readdirSync(attachmentFolder);
        files.forEach(file => {
          fs.unlinkSync(path.join(attachmentFolder, file));
        });
        fs.rmdirSync(attachmentFolder);
      }
      
      // 3. 현재 세션 목록 읽기 및 필터링
      const sessions = loadDateSessions(userDataPath, date).filter(s => s.id !== sessionId);
      
      // 4. 메타데이터 갱신
      writeMetadata(paths.metadataPath, date, sessions);
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 날짜별 메타데이터만 로드 (성능 최적화)
 * @param {string} userDataPath - 사용자 데이터 경로
 * @param {string} date - 날짜 (YYYY-MM-DD)
 * @returns {Object|null} 메타데이터 또는 null
 */
export const loadDateMetadata = (userDataPath, date) => {
  const paths = getDatePaths(userDataPath, date);
  return readMetadata(paths.metadataPath);
};

/**
 * 여러 날짜의 메타데이터 일괄 로드
 * @param {string} userDataPath - 사용자 데이터 경로
 * @param {string[]} dates - 날짜 배열
 * @returns {Object} 날짜별 메타데이터 맵
 */
export const loadMultipleMetadata = (userDataPath, dates) => {
  const result = {};
  
  dates.forEach(date => {
    const metadata = loadDateMetadata(userDataPath, date);
    if (metadata) {
      result[date] = metadata;
    }
  });
  
  return result;
};