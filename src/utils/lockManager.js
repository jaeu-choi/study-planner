/**
 * 파일 락 관리 유틸리티
 * metadata.json 동시 접근 방지
 */

const fs = require('fs');
const path = require('path');

/**
 * 락 파일 획득 시도
 * @param {string} lockPath - 락 파일 경로
 * @returns {number|null} 파일 디스크립터 또는 null (실패시)
 */
const tryAcquireLock = (lockPath) => {
  try {
    // 'wx' 플래그: 파일이 존재하지 않을 때만 생성, 배타적 접근
    const fd = fs.openSync(lockPath, 'wx');
    return fd;
  } catch (error) {
    if (error.code === 'EEXIST') {
      // 락 파일이 이미 존재함 (다른 프로세스가 사용 중)
      return null;
    }
    throw error; // 다른 종류의 에러는 다시 던짐
  }
};

/**
 * 락 해제
 * @param {string} lockPath - 락 파일 경로
 * @param {number} fd - 파일 디스크립터
 */
const releaseLock = (lockPath, fd) => {
  try {
    if (fd !== null && fd !== undefined) {
      fs.closeSync(fd);
    }
  } catch (error) {
    console.warn('Lock file close warning:', error.message);
  }
  
  try {
    fs.unlinkSync(lockPath);
  } catch (error) {
    console.warn('Lock file unlink warning:', error.message);
  }
};

/**
 * 락 획득 (재시도 포함)
 * @param {string} lockPath - 락 파일 경로
 * @param {number} maxRetries - 최대 재시도 횟수 (기본: 20)
 * @param {number} retryDelay - 재시도 간격 ms (기본: 50)
 * @returns {Promise<number>} 파일 디스크립터
 */
export const acquireLock = async (lockPath, maxRetries = 20, retryDelay = 50) => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    const fd = tryAcquireLock(lockPath);
    if (fd !== null) {
      return fd;
    }
    
    attempts++;
    
    // 마지막 시도가 아니면 대기
    if (attempts < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw new Error(`Failed to acquire lock after ${maxRetries} attempts: ${lockPath}`);
};

/**
 * 락과 함께 작업 실행 (자동 해제 보장)
 * @param {string} lockPath - 락 파일 경로
 * @param {Function} callback - 실행할 작업 함수
 * @param {number} maxRetries - 최대 재시도 횟수
 * @param {number} retryDelay - 재시도 간격 ms
 * @returns {Promise<any>} 콜백 함수의 반환값
 */
export const withLock = async (lockPath, callback, maxRetries = 20, retryDelay = 50) => {
  let fd = null;
  
  try {
    fd = await acquireLock(lockPath, maxRetries, retryDelay);
    return await callback();
  } finally {
    if (fd !== null) {
      releaseLock(lockPath, fd);
    }
  }
};

/**
 * 메타데이터 락 경로 생성
 * @param {string} dateFolder - 날짜 폴더 경로
 * @returns {string} 락 파일 경로
 */
export const getMetadataLockPath = (dateFolder) => {
  return path.join(dateFolder, '.metadata.lock');
};

/**
 * 오래된 락 파일 정리 (프로세스 비정상 종료 시 대비)
 * @param {string} lockPath - 락 파일 경로
 * @param {number} maxAge - 최대 보관 시간 (밀리초, 기본: 30초)
 */
export const cleanupStaleLock = (lockPath, maxAge = 30000) => {
  try {
    const stats = fs.statSync(lockPath);
    const age = Date.now() - stats.mtime.getTime();
    
    if (age > maxAge) {
      console.warn(`Removing stale lock file: ${lockPath} (age: ${age}ms)`);
      fs.unlinkSync(lockPath);
    }
  } catch (error) {
    // 파일이 없거나 접근할 수 없으면 무시
    if (error.code !== 'ENOENT') {
      console.warn('Error checking stale lock:', error.message);
    }
  }
};