const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 세션 저장
  saveSession: (sessionData) => ipcRenderer.invoke("save-session", sessionData),
  
  // 파일 첨부
  attachFile: (sessionId) => ipcRenderer.invoke("attach-file", sessionId),
  
  // 첨부파일 제거
  removeAttachment: (sessionId, fileName) => 
    ipcRenderer.invoke("remove-attachment", sessionId, fileName),
  
  // 첨부파일 열기
  openAttachment: (sessionId, fileName) => 
    ipcRenderer.invoke("open-attachment", sessionId, fileName),
});