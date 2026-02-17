// js/semester.ts

// 宣告來自 data.ts 的函式
declare function saveData(): void;
declare function loadSemesterData(sem: string): void;
declare function refreshUI(): void;
declare function initDefaultData(): void;

// 渲染學期選單
function renderSemesterOptions(): void {
    const select = document.getElementById('semester-select') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '';
    
    // semesterList 來自 state.ts
    semesterList.forEach(sem => {
        const opt = document.createElement('option');
        opt.value = sem;
        opt.innerText = sem;
        if (sem === currentSemester) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
}

// 切換學期
function switchSemester(): void {
    const select = document.getElementById('semester-select') as HTMLSelectElement;
    if (select) {
        const newSem = select.value;
        // currentSemester 來自 state.ts
        currentSemester = newSem;
        
        loadSemesterData(currentSemester);
        saveData(); // 儲存當前選擇的學期
        refreshUI();
        
        showAlert(`已切換至 ${newSem} 學期`);
    }
}

// 新增學期
function addNewSemester(): void {
    showPrompt("請輸入新學期名稱 (例如: 115-1)", "", "新增學期")
    .then((name) => {
        if (name) {
            if (semesterList.includes(name)) {
                showAlert("該學期名稱已存在！", "錯誤");
                return;
            }
            semesterList.push(name);
            semesterList.sort(); // 簡單排序
            
            // 切換到新學期
            currentSemester = name;
            
            // 在 allData 初始化結構 (allData 來自 state.ts)
            allData[name] = {
                schedule: JSON.parse(JSON.stringify(defaultSchedule)), // defaultSchedule 來自 state.ts
                grades: [],
                calendarEvents: [],
                accounting: [],
                notes: []
            };

            loadSemesterData(name);
            saveData();
            refreshUI();
            
            showAlert(`學期 ${name} 建立成功！`);
        }
    });
}

// 重新命名學期
function editSemester(): void {
    showPrompt("重新命名目前學期:", currentSemester, "編輯學期")
    .then((newName) => {
        if (newName && newName !== currentSemester) {
            if (semesterList.includes(newName)) {
                showAlert("該名稱已存在！", "錯誤");
                return;
            }

            // 更新列表
            const idx = semesterList.indexOf(currentSemester);
            if (idx > -1) semesterList[idx] = newName;
            
            // 搬移資料
            allData[newName] = allData[currentSemester];
            delete allData[currentSemester];
            
            currentSemester = newName;
            semesterList.sort();
            
            saveData();
            refreshUI();
            showAlert("學期名稱已更新。");
        }
    });
}

// 刪除學期
function deleteSemester(): void {
    if (semesterList.length <= 1) {
        showAlert("這已經是最後一個學期檔案，無法刪除。", "無法刪除");
        return;
    }

    showConfirm(`確定要刪除 ${currentSemester} 學期嗎？\n資料刪除後無法復原！`, "刪除確認")
    .then((isConfirmed) => {
        if (isConfirmed) {
            delete allData[currentSemester];
            
            const idx = semesterList.indexOf(currentSemester);
            if (idx > -1) semesterList.splice(idx, 1);
            
            // 刪除後自動切換到第一個
            currentSemester = semesterList[0];
            loadSemesterData(currentSemester);
            
            saveData();
            refreshUI();
            showAlert("學期檔案已刪除。");
        }
    });
}

// 學期日期設定
function toggleSemesterEdit(): void {
    const viewMode = document.getElementById('semester-date-view-mode');
    const editMode = document.getElementById('semester-date-edit-mode');
    const btn = document.getElementById('btn-edit-semester-dates');
    
    if (viewMode && editMode && btn) {
        if (editMode.style.display === 'none') {
            // 進入編輯模式
            editMode.style.display = 'block';
            viewMode.style.display = 'none';
            btn.style.display = 'none';
            
            // 填入現有值 (semesterStartDate, semesterEndDate 來自 state.ts)
            const inputStart = document.getElementById('setting-sem-start') as HTMLInputElement;
            const inputEnd = document.getElementById('setting-sem-end') as HTMLInputElement;
            
            if (inputStart) inputStart.value = semesterStartDate;
            if (inputEnd) inputEnd.value = semesterEndDate;
            
        } else {
            // 取消
            editMode.style.display = 'none';
            viewMode.style.display = 'block';
            btn.style.display = 'block';
        }
    }
}

function saveSemesterDates(): void {
    const inputStart = document.getElementById('setting-sem-start') as HTMLInputElement;
    const inputEnd = document.getElementById('setting-sem-end') as HTMLInputElement;
    
    if (inputStart && inputEnd) {
        semesterStartDate = inputStart.value;
        semesterEndDate = inputEnd.value;
        
        saveData();
        renderSemesterSettings(); // 重新渲染日期顯示
        toggleSemesterEdit(); // 關閉編輯模式
        
        // 如果有開通知，重新啟動檢查
        if (typeof startCourseChecker === 'function') {
            startCourseChecker();
        }
    }
}

function renderSemesterSettings(): void {
    const textStart = document.getElementById('text-sem-start');
    const textEnd = document.getElementById('text-sem-end');
    const statusText = document.getElementById('semester-status-text');
    
    if (textStart) textStart.innerText = semesterStartDate || "未設定";
    if (textEnd) textEnd.innerText = semesterEndDate || "未設定";
    
    // 計算週次
    if (semesterStartDate && statusText) {
        const start = new Date(semesterStartDate);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        const weeks = Math.ceil(diff / (1000 * 60 * 60 * 24 * 7));
        
        if (weeks > 0 && weeks <= 20) {
            statusText.innerText = `目前是第 ${weeks} 週`;
        } else if (weeks <= 0) {
            statusText.innerText = `還有 ${Math.abs(Math.floor(diff / (1000 * 60 * 60 * 24)))} 天開學`;
        } else {
            statusText.innerText = "學期已結束";
        }
    }
}