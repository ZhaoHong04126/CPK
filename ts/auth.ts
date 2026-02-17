// js/auth.ts

// 1. 宣告那些還在 ui.js 的函式，讓 TS 認識它們
declare function showAlert(message: string, title?: string): Promise<void>;
declare function showConfirm(message: string, title?: string): Promise<boolean>;
declare function showPrompt(message: string, defaultValue?: string, title?: string): Promise<string | null>;
declare function initUI(): void; // 在 main.js 會用到，但因為 auth 比較早載入，放這裡也行，或放 main.ts
declare function loadData(): void; // 在 data.ts (等下會改)

// 2. 宣告來自 firebase.ts 的變數
declare const auth: any;
declare const provider: any;
declare const db: any;
declare const ADMIN_UID: string;

// --- 以下是程式碼邏輯 ---

// 切換登入/註冊模式
function toggleLoginMode() {
    isRegisterMode = !isRegisterMode; // isRegisterMode 在 state.ts 定義過，這裡是全域變數
    
    // 取得 DOM 元素 (加上 as HTMLElement 強制轉型，告訴 TS 這一定是 HTML 元素)
    const btn = document.getElementById('btn-submit') as HTMLElement;
    const toggleBtn = document.getElementById('toggle-btn') as HTMLElement;
    const toggleText = document.getElementById('toggle-text') as HTMLElement;
    
    if (isRegisterMode) { 
        btn.innerText = "註冊並登入"; 
        toggleText.innerText = "已經有帳號？"; 
        toggleBtn.innerText = "直接登入"; 
    } else { 
        btn.innerText = "登入"; 
        toggleText.innerText = "還沒有帳號？"; 
        toggleBtn.innerText = "建立新帳號"; 
    }
}

// 處理 Email 登入/註冊
function handleEmailAuth() {
    // 取得輸入框的值 (HTMLInputElement 才會有 .value)
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    
    if (!email || !password) { 
        showAlert("請輸入 Email 和密碼", "資料不全"); 
        return; 
    }
    
    if (isRegisterMode) {
        auth.createUserWithEmailAndPassword(email, password)
            .catch((e: any) => showAlert(e.message, "註冊失敗"));
    } else {
        auth.signInWithEmailAndPassword(email, password)
            .catch((e: any) => showAlert(e.message, "登入失敗"));
    }
}

// Google 登入
function loginWithGoogle() {
    auth.signInWithPopup(provider).catch((e: any) => showAlert(e.message, "登入錯誤"));
}

// 匿名登入
function loginAnonymously() {
    auth.signInAnonymously().catch((e: any) => showAlert(e.message, "登入錯誤"));
}

// 登出
function logout() {
    if (currentUser && currentUser.isAnonymous) {
        showConfirm("⚠️ 匿名帳號登出後資料會消失，確定嗎？", "警告").then((ok) => {
            if (ok) performLogout();
        });
    } else {
        performLogout();
    }
}

function performLogout() {
    auth.signOut().then(() => window.location.reload());
}

// 註銷帳號
function deleteAccount() {
    if (!currentUser) return;

    showConfirm("⚠️ 警告：此動作將「永久刪除」您的所有資料，且無法復原！\n\n確定要註銷帳號嗎？", "危險操作")
    .then((isConfirmed) => {
        if (isConfirmed) {
            return showPrompt("為了確認您的意願，請輸入「DELETE」", "", "最終確認");
        }
        return null;
    })
    .then((inputStr) => {
        if (inputStr === "DELETE") {
            if(!currentUser) return; // 再次檢查
            const uid = currentUser.uid;
            
            // TS 不知道 window 上有 showAlert (因為它是我們自訂的)，但上面 declare 過了
            showAlert("正在刪除資料，請稍候...", "處理中");

            db.collection("users").doc(uid).delete()
            .then(() => {
                const dbKey = 'CampusKing_v6.0_' + uid;
                localStorage.removeItem(dbKey);
                // currentUser 可能變了，所以要小心，這裡假設它還在
                return currentUser!.delete(); // ! 代表我確定它不是 null
            })
            .then(() => {
                alert("帳號已成功註銷，感謝您的使用。"); 
                window.location.reload();
            })
            .catch((error: any) => {
                console.error("Delete error:", error);
                if (error.code === 'auth/requires-recent-login') {
                    showAlert("🔒 為了確保帳號安全，系統要求您必須「重新登入」後才能執行刪除操作。", "驗證過期");
                } else {
                    showAlert("註銷失敗：" + error.message, "錯誤");
                }
            });
        } else if (inputStr !== null) {
            showAlert("輸入內容不正確，已取消操作。", "取消");
        }
    });
}

// 更新 UI 狀態
function updateLoginUI(isLoggedIn: boolean) {
    const loginOverlay = document.getElementById('login-overlay');
    const landingPage = document.getElementById('landing-page');
    const dashboard = document.querySelector('.dashboard-container') as HTMLElement;
    const topBar = document.getElementById('top-bar'); 
    const userInfo = document.getElementById('user-info');
    const userPhoto = document.getElementById('user-photo') as HTMLImageElement;

    console.log("Login Status:", isLoggedIn);

    if (isLoggedIn) {
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (landingPage) landingPage.style.display = 'none';
        if (dashboard) dashboard.style.display = 'grid';
        if (topBar) topBar.style.display = 'flex'; 
        if (userInfo) userInfo.style.display = 'flex';
        if (userPhoto && currentUser) {
            userPhoto.src = currentUser.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png";
        }
    } else {
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (landingPage) landingPage.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';
        if (topBar) topBar.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
    }
}

// 忘記密碼
function forgotPassword() {
    const email = (document.getElementById('email') as HTMLInputElement).value;
    if (!email) {
        showAlert("請先在上方輸入您的 Email", "缺少 Email");
        return;
    }
    showConfirm(`確定要寄送重設密碼信件至 ${email} 嗎？`, "重設密碼").then((isConfirmed) => {
        if (isConfirmed) {
            auth.sendPasswordResetEmail(email)
            .then(() => showAlert("📧 重設信已寄出！", "寄送成功"))
            .catch((error: any) => {
                let msg = "發送失敗：" + error.message;
                if (error.code === 'auth/user-not-found') msg = "找不到此 Email 的使用者。";
                showAlert(msg, "錯誤");
            });
        }
    });
}

// 檢查管理員
function checkAdminStatus() {
    if (currentUser && typeof ADMIN_UID !== 'undefined' && currentUser.uid === ADMIN_UID) {
        console.log("👨‍💻 管理員已登入");
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) adminPanel.style.display = 'block';
    }
}