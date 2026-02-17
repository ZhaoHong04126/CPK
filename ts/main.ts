// js/main.ts

// 宣告 initUI，因為它還在 ui.js 裡
declare function initUI(): void;

// 程式啟動，監聽 Firebase Auth 狀態變更
auth.onAuthStateChanged((user: any) => {
    // 如果有使用者登入
    if (user) {
        // user 型別雖然是 any，但我們知道它符合 FirebaseUser 介面，所以可以 assign
        currentUser = user;
        updateLoginUI(true); // 這個在 auth.ts 定義了，TS 看得到
        loadData(); // 這個在 data.ts 定義了
        initUI(); // 呼叫 ui.js 的函式
        checkAdminStatus(); // auth.ts
    } else {
        currentUser = null;
        updateLoginUI(false);
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) adminPanel.style.display = 'none';
    }
});