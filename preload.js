const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 세션 저장
  saveSession: (sessionData) => ipcRenderer.invoke("save-session", sessionData),
  
  // 날짜별 세션 로드
  loadDateSessions: (date) => ipcRenderer.invoke("load-date-sessions", date),
  
  // 세션 삭제
  deleteSession: (sessionId, date) => ipcRenderer.invoke("delete-session", sessionId, date),
  
  // 파일 첨부
  attachFile: (sessionId, date) => ipcRenderer.invoke("attach-file", sessionId, date),
  
  // 첨부파일 제거
  removeAttachment: (sessionId, fileName, date) => 
    ipcRenderer.invoke("remove-attachment", sessionId, fileName, date),
  
  // 첨부파일 열기
  openAttachment: (sessionId, fileName, date) => 
    ipcRenderer.invoke("open-attachment", sessionId, fileName, date),
  
  // 첨부파일 폴더 열기
  openAttachmentFolder: (sessionId, date) => 
    ipcRenderer.invoke("open-attachment-folder", sessionId, date),
});