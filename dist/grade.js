// 紀錄目前正在編輯的成績在 gradeList 陣列中的索引位置
let editingGradeIndex = -1;
// 載入並渲染學期成績列表 (計算 GPA 與總學分)
function loadGrades() {
    const tb = document.getElementById('grade-body'); // 取得表格的 tbody 元素 (用來放成績列)
    if (!tb)
        return; // 如果找不到元素 (可能不在成績頁面)，則直接結束函式
    tb.innerHTML = ''; // 清空目前的表格內容，避免重複堆疊
    // 初始化統計變數
    //  加權    總學分   實得學分
    let ts = 0, tc = 0, ec = 0;
    // 遍歷所有成績資料 (gradeList 是全域變數，存放在 data.js/state.js)
    gradeList.forEach(g => {
        // 取得學分，預設為 1
        const cr = parseFloat(g.credit) || 1;
        sc = parseFloat(g.score);
        // 判斷是否為自主學習 (分數為 -1 且 科目為 自主學習)
        const isSelfStudy = (sc === -1 && g.subject === '自主學習');
        let displayScore = sc;
        let scoreColor = '';
        if (isSelfStudy) {
            ec += cr; // 計入實學分
            // 不列入ts與tc
            displayScore = '<span style="background:#e8f5e9; color:#2e7d32; padding:2px 6px; border-radius:4px; font-size:0.85rem;">P (通過)</span>';
            scoreColor = ''; // 顏色已在 HTML 中設定
        }
        else {
            // 一般課程邏輯
            sc = sc || 0; // 確保是數字
            const pass = sc >= 60;
            if (pass)
                ec += cr;
            ts += sc * cr;
            tc += cr;
            displayScore = sc;
            scoreColor = pass ? '#2ecc71' : '#e74c3c';
        }
        tb.innerHTML += `<tr>
            <td>${g.subject}</td>
            <td>${cr}</td>
            <td>${isSelfStudy ? cr : (sc >= 60 ? cr : 0)}</td>
            <td style="font-weight:bold; color:${scoreColor}">${displayScore}</td>
        </tr>`;
    });
    let avg = 0; // 計算加權平均
    if (tc > 0)
        avg = ts / tc; // 避免除以 0 的錯誤
    // 更新介面上顯示的平均分數 (保留兩位小數) 與實得學分
    document.getElementById('average-score').innerHTML = `加權平均: ${avg.toFixed(2)} <span style="font-size:0.8rem; color:#666;">(實得${ec}學分)</span>`;
}
// 渲染編輯 Modal (彈出視窗) 中的成績列表
// 讓使用者可以在新增/修改視窗中看到目前已有的成績
function renderGradeEditList() {
    // 取得列表容器
    const listDiv = document.getElementById('current-grade-list');
    let html = '';
    // 遍歷成績列表產生卡片式介面
    gradeList.forEach((item, i) => {
        const info = `${item.credit}學分 | ${item.score}分`;
        html += `
        <div class="course-list-item">
            <div class="course-info">
                <div class="course-name">${item.subject}</div>
                <div class="course-time">${info}</div>
            </div>
            <div>
                <button class="btn-edit" onclick="editGrade(${i})">修改</button>
                <button class="btn-delete" onclick="deleteGrade(${i})">刪除</button>
            </div>
        </div>`;
    });
    // 如果沒有成績，顯示提示文字
    listDiv.innerHTML = html || '<p style="color:#999; text-align:center">無成績</p>';
}
// 準備編輯某筆成績 (將資料回填到輸入框)
function editGrade(index) {
    const item = gradeList[index];
    if (!item)
        return;
    updateExamSubjectOptions();
    // 判斷是否為自主學習
    const isSelfStudy = (item.score === -1 && item.subject === '自主學習');
    // 設定 Checkbox 狀態
    const chk = document.getElementById('input-grade-self-study');
    chk.checked = isSelfStudy;
    toggleSelfStudyMode(); // 觸發 UI 切換
    if (!isSelfStudy) {
        // 如果是一般課程，才需要回填科目與分數
        const sel = document.getElementById('input-grade-subject-select');
        const txt = document.getElementById('input-grade-subject-text');
        const btn = document.getElementById('btn-toggle-input');
        const optionExists = sel.querySelector(`option[value="${item.subject}"]`);
        if (optionExists) {
            sel.style.display = 'block';
            txt.style.display = 'none';
            btn.innerText = "✏️";
            sel.value = item.subject;
        }
        else {
            sel.style.display = 'none';
            txt.style.display = 'block';
            btn.innerText = "📜";
            txt.value = item.subject;
        }
        document.getElementById('input-grade-score').value = item.score;
        document.getElementById('input-grade-category').value = item.category || '通識';
        document.getElementById('input-grade-nature').value = item.nature || '必修';
    }
    // 學分無論如何都要回填
    document.getElementById('input-grade-credit').value = item.credit || '';
    editingGradeIndex = index;
    const saveBtn = document.getElementById('btn-add-grade');
    if (saveBtn) {
        saveBtn.innerText = "💾 保存修改";
        saveBtn.style.background = "#f39c12";
    }
}
// 新增或儲存成績到列表
function addGrade() {
    const isSelfStudy = document.getElementById('input-grade-self-study').checked;
    let s, category, nature, sc;
    if (isSelfStudy) {
        // 自主學習：自動填入預設值
        s = "自主學習";
        category = "自由";
        nature = "選修";
        sc = -1; // 使用 -1 代表無分數/通過
    }
    else {
        // 一般模式：讀取輸入框
        const sel = document.getElementById('input-grade-subject-select');
        const txt = document.getElementById('input-grade-subject-text');
        s = (sel.style.display !== 'none') ? sel.value : txt.value;
        category = document.getElementById('input-grade-category').value;
        nature = document.getElementById('input-grade-nature').value;
        sc = document.getElementById('input-grade-score').value;
    }
    const c = document.getElementById('input-grade-credit').value;
    // 驗證：若為自主學習則跳過分數與科目檢查，否則需檢查
    if ((isSelfStudy) || (s && sc)) {
        const gradeData = {
            subject: s,
            category: category,
            nature: nature,
            credit: parseInt(c) || 0,
            score: isSelfStudy ? -1 : (parseInt(sc) || 0)
        };
        if (editingGradeIndex > -1) {
            gradeList[editingGradeIndex] = gradeData;
            showAlert("成績修改成功！");
        }
        else {
            gradeList.push(gradeData);
        }
        resetGradeInput();
        saveData();
        renderGradeEditList();
        // 如果是在成績單頁面，立即刷新計算
        if (document.getElementById('grade-body'))
            loadGrades();
    }
    else {
        showAlert('資料不完整，請檢查科目與分數', '錯誤');
    }
}
// 重置成績輸入框與狀態 (恢復成新增模式)
function resetGradeInput() {
    // 重置 Checkbox
    const chk = document.getElementById('input-grade-self-study');
    if (chk) {
        chk.checked = false;
        toggleSelfStudyMode(); // 恢復顯示所有欄位
    }
    document.getElementById('input-grade-subject-select').style.display = 'block';
    document.getElementById('input-grade-subject-text').style.display = 'none';
    document.getElementById('btn-toggle-input').innerText = "✏️";
    document.getElementById('input-grade-subject-select').value = '';
    document.getElementById('input-grade-subject-text').value = '';
    document.getElementById('input-grade-category').value = '通識';
    document.getElementById('input-grade-nature').value = '必修';
    document.getElementById('input-grade-credit').value = '1'; // 自主學習通常學分較少，這裡預設還是1，使用者可改
    document.getElementById('input-grade-score').value = '';
    editingGradeIndex = -1;
    const btn = document.getElementById('btn-add-grade');
    if (btn) {
        btn.innerText = "+ 加入成績單";
        btn.style.background = "#333";
    }
}
// 刪除成績
function deleteGrade(i) {
    // 顯示確認對話框
    showConfirm('確定刪除此成績？', '刪除確認').then(ok => {
        if (ok) {
            if (editingGradeIndex === i)
                resetGradeInput(); // 如果正在編輯這筆資料，先重置輸入框以免出錯
            gradeList.splice(i, 1); // 從陣列移除
            saveData(); // 存檔
            renderGradeEditList(); //刷新介面
        }
    });
}
// 更新成績 Modal 中的「課程歸類」下拉選單
function updateGradeCategoryOptions() {
    const select = document.getElementById('input-grade-category');
    if (!select)
        return;
    const currentVal = select.value; // 暫存目前選的值
    select.innerHTML = ''; // 清空選項
    const categories = Object.keys(categoryTargets);
    if (categories.length === 0) {
        select.innerHTML = '<option value="" disabled selected>請先至設定頁新增類別</option>';
    }
    else {
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            select.appendChild(opt);
        });
        // 額外加入「其他」作為備用
        if (!categoryTargets['其他']) {
            const opt = document.createElement('option');
            opt.value = '其他';
            opt.innerText = '其他';
            select.appendChild(opt);
        }
    }
    // 嘗試選回原本的值
    if (currentVal && (categories.includes(currentVal) || currentVal === '其他')) {
        select.value = currentVal;
    }
}
// 開啟成績管理 Modal
function openGradeModal() {
    updateExamSubjectOptions(); // 開啟前先更新科目選單
    updateGradeCategoryOptions(); // 更新分類選單
    document.getElementById('grade-modal').style.display = 'flex'; // 顯示 Modal
    // 確保學分輸入框顯示 (因為有些情境可能被隱藏)
    const g = document.getElementById('input-credit-group');
    if (g)
        g.style.display = 'block';
    resetGradeInput(); // 重置輸入狀態
    renderGradeEditList(); // 渲染現有列表
}
// 關閉成績管理 Modal
function closeGradeModal() {
    document.getElementById('grade-modal').style.display = 'none';
    resetGradeInput();
}
// 更新所有成績相關 Modal 中的「科目下拉選單」
// 這會自動抓取「課表」中的科目名稱，讓使用者不用手打
function updateExamSubjectOptions() {
    // 取得三個主要選單：平常考、段考、學期成績
    const regSelect = document.getElementById('regular-subject-select');
    const midSelect = document.getElementById('midterm-subject-select');
    const gradeSelect = document.getElementById('input-grade-subject-select');
    // 如果找不到元素則結束
    if (!regSelect || !midSelect || !gradeSelect)
        return;
    // 暫存目前使用者選中的值，以免刷新後被洗掉
    const regVal = regSelect.value;
    const midVal = midSelect.value;
    const gradeVal = gradeSelect.value;
    // 清空選項並加入預設值
    const placeholder = '<option value="" disabled selected>選擇科目</option>';
    regSelect.innerHTML = placeholder;
    midSelect.innerHTML = placeholder;
    gradeSelect.innerHTML = placeholder;
    // 使用 Set 來儲存科目名稱，自動過濾重複的
    let allSubjects = new Set();
    // 遍歷每週課表，收集所有科目
    Object.values(weeklySchedule).forEach(dayCourses => {
        dayCourses.forEach(course => {
            if (course.subject)
                allSubjects.add(course.subject);
        });
    });
    // 將科目排序後建立 option 元素並加入到三個選單中
    Array.from(allSubjects).sort().forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.innerText = sub;
        // cloneNode(true) 是因為一個 DOM 元素只能存在一個地方，要複製三份
        regSelect.appendChild(opt.cloneNode(true));
        midSelect.appendChild(opt.cloneNode(true));
        gradeSelect.appendChild(opt.cloneNode(true));
    });
    // 如果之前有選中值，嘗試選回去
    if (regVal)
        regSelect.value = regVal;
    if (midVal)
        midSelect.value = midVal;
    if (gradeVal)
        gradeSelect.value = gradeVal;
}
// 監聽下拉選單變更事件，當使用者切換科目時，自動載入該科目的考試成績
document.addEventListener('change', (e) => {
    if (e.target.id === 'regular-subject-select')
        renderRegularExams();
    else if (e.target.id === 'midterm-subject-select')
        renderMidtermExams();
});
// 渲染平常考 (小考) 列表
function renderRegularExams() {
    const subject = document.getElementById('regular-subject-select').value;
    const tbody = document.getElementById('regular-exam-body');
    if (!tbody)
        return;
    // 如果沒選科目
    if (!subject) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-class">👈 請先選擇科目</td></tr>';
        return;
    }
    // 從 regularExams 物件中取得該科目的成績陣列
    const scores = regularExams[subject] || [];
    // 如果沒資料
    if (scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-class">📭 目前無紀錄</td></tr>';
    }
    else {
        // 產生列表 HTML
        tbody.innerHTML = scores.map((item, index) => `
            <tr>
                <td style="text-align:left; padding-left:10px;">
                    ${item.title}
                    <span onclick="deleteRegularExam(${index})" style="cursor:pointer; color:#e74c3c; margin-left:5px; font-size:0.8rem;">🗑️</span>
                </td>
                <td style="font-weight:bold; color: var(--primary);">${item.score}</td>
            </tr>
        `).join('');
    }
}
// 渲染段考列表 (邏輯同上)
function renderMidtermExams() {
    const subject = document.getElementById('midterm-subject-select').value;
    const tbody = document.getElementById('midterm-exam-body');
    if (!tbody)
        return;
    if (!subject) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-class">👈 請先選擇科目</td></tr>';
        return;
    }
    const scores = midtermExams[subject] || [];
    if (scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-class">📭 目前無紀錄</td></tr>';
    }
    else {
        tbody.innerHTML = scores.map((item, index) => `
            <tr>
                <td style="text-align:left; padding-left:10px;">
                    ${item.title}
                    <span onclick="deleteMidtermExam(${index})" style="cursor:pointer; color:#e74c3c; margin-left:5px; font-size:0.8rem;">🗑️</span>
                </td>
                <td style="font-weight:bold; color: var(--primary);">${item.score}</td>
            </tr>
        `).join('');
    }
}
// 開啟平常考新增視窗
function openRegularModal() {
    const subject = document.getElementById('regular-subject-select').value;
    if (!subject) {
        showAlert("請先在上方選單選擇一個科目！");
        return;
    } // 必須先選科目才能新增
    // 在 Modal 標題顯示目前科目
    document.getElementById('modal-regular-subject-name').innerText = subject;
    // 清空輸入框
    document.getElementById('input-regular-name').value = '';
    document.getElementById('input-regular-score').value = '';
    // 顯示 Modal
    document.getElementById('regular-exam-modal').style.display = 'flex';
}
// 關閉平常考 Modal
function closeRegularModal() {
    document.getElementById('regular-exam-modal').style.display = 'none';
}
// 新增平常考成績
function addRegularExam() {
    const subject = document.getElementById('regular-subject-select').value;
    const name = document.getElementById('input-regular-name').value;
    const score = document.getElementById('input-regular-score').value;
    if (!name || !score) {
        showAlert("請輸入名稱和分數");
        return;
    }
    // 如果該科目還沒有成績陣列，先初始化
    if (!regularExams[subject])
        regularExams[subject] = [];
    // 推入新成績
    regularExams[subject].push({ title: name, score: parseInt(score) || 0 });
    saveData();
    closeRegularModal();
    renderRegularExams();
}
// 刪除平常考成績
function deleteRegularExam(index) {
    const subject = document.getElementById('regular-subject-select').value;
    showConfirm("確定要刪除這筆成績嗎？").then(ok => {
        if (ok) {
            regularExams[subject].splice(index, 1);
            saveData();
            renderRegularExams();
        }
    });
}
// 開啟段考新增視窗 (邏輯同上)
function openMidtermModal() {
    const subject = document.getElementById('midterm-subject-select').value;
    if (!subject) {
        showAlert("請先在上方選單選擇一個科目！");
        return;
    }
    document.getElementById('modal-midterm-subject-name').innerText = subject;
    document.getElementById('input-midterm-name').value = '';
    document.getElementById('input-midterm-score').value = '';
    document.getElementById('midterm-exam-modal').style.display = 'flex';
}
function closeMidtermModal() {
    document.getElementById('midterm-exam-modal').style.display = 'none';
}
// 新增段考成績
function addMidtermExam() {
    const subject = document.getElementById('midterm-subject-select').value;
    const name = document.getElementById('input-midterm-name').value;
    const score = document.getElementById('input-midterm-score').value;
    if (!name || !score) {
        showAlert("請輸入名稱和分數");
        return;
    }
    if (!midtermExams[subject])
        midtermExams[subject] = [];
    midtermExams[subject].push({ title: name, score: parseInt(score) || 0 });
    saveData();
    closeMidtermModal();
    renderMidtermExams();
}
// 刪除段考成績
function deleteMidtermExam(index) {
    const subject = document.getElementById('midterm-subject-select').value;
    showConfirm("確定要刪除這筆成績嗎？").then(ok => {
        if (ok) {
            midtermExams[subject].splice(index, 1);
            saveData();
            renderMidtermExams();
        }
    });
}
// 切換「下拉選單」與「手動輸入」科目的模式
function toggleGradeInputMode() {
    const sel = document.getElementById('input-grade-subject-select');
    const txt = document.getElementById('input-grade-subject-text');
    const btn = document.getElementById('btn-toggle-input');
    // 如果選單目前顯示，則隱藏選單，顯示文字框
    if (sel.style.display !== 'none') {
        sel.style.display = 'none';
        txt.style.display = 'block';
        btn.innerText = "📜"; // 按鈕變成切換回清單的圖示
        txt.focus();
    }
    else {
        // 反之亦然
        sel.style.display = 'block';
        txt.style.display = 'none';
        btn.innerText = "✏️";
    }
}
// [新增] 切換自主學習模式
function toggleSelfStudyMode() {
    const isSelfStudy = document.getElementById('input-grade-self-study').checked;
    // 取得要隱藏的區塊
    const groupSubject = document.getElementById('group-grade-subject');
    const groupCatNature = document.getElementById('group-grade-cat-nature');
    const groupScore = document.getElementById('group-grade-score');
    if (isSelfStudy) {
        // 隱藏欄位
        groupSubject.style.display = 'none';
        groupCatNature.style.display = 'none';
        groupScore.style.display = 'none';
    }
    else {
        // 恢復顯示
        groupSubject.style.display = 'block';
        groupCatNature.style.display = 'block';
        groupScore.style.display = 'block';
    }
}
// Chart.js 圖表實例變數，用來銷毀舊圖表以重繪
let gradeChartInstance = null;
// 計算某學期所有成績的平均分數
function calculateSemesterAverage(grades) {
    let ts = 0, tc = 0;
    if (!grades || grades.length === 0)
        return 0;
    grades.forEach(g => {
        const cr = parseFloat(g.credit) || 1;
        const sc = parseFloat(g.score);
        // 如果分數不是 -1 (非自主學習)，才納入平均計算
        if (sc !== -1) {
            ts += (sc || 0) * cr;
            tc += cr;
        }
    });
    return tc > 0 ? (ts / tc).toFixed(1) : 0;
}
// 渲染圖表分析 (GPA 趨勢圖 + 學分詳細統計)
function renderAnalysis() {
    const labels = [];
    const dataPoints = [];
    let totalCreditsEarned = 0; // 總實得學分
    // 分類統計物件
    let categoryEarned = {};
    const categories = Object.keys(categoryTargets); // 改成讀取設定的 keys
    if (!categories.includes('其他'))
        categories.push('其他'); // 確保有其他
    categories.forEach(cat => {
        categoryEarned[cat] = { total: 0, "必修": 0, "選修": 0, "必選修": 0 };
    });
    const sortedSemesters = semesterList.slice().sort();
    sortedSemesters.forEach(sem => {
        let semData = allData[sem];
        let grades = (sem === currentSemester) ? gradeList : (semData ? semData.grades : []);
        if (grades) {
            // 1. 計算該學期平均 (需排除 -1 分)
            let semTs = 0, semTc = 0;
            grades.forEach(g => {
                const s = parseFloat(g.score);
                const c = parseFloat(g.credit) || 0;
                // 只有非自主學習才算入平均
                if (s !== -1) {
                    semTs += (s || 0) * c;
                    semTc += c;
                }
            });
            const avg = semTc > 0 ? (semTs / semTc).toFixed(1) : 0;
            if (grades.length > 0) {
                labels.push(sem);
                dataPoints.push(avg);
            }
            // 2. 累加學分詳細統計
            grades.forEach(g => {
                const sc = parseFloat(g.score);
                const cr = parseFloat(g.credit) || 0;
                const cat = g.category || '其他';
                const nature = g.nature || '必修';
                // [修正點] 判斷及格：分數 >= 60 或者 分數 == -1 (自主學習)
                const isPassed = (sc >= 60) || (sc === -1);
                if (isPassed) {
                    totalCreditsEarned += cr;
                    if (!categoryEarned[cat]) {
                        categoryEarned[cat] = { total: 0, "必修": 0, "選修": 0, "必選修": 0 };
                    }
                    categoryEarned[cat].total += cr;
                    if (categoryEarned[cat][nature] !== undefined) {
                        categoryEarned[cat][nature] += cr;
                    }
                    else {
                        categoryEarned[cat]["選修"] += cr;
                    }
                }
            });
        }
    });
    // 以下繪圖邏輯保持不變...
    const ctx = document.getElementById('gradeChart');
    if (ctx) {
        if (gradeChartInstance)
            gradeChartInstance.destroy();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#e0e0e0' : '#666666';
        const gridColor = isDark ? '#444444' : '#dddddd';
        const thresholdLinesPlugin = {
            id: 'thresholdLines',
            beforeDatasetsDraw(chart) {
                const { ctx, scales: { y }, chartArea: { left, right } } = chart;
                ctx.save();
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#f1c40f';
                ctx.setLineDash([5, 5]);
                const y60 = y.getPixelForValue(60);
                if (y60 >= chart.chartArea.top && y60 <= chart.chartArea.bottom) {
                    ctx.beginPath();
                    ctx.moveTo(left, y60);
                    ctx.lineTo(right, y60);
                    ctx.stroke();
                }
                const y80 = y.getPixelForValue(80);
                if (y80 >= chart.chartArea.top && y80 <= chart.chartArea.bottom) {
                    ctx.beginPath();
                    ctx.moveTo(left, y80);
                    ctx.lineTo(right, y80);
                    ctx.stroke();
                }
                ctx.restore();
            }
        };
        gradeChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                        label: '學期平均',
                        data: dataPoints,
                        borderColor: '#4a90e2',
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
            },
            plugins: [thresholdLinesPlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                        title: { display: true, text: '學期', color: textColor }
                    },
                    y: {
                        beginAtZero: false,
                        suggestedMin: 40,
                        suggestedMax: 100,
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                        title: { display: true, text: '平均', color: textColor }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
    updateTotalProgressBar(totalCreditsEarned);
    renderCategoryBreakdown(categoryEarned);
}
// 更新畢業總學分進度條
function updateTotalProgressBar(earned) {
    const progressEl = document.getElementById('credit-progress-bar');
    const totalEl = document.getElementById('total-credits');
    const container = document.getElementById('credit-progress-container');
    if (container)
        container.style.display = 'block';
    if (progressEl && totalEl) {
        // 計算百分比，最大 100%
        const percentage = Math.min((earned / graduationTarget) * 100, 100);
        progressEl.style.width = percentage + '%';
        // 根據進度變換顏色 (紅 -> 黃 -> 綠)
        if (percentage < 30)
            progressEl.style.background = '#e74c3c';
        else if (percentage < 70)
            progressEl.style.background = '#f39c12';
        else
            progressEl.style.background = '#2ecc71';
        totalEl.innerText = earned; // 更新文字數值
    }
}
// 渲染各學分模組 (通識、專業...) 的詳細進度
function renderCategoryBreakdown(earnedMap) {
    const panelUni = document.getElementById('panel-credits-uni'); // 大學面板
    const listUni = document.getElementById('list-credits-uni');
    if (!panelUni)
        return;
    panelUni.style.display = 'block';
    let html = '';
    const order = Object.keys(categoryTargets);
    if (order.length === 0) {
        listUni.innerHTML = '<p style="text-align:center; color:#999;">尚未設定學分模組，請至上方「設定標準」新增。</p>';
        return;
    }
    order.forEach(cat => {
        const data = earnedMap[cat] || { total: 0, "必修": 0, "選修": 0 };
        const targetConfig = categoryTargets[cat];
        // 判斷該類別目標是否細分為必修/選修物件
        const isComplex = (typeof targetConfig === 'object');
        // 簡單模式 (只看總學分，不分必選修)
        if (!isComplex) {
            const target = targetConfig || 0;
            const earned = data.total;
            // 若無目標且無實得學分，則隱藏不顯示
            if (target === 0 && earned === 0 && cat !== "其他")
                return;
            let percent = 0;
            if (target > 0)
                percent = Math.min(Math.round((earned / target) * 100), 100);
            let barColor = percent >= 100 ? "#2ecc71" : "#4a90e2";
            html += `
            <div style="margin-bottom: 12px;">
                <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:4px;">
                    <span style="font-weight:bold; color:#555;">${cat}</span>
                    <span><span style="font-weight:bold; color:${barColor}">${earned > 0 ? earned + ' / ' + target : earned}</span></span>
                </div>
                <div style="background: #eee; border-radius: 6px; height: 10px; width: 100%; overflow: hidden;">
                    <div style="background: ${barColor}; width: ${percent}%; height: 100%;"></div>
                </div>
            </div>`;
        }
        // 複雜模式 (顯示必修與選修雙進度條)
        else {
            const reqTarget = targetConfig["必修"] || 0;
            const eleTarget = targetConfig["選修"] || 0;
            const reqEarned = data["必修"] || 0;
            const eleEarned = (data["選修"] || 0) + (data["必選修"] || 0);
            const reqPercent = reqTarget > 0 ? Math.min(Math.round((reqEarned / reqTarget) * 100), 100) : (reqEarned > 0 ? 100 : 0);
            const elePercent = eleTarget > 0 ? Math.min(Math.round((eleEarned / eleTarget) * 100), 100) : (eleEarned > 0 ? 100 : 0);
            const reqColor = reqPercent >= 100 ? "#2ecc71" : "#e74c3c";
            const eleColor = elePercent >= 100 ? "#2ecc71" : "#f39c12";
            html += `
            <div style="margin-bottom: 15px; background: #fafafa; padding: 10px; border-radius: 8px; border: 1px solid #eee;">
                <div style="font-weight:bold; color:#333; margin-bottom: 8px; font-size: 0.95rem;">${cat}模組</div>
                <div style="margin-bottom: 6px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#666;">
                        <span>必修</span><span>${reqEarned} / ${reqTarget}</span>
                    </div>
                    <div style="background: #e0e0e0; border-radius: 4px; height: 8px; width: 100%; overflow: hidden;">
                        <div style="background: ${reqColor}; width: ${reqPercent}%; height: 100%;"></div>
                    </div>
                </div>
                <div>
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#666;">
                        <span>選修</span><span>${eleEarned} / ${eleTarget}</span>
                    </div>
                    <div style="background: #e0e0e0; border-radius: 4px; height: 8px; width: 100%; overflow: hidden;">
                        <div style="background: ${eleColor}; width: ${elePercent}%; height: 100%;"></div>
                    </div>
                </div>
            </div>`;
        }
    });
    listUni.innerHTML = html;
}
// 更新畢業學分目標數值 (綁定設定頁輸入框)
function updateGraduationTarget(val) {
    const newVal = parseInt(val);
    if (newVal && newVal > 0) {
        graduationTarget = newVal;
        saveData(); // 存檔
    }
    else {
        showAlert("請輸入有效的正整數");
        // 回復原值
        document.getElementById('setting-grad-target').value = graduationTarget;
    }
}
// 切換成績頁面中的子分頁 (總覽、小考、段考、成績單、趨勢、學分)
function switchGradeTab(tabName) {
    const tabs = ['dashboard', 'regular', 'midterm', 'list', 'chart', 'credits'];
    // 隱藏所有分頁
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-grade-${t}`);
        const view = document.getElementById(`subview-grade-${t}`);
        if (btn)
            btn.classList.remove('active');
        if (view)
            view.style.display = 'none';
    });
    // 顯示目標分頁
    const activeBtn = document.getElementById(`tab-grade-${tabName}`);
    const activeView = document.getElementById(`subview-grade-${tabName}`);
    if (activeBtn)
        activeBtn.classList.add('active');
    if (activeView)
        activeView.style.display = 'block';
    // 根據不同分頁執行對應的初始化/渲染函式
    if (tabName === 'dashboard') {
        renderGradeDashboard();
    }
    else if (tabName === 'regular') {
        updateExamSubjectOptions();
        renderRegularExams();
    }
    else if (tabName === 'midterm') {
        updateExamSubjectOptions();
        renderMidtermExams();
    }
    else if (tabName === 'list') {
        loadGrades();
    }
    if (tabName === 'credits') {
        renderAnalysis(); //選染進度條
        renderCreditSettings(); // 喧染學校資訊與設定數值
    }
    else if (tabName === 'chart') {
        setTimeout(() => {
            if (typeof renderAnalysis === 'function')
                renderAnalysis();
        }, 50);
    }
}
// 渲染「總覽」分頁的統計儀表板
function renderGradeDashboard() {
    let totalScore = 0; // 加權總分 (分子)
    let totalCreditsForGpa = 0; // GPA 計算用的總學分 (分母)
    let earnedCredits = 0; // 實際獲得的總學分 (包含自主學習)
    let failedCount = 0; // 不及格科目數
    // 計算總體數據
    gradeList.forEach(g => {
        const score = parseFloat(g.score); // 取得原始分數 (可能是 -1)
        const credit = parseFloat(g.credit) || 0;
        // 判斷是否為自主學習 (分數為 -1)
        const isSelfStudy = (score === -1);
        if (isSelfStudy) {
            // --- 自主學習邏輯 ---
            // 1. 算入實得學分
            earnedCredits += credit;
            // 2. 不算入 GPA 分子與分母
            // 3. 不算是不及格
        }
        else {
            // --- 一般課程邏輯 ---
            const valScore = score || 0;
            const isPass = valScore >= 60;
            // 只有一般課程才算入 GPA
            totalScore += valScore * credit;
            totalCreditsForGpa += credit;
            if (isPass)
                earnedCredits += credit;
            else
                failedCount++;
        }
    });
    // 計算 GPA (分母改用排除自主學習後的 totalCreditsForGpa)
    const avg = totalCreditsForGpa > 0 ? (totalScore / totalCreditsForGpa).toFixed(1) : "0.0";
    // 更新介面數字
    const elGpa = document.getElementById('dash-gpa');
    const elCredits = document.getElementById('dash-credits');
    const elFailed = document.getElementById('dash-failed');
    if (elGpa)
        elGpa.innerText = avg;
    if (elCredits)
        elCredits.innerText = earnedCredits;
    if (elFailed)
        elFailed.innerText = failedCount;
}
// [新增] 渲染學分設定介面 (學校資訊 + 編輯列表)
function renderCreditSettings() {
    // 1. 更新顯示模式的學校資訊
    const displayEl = document.getElementById('school-info-display');
    if (displayEl) {
        if (userSchoolInfo.school || userSchoolInfo.department) {
            displayEl.innerHTML = `🏫 ${userSchoolInfo.school} ${userSchoolInfo.department}`;
        }
        else {
            displayEl.innerHTML = `(尚未設定學校科系)`;
        }
    }
    // 2. 更新編輯模式的輸入框
    const schoolInput = document.getElementById('input-school-name');
    const deptInput = document.getElementById('input-dept-name');
    const gradInput = document.getElementById('edit-grad-target');
    const textGradTarget = document.getElementById('text-grad-target');
    if (schoolInput)
        schoolInput.value = userSchoolInfo.school || "";
    if (deptInput)
        deptInput.value = userSchoolInfo.department || "";
    if (gradInput)
        gradInput.value = graduationTarget;
    if (textGradTarget)
        textGradTarget.innerText = graduationTarget;
    // 3. 渲染編輯列表 (edit-settings-uni)
    const editUni = document.getElementById('edit-settings-uni');
    if (!editUni)
        return;
    let editHtml = '';
    const categories = Object.keys(categoryTargets);
    if (categories.length === 0) {
        editHtml = '<div style="color:#999; text-align:center; padding:10px;">目前沒有任何模組，請由下方新增。</div>';
    }
    else {
        categories.forEach(cat => {
            const target = categoryTargets[cat];
            editHtml += `
            <div style="margin-top: 10px; background:#fafafa; padding:12px; border-radius:6px; border:1px solid #eee;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:bold; color:#333;">${cat}</span>
                    <button onclick="deleteCategory('${cat}')" style="background:#ffebee; color:#c62828; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem; padding:4px 10px;">🗑️ 刪除</button>
                </div>
                <div style="display: flex; gap: 10px;">`;
            if (typeof target === 'object') {
                // 複雜模式 (分必選修)
                editHtml += `
                    <div style="flex: 1;"><span style="font-size: 0.8rem; color:#666;">必修</span><input type="number" id="edit-cat-${cat}-req" value="${target['必修'] || 0}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></div>
                    <div style="flex: 1;"><span style="font-size: 0.8rem; color:#666;">選修</span><input type="number" id="edit-cat-${cat}-ele" value="${target['選修'] || 0}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></div>`;
            }
            else {
                // 簡單模式 (單一數值)
                editHtml += `<div style="flex: 1;"><span style="font-size: 0.8rem; color:#666;">目標學分</span><input type="number" id="edit-cat-${cat}-total" value="${target || 0}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></div>`;
            }
            editHtml += `</div></div>`;
        });
    }
    editUni.innerHTML = editHtml;
}
// [新增] 切換學分 檢視/編輯 模式
function toggleCreditEdit() {
    const viewDiv = document.getElementById('credits-view-mode');
    const editDiv = document.getElementById('credits-edit-mode');
    const btn = document.getElementById('btn-edit-credits');
    // 判斷目前狀態 (若 editDiv 顯示中，代表要關閉編輯)
    if (editDiv.style.display === 'block') {
        viewDiv.style.display = 'block';
        editDiv.style.display = 'none';
        btn.style.display = 'block'; // 顯示設定按鈕
        renderAnalysis(); // 刷新圖表與進度條
    }
    else {
        viewDiv.style.display = 'none';
        editDiv.style.display = 'block';
        btn.style.display = 'none'; // 隱藏設定按鈕
        renderCreditSettings(); // 渲染編輯介面數值
    }
}
// [新增] 新增分類邏輯
window.addNewCategory = function () {
    const nameInput = document.getElementById('new-cat-name');
    const typeInput = document.getElementById('new-cat-type');
    const name = nameInput.value.trim();
    if (!name) {
        showAlert("請輸入分類名稱");
        return;
    }
    if (categoryTargets[name]) {
        showAlert("這個分類已經存在囉！");
        return;
    }
    // 初始化
    if (typeInput.value === 'complex') {
        categoryTargets[name] = { "必修": 0, "選修": 0 };
    }
    else {
        categoryTargets[name] = 0;
    }
    nameInput.value = '';
    renderCreditSettings(); // 重新渲染列表
};
// [新增] 刪除分類邏輯
window.deleteCategory = function (name) {
    if (confirm(`確定要刪除「${name}」分類嗎？\n(這不會刪除已登記的成績，但在統計時會被歸類到「其他」)`)) {
        delete categoryTargets[name];
        renderCreditSettings();
    }
};
// [新增] 儲存學分設定
function saveCreditSettings() {
    // 1. 儲存學校資訊
    const schoolInput = document.getElementById('input-school-name');
    const deptInput = document.getElementById('input-dept-name');
    if (schoolInput)
        userSchoolInfo.school = schoolInput.value.trim();
    if (deptInput)
        userSchoolInfo.department = deptInput.value.trim();
    // 2. 儲存畢業總目標
    const gradInput = document.getElementById('edit-grad-target');
    if (gradInput)
        graduationTarget = parseInt(gradInput.value) || 128;
    // 3. 儲存各分類目標
    const categories = Object.keys(categoryTargets);
    categories.forEach(cat => {
        const target = categoryTargets[cat];
        if (typeof target === 'object') {
            const req = document.getElementById(`edit-cat-${cat}-req`);
            const ele = document.getElementById(`edit-cat-${cat}-ele`);
            if (req && ele) {
                categoryTargets[cat]['必修'] = parseInt(req.value) || 0;
                categoryTargets[cat]['選修'] = parseInt(ele.value) || 0;
            }
        }
        else {
            const total = document.getElementById(`edit-cat-${cat}-total`);
            if (total)
                categoryTargets[cat] = parseInt(total.value) || 0;
        }
    });
    saveData(); // 存檔 (會觸發 refreshUI)
    toggleCreditEdit(); // 切回檢視模式
    showAlert("設定已更新！", "成功");
    // 更新成績輸入視窗的下拉選單
    if (typeof updateGradeCategoryOptions === 'function')
        updateGradeCategoryOptions();
}
