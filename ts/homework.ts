// js/homework.ts

interface HomeworkItem {
    id: number;
    subject: string;
    title: string;
    date: string; // "YYYY-MM-DD"
    isDone: boolean;
    score?: number;
    total?: number;
}

declare var homeworkList: HomeworkItem[];
declare function saveData(): void;
declare function openModal(id: string): void;
declare function closeModal(id: string): void;
declare function showAlert(msg: string): Promise<void>;
declare function loadSubjectOptionsToSelect(id: string): void; // 借用 grade.ts 的函式
declare function toggleGradeInputMode(): void; // 借用 grade.ts 的 UI 邏輯 (或者自己寫一個)

function renderHomework(): void {
    const list = document.getElementById('homework-list');
    const summary = document.getElementById('homework-summary');
    if (!list) return;

    list.innerHTML = '';
    const items = homeworkList || [];
    
    // 統計
    const pending = items.filter(i => !i.isDone).length;
    if (summary) summary.innerText = `待完成: ${pending} 項`;

    // 排序：未完成的在上面，日期近的在上面
    items.sort((a, b) => {
        if (a.isDone === b.isDone) {
            return a.date.localeCompare(b.date);
        }
        return a.isDone ? 1 : -1;
    });

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = `homework-item card ${item.isDone ? 'done' : ''}`;
        // 假設 CSS 有 .homework-item.done { opacity: 0.6; text-decoration: line-through; }
        div.style.padding = '10px';
        div.style.marginBottom = '8px';
        div.style.borderLeft = item.isDone ? '4px solid #ccc' : '4px solid #e74c3c';
        
        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                <input type="checkbox" ${item.isDone ? 'checked' : ''} onchange="toggleHomeworkDone(${item.id})" style="transform:scale(1.2); margin-right:10px;">
                <div style="flex:1;">
                    <div style="font-weight:bold; font-size:1rem;">${item.subject} - ${item.title}</div>
                    <div style="font-size:0.85rem; color:#666;">
                        📅 ${item.date} 
                        ${item.score !== undefined ? ` | 🏅 ${item.score}/${item.total || 100}` : ''}
                    </div>
                </div>
                <button onclick="deleteHomework(${item.id})" style="color:#ccc; border:none; background:none;">&times;</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function addHomework(): void {
    // 這裡的邏輯與 addGrade 類似，取得科目、標題等
    const selectSub = document.getElementById('input-hw-subject-select') as HTMLSelectElement;
    const textSub = document.getElementById('input-hw-subject-text') as HTMLInputElement;
    let subject = '';
    
    if (textSub && textSub.style.display !== 'none') subject = textSub.value;
    else if (selectSub) subject = selectSub.value;

    const iTitle = document.getElementById('input-hw-title') as HTMLInputElement;
    const iDate = document.getElementById('input-hw-date') as HTMLInputElement;
    const iScore = document.getElementById('input-hw-score') as HTMLInputElement;
    const iTotal = document.getElementById('input-hw-total') as HTMLInputElement;

    if (!subject || !iTitle.value || !iDate.value) {
        showAlert("科目、標題、日期為必填");
        return;
    }

    const newItem: HomeworkItem = {
        id: Date.now(),
        subject: subject,
        title: iTitle.value,
        date: iDate.value,
        isDone: false,
    };
    
    if (iScore.value) {
        newItem.score = parseFloat(iScore.value);
        newItem.total = parseFloat(iTotal.value) || 100;
    }

    homeworkList.push(newItem);
    saveData();
    renderHomework();
    closeModal('homework-modal');
}

function toggleHomeworkDone(id: number): void {
    const item = homeworkList.find(i => i.id === id);
    if (item) {
        item.isDone = !item.isDone;
        saveData();
        renderHomework();
    }
}

function deleteHomework(id: number): void {
    const idx = homeworkList.findIndex(i => i.id === id);
    if (idx > -1) {
        homeworkList.splice(idx, 1);
        saveData();
        renderHomework();
    }
}

function openHomeworkModal(): void {
    // 載入科目
    if(typeof loadSubjectOptionsToSelect === 'function') {
        loadSubjectOptionsToSelect('input-hw-subject-select');
    }
    openModal('homework-modal');
}

// 切換手寫/選單模式
function toggleHomeworkSubjectMode(): void {
    const selectSub = document.getElementById('input-hw-subject-select') as HTMLSelectElement;
    const textSub = document.getElementById('input-hw-subject-text') as HTMLInputElement;
    if (selectSub && textSub) {
        if (selectSub.style.display === 'none') {
            selectSub.style.display = 'block';
            textSub.style.display = 'none';
        } else {
            selectSub.style.display = 'none';
            textSub.style.display = 'block';
        }
    }
}