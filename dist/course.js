// [新增] 用來記錄「目前正在編輯的一整組連堂課程」的索引列表
let editingCourseIndices = [];
// 預設的節次時間對照表
const defaultPeriodTimes = {
    '0': '07:10', '1': '08:10', '2': '09:10', '3': '10:10',
    '4': '11:10', '5': '12:10', '6': '13:10', '7': '14:10',
    '8': '15:10', '9': '16:10', 'A': '17:10', 'B': '18:10',
    'C': '19:10', 'D': '20:10'
};
// 定義節次順序
const PERIOD_ORDER = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'];
// 切換顯示「星期幾」的單日課表
function switchDay(day) {
    currentDay = day;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`tab-${day}`);
    if (activeBtn)
        activeBtn.classList.add('active');
    const todayData = weeklySchedule[day] || [];
    todayData.sort((a, b) => {
        return PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period);
    });
    const tbody = document.getElementById('schedule-body');
    if (tbody) {
        tbody.innerHTML = '';
        if (todayData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-class">😴 無課程</td></tr>';
        }
        else {
            todayData.forEach(item => {
                const period = item.period || "-";
                const teacher = item.teacher || "";
                const room = item.room || "";
                const nature = item.nature || item.type || '必修';
                const category = item.category || '';
                let typeColor = "#999";
                if (nature === '必修')
                    typeColor = "#e74c3c";
                else if (nature === '選修')
                    typeColor = "#27ae60";
                else if (nature === '必選修')
                    typeColor = "#f39c12";
                // [修改] 如果有自訂顏色，加上左側邊框顯示
                const customColor = item.color && item.color !== '#ffffff' ? item.color : 'transparent';
                const rowStyle = customColor !== 'transparent' ? `border-left: 5px solid ${customColor};` : '';
                const row = `
                    <tr style="${rowStyle}">
                        <td style="color:var(--primary); font-weight:bold;">${period}</td>
                        <td style="color:var(--text-sub);">${item.time}</td>
                        <td style="font-weight:bold;">${item.subject}</td>
                        <td><span style="background:var(--border); color:var(--text-main); padding:2px 4px; border-radius:4px; font-size:0.8rem;">${room}</span></td>
                        <td style="font-size:0.85rem;">${teacher}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        }
    }
}
function renderEditList() {
    const listDiv = document.getElementById('current-course-list');
    const todayData = weeklySchedule[currentDay] || [];
    let html = '';
    todayData.forEach((item, index) => {
        const info = `${item.time} ${item.room ? '@' + item.room : ''}`;
        html += `
        <div class="course-list-item">
            <div class="course-info">
                <div class="course-name">[${item.period}] ${item.subject}</div>
                <div class="course-time">${info}</div>
            </div>
            <div>
                <button class="btn-edit" onclick="editCourse(${index})">修改</button>
                <button class="btn-delete" onclick="deleteCourse(${index})">刪除</button>
            </div>
        </div>`;
    });
    listDiv.innerHTML = html || '<p style="color:#999; text-align:center;">無課程</p>';
}
// [重點修改] 編輯課程 (包含顏色回填邏輯)
function editCourse(startIndex) {
    const todayData = weeklySchedule[currentDay] || [];
    const startItem = todayData[startIndex];
    if (!startItem)
        return;
    editingCourseIndices = [startIndex];
    let currentPIndex = PERIOD_ORDER.indexOf(startItem.period);
    let endPeriod = startItem.period;
    for (let i = startIndex + 1; i < todayData.length; i++) {
        const nextItem = todayData[i];
        const nextPIndex = PERIOD_ORDER.indexOf(nextItem.period);
        if (nextPIndex === currentPIndex + 1 &&
            nextItem.subject === startItem.subject &&
            nextItem.room === startItem.room) {
            editingCourseIndices.push(i);
            endPeriod = nextItem.period;
            currentPIndex = nextPIndex;
        }
        else {
            break;
        }
    }
    document.getElementById('input-period-start').value = startItem.period || '';
    document.getElementById('input-period-end').value = endPeriod;
    document.getElementById('input-time').value = startItem.time || getPeriodTimes()[startItem.period] || '';
    document.getElementById('input-subject').value = startItem.subject || '';
    document.getElementById('input-room').value = startItem.room || '';
    document.getElementById('input-teacher').value = startItem.teacher || '';
    // [修改] 顏色回填邏輯 (處理圓點顯示)
    const color = startItem.color || '#ffffff';
    document.getElementById('input-color').value = color; // 填入 hidden input
    updateColorSwatchUI(color); // 更新 UI
    const btn = document.getElementById('btn-add-course');
    if (btn) {
        btn.innerText = "💾 保存修改 (整段)";
        btn.style.background = "#f39c12";
    }
}
// [新增] 更新顏色按鈕的選取狀態
function updateColorSwatchUI(selectedColor) {
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(sw => {
        sw.classList.remove('selected');
        // 取得該 div 的背景顏色設定 (需要將 hex 轉為比較用的格式，或是直接存 hex)
        // 簡單作法：透過 onclick 觸發的 selectColor 已經處理了，這裡是回填時用
        // 因為 inline style 可能包含空格，我們直接用 onclick 屬性裡的 hex 來比對最準確
        const onclickAttr = sw.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`'${selectedColor}'`)) {
            sw.classList.add('selected');
        }
    });
}
function getPeriodTimes() {
    const times = {};
    const { classDur, breakDur, startHash } = periodConfig;
    let [h, m] = startHash.split(':').map(Number);
    let currentMin = h * 60 + m;
    let zeroStart = currentMin - (classDur + breakDur);
    times['0'] = formatTime(zeroStart);
    PERIOD_ORDER.forEach(p => {
        if (p === '0')
            return;
        times[p] = formatTime(currentMin);
        let duration = classDur;
        let breakTime = breakDur;
        currentMin += duration + breakTime;
    });
    return times;
}
function formatTime(totalMinutes) {
    let h = Math.floor(totalMinutes / 60);
    let m = totalMinutes % 60;
    if (h >= 24)
        h -= 24;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
function editTimeSettings() {
    showConfirm("⚠️ 修改後，新增課程時的預設時間將會改變。\n\n確定要編輯課堂時間設定嗎？", "編輯確認")
        .then(isConfirmed => {
        if (!isConfirmed)
            return;
        showPrompt("請輸入「每堂課」的分鐘數：", periodConfig.classDur, "上課時間")
            .then(cVal => {
            if (cVal === null)
                return;
            const newClass = parseInt(cVal) || 50;
            showPrompt("請輸入「下課休息」的分鐘數：", periodConfig.breakDur, "下課時間")
                .then(bVal => {
                if (bVal === null)
                    return;
                const newBreak = parseInt(bVal) || 10;
                periodConfig.classDur = newClass;
                periodConfig.breakDur = newBreak;
                saveData();
                const preview = getPeriodTimes();
                showAlert(`設定已更新！\n\n第 1 節：${preview['1']}\n第 8 節：${preview['8']}`, "修改成功");
            });
        });
    });
}
// 新增或更新課程函式
function addCourse() {
    const pStartRaw = document.getElementById('input-period-start').value.trim().toUpperCase();
    const pEndRaw = document.getElementById('input-period-end').value.trim().toUpperCase();
    const time = document.getElementById('input-time').value;
    const sub = document.getElementById('input-subject').value;
    const room = document.getElementById('input-room').value;
    const teacher = document.getElementById('input-teacher').value;
    // 這裡直接讀取 hidden input 的值
    const color = document.getElementById('input-color').value;
    if (!sub || !pStartRaw) {
        showAlert('請至少輸入「科目」與「起始節次」', '資料不全');
        return;
    }
    const idxStart = PERIOD_ORDER.indexOf(pStartRaw);
    let idxEnd = pEndRaw ? PERIOD_ORDER.indexOf(pEndRaw) : idxStart;
    if (idxStart === -1) {
        showAlert(`起始節次 "${pStartRaw}" 無效`, '格式錯誤');
        return;
    }
    if (idxEnd === -1) {
        showAlert(`結束節次 "${pEndRaw}" 無效`, '格式錯誤');
        return;
    }
    if (idxEnd < idxStart) {
        showAlert('結束節次不能早於起始節次！', '邏輯錯誤');
        return;
    }
    if (!weeklySchedule[currentDay])
        weeklySchedule[currentDay] = [];
    if (editingCourseIndices.length > 0) {
        editingCourseIndices.sort((a, b) => b - a);
        editingCourseIndices.forEach(delIndex => {
            if (delIndex < weeklySchedule[currentDay].length) {
                weeklySchedule[currentDay].splice(delIndex, 1);
            }
        });
    }
    let count = 0;
    for (let i = idxStart; i <= idxEnd; i++) {
        const p = PERIOD_ORDER[i];
        const autoTime = getPeriodTimes()[p] || time;
        weeklySchedule[currentDay].push({
            period: p,
            time: autoTime,
            subject: sub, room, teacher,
            color: color
        });
        count++;
    }
    weeklySchedule[currentDay].sort((a, b) => PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period));
    const msg = editingCourseIndices.length > 0 ? "修改成功！(已更新整段區間)" : `成功加入 ${count} 堂課！`;
    showAlert(msg, "完成");
    resetCourseInput();
    saveData();
    renderEditList();
    updateExamSubjectOptions();
    if (typeof renderWeeklyTable === 'function')
        renderWeeklyTable();
}
function resetCourseInput() {
    document.getElementById('input-period-start').value = '';
    document.getElementById('input-period-end').value = '';
    document.getElementById('input-time').value = '';
    document.getElementById('input-subject').value = '';
    document.getElementById('input-room').value = '';
    document.getElementById('input-teacher').value = '';
    // [修改] 重置顏色為白色，並更新 UI
    document.getElementById('input-color').value = '#ffffff';
    updateColorSwatchUI('#ffffff');
    editingCourseIndices = [];
    const btn = document.getElementById('btn-add-course');
    if (btn) {
        btn.innerText = "+ 加入清單";
        btn.style.background = "#333";
    }
}
function deleteCourse(startIndex) {
    const todayData = weeklySchedule[currentDay] || [];
    const startItem = todayData[startIndex];
    let indicesToDelete = [startIndex];
    let currentPIndex = PERIOD_ORDER.indexOf(startItem.period);
    for (let i = startIndex + 1; i < todayData.length; i++) {
        const nextItem = todayData[i];
        const nextPIndex = PERIOD_ORDER.indexOf(nextItem.period);
        if (nextPIndex === currentPIndex + 1 &&
            nextItem.subject === startItem.subject &&
            nextItem.room === startItem.room) {
            indicesToDelete.push(i);
            currentPIndex = nextPIndex;
        }
        else {
            break;
        }
    }
    const confirmMsg = indicesToDelete.length > 1
        ? `確定刪除這 ${indicesToDelete.length} 堂連堂課程嗎？`
        : '確定刪除這堂課嗎？';
    showConfirm(confirmMsg, '刪除確認').then(isConfirmed => {
        if (isConfirmed) {
            if (editingCourseIndices.length > 0)
                resetCourseInput();
            indicesToDelete.sort((a, b) => b - a);
            indicesToDelete.forEach(idx => {
                weeklySchedule[currentDay].splice(idx, 1);
            });
            saveData();
            renderEditList();
            updateExamSubjectOptions();
            if (typeof renderWeeklyTable === 'function')
                renderWeeklyTable();
        }
    });
}
function openEditModal() {
    document.getElementById('course-modal').style.display = 'flex';
    resetCourseInput();
    renderEditList();
}
function closeEditModal() {
    document.getElementById('course-modal').style.display = 'none';
    resetCourseInput();
}
let selectionAnchor = null;
function handleWeeklyAdd(day, period) {
    if (!selectionAnchor || selectionAnchor.day !== day) {
        clearSelectionHighlight();
        selectionAnchor = { day: day, period: period };
        const cell = getCellByDayPeriod(day, period);
        if (cell)
            cell.classList.add('cell-selected');
        showSelectionHint(`已選取週${getDayName(day)}第 ${period} 節，請點選「結束節次」`);
        return;
    }
    const idxStart = PERIOD_ORDER.indexOf(selectionAnchor.period);
    const idxCurrent = PERIOD_ORDER.indexOf(period);
    let finalStart, finalEnd;
    if (idxStart <= idxCurrent) {
        finalStart = selectionAnchor.period;
        finalEnd = period;
    }
    else {
        finalStart = period;
        finalEnd = selectionAnchor.period;
    }
    switchDay(day);
    openEditModal();
    document.getElementById('input-period-start').value = finalStart;
    document.getElementById('input-period-end').value = finalEnd;
    const times = getPeriodTimes();
    if (times[finalStart]) {
        document.getElementById('input-time').value = times[finalStart];
    }
    clearSelectionHighlight();
    selectionAnchor = null;
    hideSelectionHint();
}
function handleWeeklyEdit(day, index) {
    clearSelectionHighlight();
    selectionAnchor = null;
    hideSelectionHint();
    switchDay(day);
    openEditModal();
    editCourse(index);
}
function clearSelectionHighlight() {
    document.querySelectorAll('.cell-selected').forEach(el => {
        el.classList.remove('cell-selected');
    });
}
function getCellByDayPeriod(day, period) {
    return document.getElementById(`cell-${day}-${period}`);
}
function getDayName(day) {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[day] || '';
}
function showSelectionHint(msg) {
    let hint = document.getElementById('selection-hint-toast');
    if (!hint) {
        hint = document.createElement('div');
        hint.id = 'selection-hint-toast';
        Object.assign(hint.style, {
            position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px 20px',
            borderRadius: '20px', fontSize: '14px', zIndex: '9999', pointerEvents: 'none',
            transition: 'opacity 0.3s'
        });
        document.body.appendChild(hint);
    }
    hint.innerText = msg;
    hint.style.opacity = '1';
    if (window.selectionHintTimer)
        clearTimeout(window.selectionHintTimer);
    window.selectionHintTimer = setTimeout(hideSelectionHint, 4000);
}
function hideSelectionHint() {
    const hint = document.getElementById('selection-hint-toast');
    if (hint)
        hint.style.opacity = '0';
}
function renderWeeklyTable() {
    const tbody = document.getElementById('weekly-schedule-body');
    if (!tbody)
        return;
    const periods = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'];
    const dayKeys = [1, 2, 3, 4, 5, 6, 0];
    let skipMap = new Set();
    let html = '';
    periods.forEach((p, pIndex) => {
        html += `<tr>`;
        html += `<td style="font-weight:bold; background:#f4f7f6; color:#555; text-align:center; vertical-align: middle;">${p}</td>`;
        dayKeys.forEach(day => {
            if (skipMap.has(`${day}-${p}`))
                return;
            const dayCourses = weeklySchedule[day] || [];
            const courseIndex = dayCourses.findIndex(c => c.period == p);
            const course = dayCourses[courseIndex];
            if (course) {
                let spanCount = 1;
                for (let nextI = pIndex + 1; nextI < periods.length; nextI++) {
                    const nextP = periods[nextI];
                    const nextCourse = dayCourses.find(c => c.period == nextP);
                    if (nextCourse &&
                        nextCourse.subject === course.subject &&
                        nextCourse.room === course.room) {
                        spanCount++;
                        skipMap.add(`${day}-${nextP}`);
                    }
                    else {
                        break;
                    }
                }
                // [修改] 優先使用自訂顏色，若無則使用預設
                let bgColor = course.color && course.color !== '#ffffff' ? course.color : null;
                if (!bgColor) {
                    bgColor = '#fff3e0';
                    if (course.nature === '必修')
                        bgColor = '#ffebee';
                    else if (course.nature === '選修')
                        bgColor = '#e8f5e9';
                }
                html += `
                <td rowspan="${spanCount}" onclick="handleWeeklyEdit(${day}, ${courseIndex})" style="cursor:pointer; background:${bgColor}; padding:4px; text-align:center; vertical-align:middle; border:1px solid #eee;">
                    <div style="font-weight:bold; font-size:0.85rem; color:#333; line-height:1.2;">${course.subject}</div>
                    <div style="font-size:0.75rem; color:#666; margin-top:2px;">${course.room || ''}</div>
                </td>`;
            }
            else {
                html += `<td id="cell-${day}-${p}" onclick="handleWeeklyAdd(${day}, '${p}')" style="cursor:pointer; border:1px solid #f9f9f9; transition: background 0.2s;"></td>`;
            }
        });
        html += `</tr>`;
    });
    tbody.innerHTML = html;
}
function switchScheduleMode(mode) {
    const tabs = ['daily', 'weekly'];
    tabs.forEach(tab => {
        const view = document.getElementById(`subview-sch-${tab}`);
        const btn = document.getElementById(`btn-sch-${tab}`);
        if (view)
            view.style.display = 'none';
        if (btn)
            btn.classList.remove('active');
    });
    const targetView = document.getElementById(`subview-sch-${mode}`);
    const targetBtn = document.getElementById(`btn-sch-${mode}`);
    if (targetView)
        targetView.style.display = 'block';
    if (targetBtn)
        targetBtn.classList.add('active');
    if (mode === 'weekly') {
        renderWeeklyTable();
    }
}
