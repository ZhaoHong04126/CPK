// js/learning.ts

interface LearningTask {
    id: number;
    subject: string;
    content: string;
    current: number;
    total: number;
    unit: string;
}

declare var learningList: LearningTask[];
declare function saveData(): void;
declare function openModal(id: string): void;
declare function closeModal(id: string): void;
declare function showAlert(msg: string): Promise<void>;

function renderLearning(): void {
    const list = document.getElementById('learning-list');
    if (!list) return;

    list.innerHTML = '';
    const tasks = learningList || [];

    tasks.forEach(task => {
        const percent = Math.min((task.current / task.total) * 100, 100);
        const color = percent >= 100 ? '#2ecc71' : (percent < 50 ? '#e74c3c' : '#f1c40f');
        
        const div = document.createElement('div');
        div.className = 'card';
        div.style.marginBottom = '10px';
        div.style.padding = '15px';
        
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span style="font-weight:bold;">${task.subject}</span>
                <span style="font-size:0.9rem; color:#666;">${task.content}</span>
            </div>
            <div style="background:#eee; height:10px; border-radius:5px; overflow:hidden; margin:10px 0;">
                <div style="width:${percent}%; background:${color}; height:100%; transition:width 0.5s;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.85rem; color:${color}; font-weight:bold;">${Math.round(percent)}%</span>
                <div style="display:flex; align-items:center; gap:5px;">
                    <button onclick="updateLearningProgress(${task.id}, -1)" class="btn-sm">-</button>
                    <span style="font-size:0.9rem;">${task.current} / ${task.total} ${task.unit}</span>
                    <button onclick="updateLearningProgress(${task.id}, 1)" class="btn-sm">+</button>
                    <button onclick="deleteLearningTask(${task.id})" style="margin-left:10px; color:#ccc; border:none; background:none;">&times;</button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

function addLearningTask(): void {
    const iSub = document.getElementById('input-learn-subject') as HTMLInputElement;
    const iCont = document.getElementById('input-learn-content') as HTMLInputElement;
    const iCurr = document.getElementById('input-learn-current') as HTMLInputElement;
    const iTot = document.getElementById('input-learn-total') as HTMLInputElement;
    const iUnit = document.getElementById('input-learn-unit') as HTMLInputElement;

    if (!iSub.value || !iTot.value) {
        showAlert("請輸入科目和目標值");
        return;
    }

    const newTask: LearningTask = {
        id: Date.now(),
        subject: iSub.value,
        content: iCont.value,
        current: parseFloat(iCurr.value) || 0,
        total: parseFloat(iTot.value),
        unit: iUnit.value || '頁'
    };

    learningList.push(newTask);
    saveData();
    renderLearning();
    closeModal('learning-modal');
}

function updateLearningProgress(id: number, delta: number): void {
    const task = learningList.find(t => t.id === id);
    if (task) {
        task.current += delta;
        if (task.current < 0) task.current = 0;
        if (task.current > task.total) task.current = task.total;
        saveData();
        renderLearning();
    }
}

function deleteLearningTask(id: number): void {
    const idx = learningList.findIndex(t => t.id === id);
    if (idx > -1) {
        learningList.splice(idx, 1);
        saveData();
        renderLearning();
    }
}

function openLearningModal(): void { openModal('learning-modal'); }