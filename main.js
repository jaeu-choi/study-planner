const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
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
