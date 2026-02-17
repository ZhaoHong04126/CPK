// js/course.ts

// 宣告外部套件 (html2canvas)
declare const html2canvas: any;

// 宣告全域變數 (來自 state.ts, ui.ts, data.ts)
// 雖然在同一專案下 TS 應該看得到，但為了避免編輯器報錯，我們明確宣告需要的函式
declare function saveData(): void;
declare function openModal(id: string): void;
declare function closeModal(id: string): void;
declare function showAlert(msg: string, title?: string): Promise<void>;
declare function showConfirm(msg: string, title?: string): Promise<boolean>;
declare function selectColor(hex: string, el: HTMLElement): void; // 在 index.html 定義的

// 用來暫存「正在編輯」的那個格子資料 (星期, 節次)
let editingCell: { day: string, period: string } | null = null;

// 1. 切換課表模式 (本日/週課表)
function switchScheduleMode(mode: 'daily' | 'weekly'): void {
    const dailyView = document.getElementById('subview-sch-daily');
    const weeklyView = document.getElementById('subview-sch-weekly');
    const btnDaily = document.getElementById('btn-sch-daily');
    const btnWeekly = document.getElementById('btn-sch-weekly');

    if (dailyView && weeklyView && btnDaily && btnWeekly) {
        if (mode === 'daily') {
            dailyView.style.display = 'block';
            weeklyView.style.display = 'none';
            btnDaily.classList.add('active');
            btnWeekly.classList.remove('active');
        } else {
            dailyView.style.display = 'none';
            weeklyView.style.display = 'block';
            btnDaily.classList.remove('active');
            btnWeekly.classList.add('active');
            renderWeeklyTable(); // 切換過去時才渲染，節省資源
        }
    }
}

// 2. 切換「本日課程」的星期 (上方的一二三四五六日按鈕)
function switchDay(day: number): void {
    // currentDay 來自 state.ts
    currentDay = day;
    renderDailySchedule();
    
    // 更新按鈕樣式
    for (let i = 0; i <= 6; i++) {
        const btn = document.getElementById('tab-' + i);
        if (btn) {
            if (i === day) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    }

    const title = document.getElementById('schedule-title');
    const dayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
    if (title) title.innerText = `${dayNames[day]}課程`;
}

// 3. 渲染「本日課程」清單
function renderDailySchedule(): void {
    const tbody = document.getElementById('schedule-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    // weeklySchedule 來自 state.ts，key 是字串 '1'~'5' (週一到週五)，但 currentDay 是數字
    // 所以要轉成字串。注意：週日(0) 和 週六(6) 可能在 weeklySchedule 裡沒有預設 key
    const dayStr = String(currentDay);
    const courses = weeklySchedule[dayStr] || [];

    // 排序：依據節次 (period)
    courses.sort((a, b) => {
        // 簡單比較字串 (1 vs 2)，如果有 A, B 這種節次可能需要更複雜的邏輯
        return a.period.localeCompare(b.period, undefined, { numeric: true });
    });

    if (courses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999; padding:20px;">今天沒有課喔！好耶！🎉</td></tr>';
        return;
    }

    courses.forEach(course => {
        const tr = document.createElement('tr');
        // 加上顏色標記
        const colorStyle = course.color ? `border-left: 5px solid ${course.color};` : '';
        
        tr.innerHTML = `
            <td style="${colorStyle}">${course.period}</td>
            <td>${course.time}</td>
            <td style="font-weight:bold;">${course.subject}</td>
            <td>${course.room}</td>
            <td>${course.teacher}</td>
        `;
        // 點擊可以編輯 (雖然這是本日列表，但也可以做編輯功能)
        tr.onclick = () => openEditModal(dayStr, course.period);
        tbody.appendChild(tr);
    });
}

// 4. 渲染「週課表」 (最複雜的部分)
function renderWeeklyTable(): void {
    // 有兩個地方需要渲染：主畫面的週課表、Modal 裡的週課表
    const targets = ['weekly-schedule-body', 'weekly-schedule-body-modal']; // 假設 ID 一樣或類似
    
    // 這裡我們只處理主畫面的，若你的 HTML 裡有兩個 table，要分別處理
    // 為了簡化，我們先針對 ID="weekly-schedule-body"
    const tbody = document.getElementById('weekly-schedule-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    // 定義節次列表 1~9, A, B, C... 依據你的需求
    // 這裡假設 1~14 節
    const periods = Array.from({length: 14}, (_, i) => String(i + 1)); 

    periods.forEach(p => {
        const tr = document.createElement('tr');
        
        // 第一格：節次
        const tdPeriod = document.createElement('td');
        tdPeriod.innerText = p;
        tdPeriod.style.background = '#f8f9fa';
        tdPeriod.style.fontWeight = 'bold';
        tr.appendChild(tdPeriod);

        // 週一 (1) 到 週日 (0) -> 順序：一二三四五六日
        const days = ['1', '2', '3', '4', '5', '6', '0'];

        days.forEach(d => {
            // 檢查這一格是否有課
            // 這裡需要處理「連堂」邏輯 (rowspan)
            // 簡化版：先不處理 rowspan，只顯示內容
            
            // 判斷是否被上面的連堂蓋住 (這部分邏輯比較複雜，我們先做基礎版：每格都渲染)
            const cellData = getCourseByPeriod(d, p);
            
            const td = document.createElement('td');
            td.onclick = () => openEditModal(d, p);

            if (cellData) {
                td.innerHTML = `
                    <div style="font-size:0.85rem; font-weight:bold;">${cellData.subject}</div>
                    <div style="font-size:0.7rem; color:#666;">${cellData.room}</div>
                `;
                if (cellData.color) td.style.backgroundColor = cellData.color;
                td.classList.add('has-course');
            } else {
                td.innerHTML = '';
            }
            
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

// 輔助：取得某天某節的課
function getCourseByPeriod(day: string, period: string): Course | undefined {
    if (!weeklySchedule[day]) return undefined;
    return weeklySchedule[day].find(c => c.period === period);
}

// 5. 開啟編輯視窗
function openEditModal(day?: string, period?: string): void {
    // 如果沒傳參數，預設為今天、第1節
    const d = day || String(currentDay);
    const p = period || '1';
    
    editingCell = { day: d, period: p };

    // 填入既有資料
    const course = getCourseByPeriod(d, p);
    
    // 取得 Input 元素
    const iPeriodStart = document.getElementById('input-period-start') as HTMLInputElement;
    const iPeriodEnd = document.getElementById('input-period-end') as HTMLInputElement; // 連堂用
    const iTime = document.getElementById('input-time') as HTMLInputElement;
    const iSubject = document.getElementById('input-subject') as HTMLInputElement;
    const iRoom = document.getElementById('input-room') as HTMLInputElement;
    const iTeacher = document.getElementById('input-teacher') as HTMLInputElement;
    const iColor = document.getElementById('input-color') as HTMLInputElement;
    
    if (iPeriodStart) iPeriodStart.value = p;
    if (iPeriodEnd) iPeriodEnd.value = ''; // 預設清空
    
    // 渲染當前這格既有的課程列表 (可能同一節有多堂? 暫不支援，只顯示第一堂)
    const listDiv = document.getElementById('current-course-list');
    if (listDiv) {
        listDiv.innerHTML = '';
        if (course) {
             const div = document.createElement('div');
             div.className = 'course-item-edit'; // 假設 CSS
             div.style.padding = '10px';
             div.style.background = '#f1f1f1';
             div.style.marginBottom = '5px';
             div.style.borderRadius = '5px';
             div.style.display = 'flex';
             div.style.justifyContent = 'space-between';
             
             div.innerHTML = `
                <span>${course.subject} (${course.time})</span>
                <button style="color:red; border:none; background:none; cursor:pointer;">刪除</button>
             `;
             // 綁定刪除事件
             const btn = div.querySelector('button');
             if (btn) btn.onclick = () => deleteCourse(d, course.period); // 必須傳 course.period 確保刪對
             listDiv.appendChild(div);

             // 帶入編輯欄位 (方便修改)
             if (iTime) iTime.value = course.time;
             if (iSubject) iSubject.value = course.subject;
             if (iRoom) iRoom.value = course.room;
             if (iTeacher) iTeacher.value = course.teacher;
             if (iColor) {
                 iColor.value = course.color || '#ffffff';
                 // 更新顏色選擇器的 UI 狀態 (呼叫全域 selectColor 比較麻煩，這裡手動模擬)
                 const swatches = document.querySelectorAll('.color-swatch');
                 swatches.forEach(s => {
                     s.classList.remove('selected');
                     // 這裡判斷背景色是否一樣 (簡化判斷)
                     if ((s as HTMLElement).style.backgroundColor === course.color) { // 這裡顏色格式可能會有 hex/rgb 差異，暫且不處理
                        s.classList.add('selected');
                     }
                 });
             }

        } else {
             listDiv.innerHTML = '<p style="color:#999;">此時段尚無課程</p>';
             // 清空輸入框
             if (iTime) iTime.value = '';
             if (iSubject) iSubject.value = '';
             if (iRoom) iRoom.value = '';
             if (iTeacher) iTeacher.value = '';
             if (iColor) iColor.value = '#ffffff';
        }
    }

    openModal('course-modal');
}

// 6. 新增/儲存課程
function addCourse(): void {
    if (!editingCell) return;

    const iPeriodStart = document.getElementById('input-period-start') as HTMLInputElement;
    const iPeriodEnd = document.getElementById('input-period-end') as HTMLInputElement;
    const iTime = document.getElementById('input-time') as HTMLInputElement;
    const iSubject = document.getElementById('input-subject') as HTMLInputElement;
    const iRoom = document.getElementById('input-room') as HTMLInputElement;
    const iTeacher = document.getElementById('input-teacher') as HTMLInputElement;
    const iColor = document.getElementById('input-color') as HTMLInputElement;

    const subject = iSubject.value.trim();
    if (!subject) {
        showAlert("請輸入科目名稱！");
        return;
    }

    const startP = parseInt(iPeriodStart.value);
    let endP = parseInt(iPeriodEnd.value);
    
    // 如果沒有輸入結束節次，或是結束節次小於開始，就只加一節
    if (isNaN(endP) || endP < startP) {
        endP = startP;
    }

    const day = editingCell.day;

    // 迴圈新增 (處理連堂)
    for (let p = startP; p <= endP; p++) {
        const pStr = String(p);
        
        // 先移除該時段舊的課 (覆蓋模式)
        if (!weeklySchedule[day]) weeklySchedule[day] = [];
        const existingIdx = weeklySchedule[day].findIndex(c => c.period === pStr);
        if (existingIdx > -1) {
            weeklySchedule[day].splice(existingIdx, 1);
        }

        const newCourse: Course = {
            period: pStr,
            time: iTime.value,
            subject: subject,
            room: iRoom.value,
            teacher: iTeacher.value,
            color: iColor.value
        };

        weeklySchedule[day].push(newCourse);
    }

    saveData();
    
    // 關閉視窗並重繪
    closeEditModal();
    renderDailySchedule(); // 更新本日
    renderWeeklyTable();   // 更新週表
    
    showAlert(`已新增 ${subject} (星期${day} 第${startP}-${endP}節)`);
}

// 7. 刪除課程
function deleteCourse(day: string, period: string): void {
    showConfirm("確定要刪除這堂課嗎？").then((ok) => {
        if (ok) {
            if (weeklySchedule[day]) {
                const idx = weeklySchedule[day].findIndex(c => c.period === period);
                if (idx > -1) {
                    weeklySchedule[day].splice(idx, 1);
                    saveData();
                    
                    // 因為是在 Modal 裡刪除的，刪除後要刷新 Modal 內容
                    // 這裡偷懶直接關掉 Modal，讓使用者重開，體驗會比較順暢 (不用手動清空欄位)
                    closeEditModal();
                    renderDailySchedule();
                    renderWeeklyTable();
                }
            }
        }
    });
}

// 8. 匯出圖片 (使用 html2canvas)
function exportSchedule(): void {
    const table = document.querySelector('.weekly-table') as HTMLElement; // 抓取原本的 table
    if (!table) return;

    showAlert("正在產生圖片，請稍候...", "處理中");

    html2canvas(table).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `課表_${currentSemester}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

function exportScheduleImage(): void {
    // 這是 Modal 裡的截圖按鈕，邏輯一樣，只是抓的元素可能不同
    // 這裡我們共用上面的邏輯，抓取同一個 table (因為 Modal 裡通常是看檢視)
    exportSchedule();
}