const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");

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

// 파일 저장 IPC 핸들러
ipcMain.handle("save-session", async (event, sessionData) => {
  const userDataPath = app.getPath("userData");
  const sessionsPath = path.join(userDataPath, "sessions");

  if (!fs.existsSync(sessionsPath)) {
    fs.mkdirSync(sessionsPath, { recursive: true });
  }

  const sessionFolder = path.join(sessionsPath, sessionData.id);
  if (!fs.existsSync(sessionFolder)) {
    fs.mkdirSync(sessionFolder, { recursive: true });
  }

  const mdContent = `# Study Session - ${sessionData.date}

## 시간
- 시작: ${sessionData.start}
- 종료: ${sessionData.end || "진행중"}

## 목표
### 사전 목표
${sessionData.goal_pre}

### 사후 평가
${sessionData.goal_post}

## 성과
${sessionData.outcomes}

## 통계
- EFT: ${sessionData.eft_calculated}분 (집중도: ${sessionData.eft_factor})
- 기분/에너지: ${sessionData.mood_energy}/5

## 방해 요소
${sessionData.distractions}

## 다음 과제
${sessionData.next_first_task}

## 복습 예정일
${sessionData.review_due}
`;

  fs.writeFileSync(
    path.join(sessionFolder, "session-data.md"),
    mdContent,
    "utf8",
  );

  fs.writeFileSync(
    path.join(sessionFolder, "data.json"),
    JSON.stringify(sessionData, null, 2),
    "utf8",
  );

  return { success: true, path: sessionFolder };
});

// 파일 첨부 IPC 핸들러
ipcMain.handle("attach-file", async (event, sessionId) => {
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
    const sessionsPath = path.join(userDataPath, "sessions");
    const sessionFolder = path.join(sessionsPath, sessionId);
    const attachmentsFolder = path.join(sessionFolder, "attachments");

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
        relativePath: path.join("attachments", uniqueFileName),
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
ipcMain.handle("remove-attachment", async (event, sessionId, fileName) => {
  try {
    const userDataPath = app.getPath("userData");
    const sessionsPath = path.join(userDataPath, "sessions");
    const filePath = path.join(sessionsPath, sessionId, "attachments", fileName);

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
ipcMain.handle("open-attachment", async (event, sessionId, fileName) => {
  try {
    const userDataPath = app.getPath("userData");
    const sessionsPath = path.join(userDataPath, "sessions");
    const filePath = path.join(sessionsPath, sessionId, "attachments", fileName);

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
