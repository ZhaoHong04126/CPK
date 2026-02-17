// js/data.ts

// 1. 宣告外部 UI 渲染函式 (這些還在 js 檔裡，TS 需要知道它們存在)
// 為了簡化，我們暫時將它們宣告為 any 型別的變數，這樣最省事
declare const renderSemesterOptions: any;
declare const updateExamSubjectOptions: any;
declare const switchDay: any;
declare const loadGrades: any;
declare const renderRegularExams: any;
declare const renderMidtermExams: any;
declare const renderCalendar: any;
declare const renderWeeklyTable: any;
declare const renderAnalysis: any;
declare const renderCategorySettingsInputs: any;
declare const renderCreditSettings: any;
declare const renderAccounting: any;
declare const renderNotes: any;
declare const renderAnniversaries: any;
declare const renderSemesterSettings: any;
declare const renderLottery: any;
declare const renderNotificationApp: any;
declare const renderHomework: any;
declare const startCourseChecker: any;

// --- 資料存取核心 ---

function loadData() {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const dbKey = 'CampusKing_v6.0_' + uid;
    
    const savedData = localStorage.getItem(dbKey);
    if (savedData) {
        parseAndApplyData(JSON.parse(savedData));
    } else {
        initDefaultData();
    }

    if (navigator.onLine) {
        syncFromCloud(uid);
    }
    refreshUI();

    // 通知權限檢查
    if ("Notification" in window && Notification.permission === "granted") {
        if (typeof startCourseChecker === 'function') {
            startCourseChecker();
        }
    }
}

// 解析並應用資料 (這裡用 any，因為傳進來的資料結構可能很不固定)
function parseAndApplyData(parsed: any) {
    allData = parsed.allData || {}; 
    semesterList = parsed.semesterList || ["114-2"]; 
    userTitle = parsed.userTitle || (currentUser && currentUser.displayName ? currentUser.displayName : "同學");
    currentSemester = parsed.currentSemester || semesterList[0]; 
    graduationTarget = parsed.graduationTarget || 128; 
    
    if (parsed.paymentMethods) paymentMethods = parsed.paymentMethods;
    if (parsed.periodConfig) periodConfig = parsed.periodConfig; 
    if (parsed.userSchoolInfo) userSchoolInfo = parsed.userSchoolInfo;
    
    if (parsed.categoryTargets) {
        categoryTargets = parsed.categoryTargets;
    } else {
        categoryTargets = {}; 
    }

    if (parsed.notificationSettings) notificationSettings = parsed.notificationSettings;

    loadSemesterData(currentSemester);
}

function initDefaultData() {
    semesterList = ["114-1"]; 
    currentSemester = "114-2"; 
    allData = {
        "114-2": {
            schedule: JSON.parse(JSON.stringify(defaultSchedule)),
            grades: [],
            regularExams: {},
            midtermExams: {},
            calendarEvents: []
        }
    };
    loadSemesterData(currentSemester);
}

function syncFromCloud(uid: string) {
    const statusBtn = document.getElementById('user-badge');
    if(statusBtn) statusBtn.innerText = "同步中...";

    db.collection("users").doc(uid).get().then((doc: any) => {
        if (doc.exists) {
            const cloudData = doc.data();
            console.log("🔥 雲端資料已下載");
            
            parseAndApplyData(cloudData);
            
            const dbKey = 'CampusKing_v6.0_' + uid;
            localStorage.setItem(dbKey, JSON.stringify(cloudData));

            refreshUI();
            if(statusBtn) statusBtn.innerText = '學生';
        } else {
            console.log("☁️ 此帳號尚無雲端資料，將自動上傳本地資料...");
            saveData();
            if(statusBtn) statusBtn.innerText = '學生';
        }
    }).catch((error: any) => {
        console.error("同步失敗:", error);
        if(statusBtn) statusBtn.innerText = "離線";
    });
}

function saveData() {
    if (!currentUser) return;
    
    // 將目前操作中的變數寫回 allData
    allData[currentSemester] = { 
        schedule: weeklySchedule,
        lottery: lotteryList,
        grades: gradeList,
        regularExams: regularExams,
        midtermExams: midtermExams,
        calendarEvents: calendarEvents,
        accounting: accountingList,
        notes: quickNotes,
        anniversaries: anniversaryList,
        startDate: semesterStartDate,
        endDate: semesterEndDate,
        learning: learningList,
        notificationSettings: notificationSettings,
        homework: homeworkList,
    };

    const storageObj: any = {
        allData: allData,
        semesterList: semesterList,
        currentSemester: currentSemester,
        graduationTarget: graduationTarget,
        categoryTargets: categoryTargets,
        userSchoolInfo: userSchoolInfo,
        periodConfig: periodConfig,
        paymentMethods: paymentMethods,
        userTitle: userTitle,
        // 這裡需要 firebase 物件，firebase 已經在 firebase.ts 宣告過
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };

    const dbKey = 'CampusKing_v6.0_' + currentUser.uid;
    const localObj = JSON.parse(JSON.stringify(storageObj)); 
    delete localObj.lastUpdated; 
    localStorage.setItem(dbKey, JSON.stringify(localObj));

    db.collection("users").doc(currentUser.uid).set(storageObj, { merge: true })
    .then(() => {
        console.log("✅ 資料已備份至雲端");
    })
    .catch((error: any) => {
        console.error("❌ 雲端備份失敗: ", error);
    });

    refreshUI();
}

function refreshUI() {
    // 這裡使用 typeof 檢查是因為這些函式可能還沒載入 (雖然我們用了 declare 騙 TS 說有)
    // 實際上在瀏覽器執行時，這些 js 檔應該都已經載入了
    if (typeof renderSemesterOptions === 'function') renderSemesterOptions(); 
    if (typeof updateExamSubjectOptions === 'function') updateExamSubjectOptions();
    if (typeof switchDay === 'function') switchDay(currentDay); 
    if (typeof loadGrades === 'function') loadGrades(); 

    if (typeof renderRegularExams === 'function') renderRegularExams();
    if (typeof renderMidtermExams === 'function') renderMidtermExams();
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderWeeklyTable === 'function') renderWeeklyTable();
    if (typeof renderAnalysis === 'function') renderAnalysis();
    
    const targetInput = document.getElementById('setting-grad-target') as HTMLInputElement;
    if (targetInput) targetInput.value = String(graduationTarget);

    if (typeof renderCategorySettingsInputs === 'function') renderCategorySettingsInputs();
    if (typeof renderCreditSettings === 'function') renderCreditSettings();
    if (typeof renderAccounting === 'function') renderAccounting();
    if (typeof renderNotes === 'function') renderNotes();
    if (typeof renderAnniversaries === 'function') renderAnniversaries();
    if (typeof renderSemesterSettings === 'function') renderSemesterSettings();
    if (typeof renderLottery === 'function') renderLottery();
    if (typeof renderNotificationApp === 'function') renderNotificationApp();
    if (typeof renderHomework === 'function') renderHomework();
    if (typeof updateGradeCategoryOptions === 'function') (window as any).updateGradeCategoryOptions(); // 特例

    const nameDisplay = document.getElementById('user-name-display');
    if (nameDisplay) nameDisplay.innerText = userTitle;

    const settingName = document.getElementById('setting-user-title');
    if (settingName) settingName.innerText = userTitle;
}

function loadSemesterData(sem: string) {
    if (!allData[sem]) allData[sem] = {
        schedule: JSON.parse(JSON.stringify(defaultSchedule)),
        lottery: [], // 這裡簡化，實際上可能有 defaultLotteryData
        grades: [],
        regularExams: {},
        midtermExams: {},
        calendarEvents: [],
        accounting: [],
        notes: [],
        startDate: "",
        endDate: "",
        homework: [],
    };

    const semData = allData[sem];

    // 指派給全域變數 (來自 state.ts)
    weeklySchedule = semData.schedule;
    gradeList = semData.grades || [];
    regularExams = semData.regularExams || {};
    midtermExams = semData.midtermExams || {};
    calendarEvents = semData.calendarEvents || [];
    accountingList = semData.accounting || [];
    quickNotes = semData.notes || [];
    anniversaryList = semData.anniversaries || [];
    homeworkList = semData.homework || [];

    semesterStartDate = semData.startDate || "";
    semesterEndDate = semData.endDate || "";
    learningList = semData.learning || [];
    lotteryList = semData.lottery || []; // 注意這裡
}

// 設定頁功能
function updateCategorySettings(category: string, type: string, value: any) {
    const val = parseInt(value) || 0;
    if (typeof categoryTargets[category] === 'object') {
        const target = categoryTargets[category] as { "必修": number, "選修": number };
        if (type === '必修') target['必修'] = val;
        if (type === '選修') target['選修'] = val;
    } else {
        categoryTargets[category] = val;
    }
    saveData();
    if (typeof renderAnalysis === 'function') renderAnalysis();
}