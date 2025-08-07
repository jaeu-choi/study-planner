const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { saveSession, deleteSession, loadDateSessions } = require('./src/services/sessionStorage');
const { generateSessionId } = require('./src/utils/fileSystem');
const { getAttachmentFolderPath, getDatePaths } = require('./src/utils/fileSystem');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // 개발 모드에서는 localhost:5173, 프로덕션에서는 dist/index.html
  if (process.env.NODE_ENV !== "production") {
    // 개발 모드
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // 프로덕션 모드
    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 세션 저장 IPC 핸들러
ipcMain.handle("save-session", async (event, sessionData) => {
  try {
    const userDataPath = app.getPath("userData");
    
    // 세션 ID가 없으면 새로 생성
    if (!sessionData.id) {
      sessionData.id = generateSessionId();
    }
    
    // 날짜가 없으면 오늘 날짜로 설정
    if (!sessionData.date) {
      sessionData.date = new Date().toISOString().split('T')[0];
    }
    
    const result = await saveSession(userDataPath, sessionData);
    return result;
  } catch (error) {
    console.error('세션 저장 오류:', error);
    return { success: false, error: error.message };
  }
});

// 날짜별 세션 로드 IPC 핸들러
ipcMain.handle("load-date-sessions", async (event, date) => {
  try {
    const userDataPath = app.getPath("userData");
    const sessions = loadDateSessions(userDataPath, date);
    return { success: true, sessions };
  } catch (error) {
    console.error('세션 로드 오류:', error);
    return { success: false, error: error.message, sessions: [] };
  }
});

// 세션 삭제 IPC 핸들러
ipcMain.handle("delete-session", async (event, sessionId, date) => {
  try {
    const userDataPath = app.getPath("userData");
    const result = await deleteSession(userDataPath, sessionId, date);
    return result;
  } catch (error) {
    console.error('세션 삭제 오류:', error);
    return { success: false, error: error.message };
  }
});

// 파일 첨부 IPC 핸들러
ipcMain.handle("attach-file", async (event, sessionId, date) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "이미지", extensions: ["jpg", "jpeg", "png", "gif", "bmp", "webp"] },
        { name: "문서", extensions: ["pdf", "doc", "docx", "txt", "md"] },
        { name: "모든 파일", extensions: ["*"] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, message: "파일이 선택되지 않았습니다." };
    }

    const userDataPath = app.getPath("userData");
    const paths = getDatePaths(userDataPath, date);
    const attachmentsFolder = getAttachmentFolderPath(paths.attachmentsFolder, sessionId);

    // 첨부파일 폴더 생성
    if (!fs.existsSync(attachmentsFolder)) {
      fs.mkdirSync(attachmentsFolder, { recursive: true });
    }

    const attachedFiles = [];

    for (const filePath of result.filePaths) {
      const fileName = path.basename(filePath);
      const timestamp = Date.now();
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);
      const uniqueFileName = `${nameWithoutExt}_${timestamp}${ext}`;
      const destinationPath = path.join(attachmentsFolder, uniqueFileName);

      // 파일 복사
      fs.copyFileSync(filePath, destinationPath);

      attachedFiles.push({
        id: timestamp.toString(),
        originalName: fileName,
        fileName: uniqueFileName,
        path: destinationPath,
        relativePath: path.relative(paths.dateFolder, destinationPath),
        size: fs.statSync(filePath).size,
        type: ext.toLowerCase(),
        attachedAt: new Date().toISOString(),
      });
    }

    return { success: true, files: attachedFiles };
  } catch (error) {
    console.error("파일 첨부 오류:", error);
    return { success: false, message: "파일 첨부 중 오류가 발생했습니다." };
  }
});

// 첨부파일 삭제 IPC 핸들러
ipcMain.handle("remove-attachment", async (event, sessionId, fileName, date) => {
  try {
    const userDataPath = app.getPath("userData");
    const paths = getDatePaths(userDataPath, date);
    const attachmentsFolder = getAttachmentFolderPath(paths.attachmentsFolder, sessionId);
    const filePath = path.join(attachmentsFolder, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    } else {
      return { success: false, message: "파일을 찾을 수 없습니다." };
    }
  } catch (error) {
    console.error("파일 삭제 오류:", error);
    return { success: false, message: "파일 삭제 중 오류가 발생했습니다." };
  }
});

// 첨부파일 열기 IPC 핸들러
ipcMain.handle("open-attachment", async (event, sessionId, fileName, date) => {
  try {
    const userDataPath = app.getPath("userData");
    const paths = getDatePaths(userDataPath, date);
    const attachmentsFolder = getAttachmentFolderPath(paths.attachmentsFolder, sessionId);
    const filePath = path.join(attachmentsFolder, fileName);

    if (fs.existsSync(filePath)) {
      await shell.openPath(filePath);
      return { success: true };
    } else {
      return { success: false, message: "파일을 찾을 수 없습니다." };
    }
  } catch (error) {
    console.error("파일 열기 오류:", error);
    return { success: false, message: "파일 열기 중 오류가 발생했습니다." };
  }
});
