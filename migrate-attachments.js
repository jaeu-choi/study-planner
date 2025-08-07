/**
 * 임시 첨부파일 경로를 올바른 세션 ID 경로로 이동하는 마이그레이션 스크립트
 * 
 * 사용법: node migrate-attachments.js
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Electron이 실행 중이 아닌 경우 수동으로 경로 설정
const getUserDataPath = () => {
  if (app && app.getPath) {
    return app.getPath('userData');
  }
  
  // macOS의 기본 경로
  const os = require('os');
  const platform = process.platform;
  
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'study-planner');
  } else if (platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Roaming', 'study-planner');
  } else {
    return path.join(os.homedir(), '.config', 'study-planner');
  }
};

const migrateAttachments = () => {
  const userDataPath = getUserDataPath();
  const sessionsDir = path.join(userDataPath, 'sessions');
  
  if (!fs.existsSync(sessionsDir)) {
    console.log('세션 디렉토리를 찾을 수 없습니다:', sessionsDir);
    return;
  }
  
  // 날짜별 폴더 순회
  const dates = fs.readdirSync(sessionsDir).filter(item => {
    const fullPath = path.join(sessionsDir, item);
    return fs.statSync(fullPath).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(item);
  });
  
  dates.forEach(date => {
    console.log(`\n날짜 ${date} 처리 중...`);
    
    const dateDir = path.join(sessionsDir, date);
    const sessionFilesDir = path.join(dateDir, 'sessions');
    const attachmentsDir = path.join(dateDir, 'attachments');
    
    if (!fs.existsSync(sessionFilesDir) || !fs.existsSync(attachmentsDir)) {
      console.log(`  세션 또는 첨부파일 디렉토리가 없습니다.`);
      return;
    }
    
    // 세션 파일들 처리
    const sessionFiles = fs.readdirSync(sessionFilesDir)
      .filter(file => file.startsWith('session-') && file.endsWith('.json'));
    
    sessionFiles.forEach(sessionFile => {
      const sessionPath = path.join(sessionFilesDir, sessionFile);
      
      try {
        const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        
        if (!sessionData.attachments || sessionData.attachments.length === 0) {
          return;
        }
        
        let hasChanges = false;
        const updatedAttachments = sessionData.attachments.map(attachment => {
          // temp-로 시작하는 경로를 찾아서 올바른 세션 ID로 교체
          if (attachment.path && attachment.path.includes('temp-')) {
            const oldTempPath = attachment.path;
            const fileName = path.basename(oldTempPath);
            
            // 새로운 올바른 경로 생성
            const newAttachmentDir = path.join(attachmentsDir, sessionData.id);
            const newPath = path.join(newAttachmentDir, fileName);
            const newRelativePath = `attachments/${sessionData.id}/${fileName}`;
            
            // 새 디렉토리 생성
            if (!fs.existsSync(newAttachmentDir)) {
              fs.mkdirSync(newAttachmentDir, { recursive: true });
              console.log(`  새 첨부파일 디렉토리 생성: ${newAttachmentDir}`);
            }
            
            // 파일 이동 (존재하는 경우)
            if (fs.existsSync(oldTempPath)) {
              try {
                fs.copyFileSync(oldTempPath, newPath);
                console.log(`  파일 이동: ${path.basename(oldTempPath)} -> ${sessionData.id}/`);
                hasChanges = true;
              } catch (error) {
                console.error(`  파일 이동 실패: ${error.message}`);
                return attachment; // 변경하지 않고 원래 attachment 반환
              }
            } else {
              console.log(`  원본 파일을 찾을 수 없음: ${oldTempPath}`);
            }
            
            // attachment 객체 업데이트
            return {
              ...attachment,
              path: newPath,
              relativePath: newRelativePath
            };
          }
          
          return attachment;
        });
        
        // 변경사항이 있으면 세션 파일 업데이트
        if (hasChanges) {
          const updatedSession = {
            ...sessionData,
            attachments: updatedAttachments
          };
          
          fs.writeFileSync(sessionPath, JSON.stringify(updatedSession, null, 2));
          console.log(`  세션 파일 업데이트: ${sessionFile}`);
        }
        
      } catch (error) {
        console.error(`  세션 파일 처리 오류 (${sessionFile}):`, error.message);
      }
    });
    
    // 빈 temp 디렉토리 제거
    try {
      const tempDirs = fs.readdirSync(attachmentsDir)
        .filter(dir => dir.startsWith('temp-'))
        .map(dir => path.join(attachmentsDir, dir))
        .filter(dir => fs.statSync(dir).isDirectory());
      
      tempDirs.forEach(tempDir => {
        const files = fs.readdirSync(tempDir);
        if (files.length === 0) {
          fs.rmdirSync(tempDir);
          console.log(`  빈 임시 디렉토리 제거: ${path.basename(tempDir)}`);
        } else {
          console.log(`  임시 디렉토리에 남은 파일들: ${path.basename(tempDir)} (${files.join(', ')})`);
        }
      });
    } catch (error) {
      console.error(`  임시 디렉토리 정리 오류:`, error.message);
    }
  });
  
  console.log('\n마이그레이션 완료!');
};

// 스크립트 실행
if (require.main === module) {
  console.log('첨부파일 경로 마이그레이션 시작...');
  migrateAttachments();
}

module.exports = { migrateAttachments };