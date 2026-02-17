// js/ui.ts

// 宣告全域變數 (來自其他檔案)
// 因為我們還沒把所有檔案都轉成 TS，有時候 TS 可能會追蹤不到，保險起見可以宣告
declare var navHistory: any[]; 

// 1. 頁面切換
function switchTab(tabId: string): void {
    // 隱藏所有 view
    const views = document.querySelectorAll('[id^="view-"]');
    views.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
    });

    // 顯示目標 view
    const target = document.getElementById('view-' + tabId);
    if (target) {
        target.style.display = 'block';
        
        // 特殊處理: 如果是首頁，隱藏 Top Bar 的返回鍵，否則顯示
        const backBtn = document.getElementById('nav-back-btn');
        if (backBtn) {
            backBtn.style.display = (tabId === 'home') ? 'none' : 'block';
        }
        
        // 紀錄歷史 (簡單實作)
        if (typeof navHistory === 'undefined') {
            (window as any).navHistory = [];
        }
        (window as any).navHistory.push(tabId);
    }
}

function goBack(): void {
    const history = (window as any).navHistory;
    if (history && history.length > 1) {
        history.pop(); // 移除當前
        const prev = history[history.length - 1];
        switchTab(prev);
        // switchTab 會再 push 一次，所以要 pop 掉剛剛 push 的，避免重複 (簡易邏輯)
        history.pop(); 
    } else {
        switchTab('home');
    }
}

// 2. 彈窗 (Modal) 控制
function openModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex'; // Flex 讓它置中
        // 點擊背景關閉
        modal.onclick = (e) => {
            if (e.target === modal) closeModal(modalId);
        };
    }
}

function closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// 所有的關閉按鈕通用的函式 (HTML onclick 用)
function closeLoginModal() { closeModal('login-overlay'); }
function openLoginModal() { 
    const overlay = document.getElementById('login-overlay');
    if(overlay) overlay.style.display = 'flex'; 
}
function closeScheduleModal() { closeModal('schedule-modal'); }
function closeEditModal() { closeModal('course-modal'); }
function closeCalendarModal() { closeModal('calendar-modal'); }
function closeRegularModal() { closeModal('regular-exam-modal'); }
function closeMidtermModal() { closeModal('midterm-exam-modal'); }
function closeGradeModal() { closeModal('grade-modal'); }
function closeAccountingModal() { closeModal('accounting-modal'); }
function closeNoteModal() { closeModal('note-modal'); }
function closeAnniversaryModal() { closeModal('anniversary-modal'); }
function closeLearningModal() { closeModal('learning-modal'); }
function closeHomeworkModal() { closeModal('homework-modal'); }
function closeReplyModal() { closeModal('reply-modal'); }

// 3. 自訂 Alert / Confirm / Prompt
// 這些函式回傳 Promise，讓呼叫端可以用 .then() 或 await 等待結果

function showAlert(message: string, title: string = "提示"): Promise<void> {
    return new Promise((resolve) => {
        // 這裡為了簡化，使用瀏覽器原生 alert，你也可以改寫成漂亮的 Modal
        // 但為了相容原本的邏輯，我們先暫時用 alert (或者你的專案如果有 custom-modal 可以在這裡實作)
        
        // 偵測是否有 custom-modal (你的 index.html 裡有)
        const modal = document.getElementById('custom-modal');
        if (modal) {
            const mTitle = document.getElementById('custom-modal-title');
            const mMsg = document.getElementById('custom-modal-message');
            const mActions = document.getElementById('custom-modal-actions');
            const mInputContainer = document.getElementById('custom-modal-input-container');

            if (mTitle) mTitle.innerText = title;
            if (mMsg) mMsg.innerText = message;
            if (mInputContainer) mInputContainer.style.display = 'none';

            if (mActions) {
                mActions.innerHTML = '';
                const btn = document.createElement('button');
                btn.className = 'btn';
                btn.style.background = '#333';
                btn.innerText = '確定';
                btn.onclick = () => {
                    modal.style.display = 'none';
                    resolve();
                };
                mActions.appendChild(btn);
            }
            modal.style.display = 'flex';
        } else {
            // Fallback
            alert(`${title}\n\n${message}`);
            resolve();
        }
    });
}

function showConfirm(message: string, title: string = "確認"): Promise<boolean> {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        if (modal) {
            const mTitle = document.getElementById('custom-modal-title');
            const mMsg = document.getElementById('custom-modal-message');
            const mActions = document.getElementById('custom-modal-actions');
            const mInputContainer = document.getElementById('custom-modal-input-container');

            if (mTitle) mTitle.innerText = title;
            if (mMsg) mMsg.innerText = message;
            if (mInputContainer) mInputContainer.style.display = 'none';

            if (mActions) {
                mActions.innerHTML = '';
                
                // 取消按鈕
                const btnCancel = document.createElement('button');
                btnCancel.className = 'btn';
                btnCancel.style.background = 'transparent';
                btnCancel.style.color = '#555';
                btnCancel.style.border = '1px solid #ddd';
                btnCancel.innerText = '取消';
                btnCancel.onclick = () => {
                    modal.style.display = 'none';
                    resolve(false);
                };
                
                // 確定按鈕
                const btnOk = document.createElement('button');
                btnOk.className = 'btn';
                btnOk.style.background = 'var(--primary, #4a90e2)';
                btnOk.innerText = '確定';
                btnOk.onclick = () => {
                    modal.style.display = 'none';
                    resolve(true);
                };

                mActions.appendChild(btnCancel);
                mActions.appendChild(btnOk);
            }
            modal.style.display = 'flex';
        } else {
            const result = confirm(`${title}\n\n${message}`);
            resolve(result);
        }
    });
}

function showPrompt(message: string, defaultValue: string = "", title: string = "輸入"): Promise<string | null> {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        if (modal) {
            const mTitle = document.getElementById('custom-modal-title');
            const mMsg = document.getElementById('custom-modal-message');
            const mActions = document.getElementById('custom-modal-actions');
            const mInputContainer = document.getElementById('custom-modal-input-container');
            const mInput = document.getElementById('custom-modal-input') as HTMLInputElement;

            if (mTitle) mTitle.innerText = title;
            if (mMsg) mMsg.innerText = message;
            
            if (mInputContainer) mInputContainer.style.display = 'block';
            if (mInput) {
                mInput.value = defaultValue;
                mInput.focus();
            }

            if (mActions) {
                mActions.innerHTML = '';
                
                const btnCancel = document.createElement('button');
                btnCancel.className = 'btn';
                btnCancel.style.background = 'transparent';
                btnCancel.style.color = '#555';
                btnCancel.style.border = '1px solid #ddd';
                btnCancel.innerText = '取消';
                btnCancel.onclick = () => {
                    modal.style.display = 'none';
                    resolve(null);
                };
                
                const btnOk = document.createElement('button');
                btnOk.className = 'btn';
                btnOk.style.background = 'var(--primary, #4a90e2)';
                btnOk.innerText = '確定';
                btnOk.onclick = () => {
                    modal.style.display = 'none';
                    resolve(mInput ? mInput.value : "");
                };

                mActions.appendChild(btnCancel);
                mActions.appendChild(btnOk);
            }
            modal.style.display = 'flex';
        } else {
            const result = prompt(`${title}\n\n${message}`, defaultValue);
            resolve(result);
        }
    });
}

// 初始化 UI (在 main.ts 呼叫)
function initUI(): void {
    // 綁定某些動態事件或初始化狀態
    // 目前你的專案大多是 inline onclick，所以這裡可能不需要做太多事
    // 但可以把深色模式的初始化放在這
    const themeStatus = document.getElementById('theme-status');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeStatus) themeStatus.innerText = "ON";
    }
}

function toggleTheme(): void {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const themeStatus = document.getElementById('theme-status');
    if (themeStatus) themeStatus.innerText = isDark ? "ON" : "OFF";
}