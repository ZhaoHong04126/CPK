// js/lottery.ts

// 宣告全域變數
declare var lotteryList: string[]; // 籤筒列表 (單純的字串陣列)
declare function saveData(): void;
declare function showAlert(msg: string, title?: string): Promise<void>;
declare function showConfirm(msg: string, title?: string): Promise<boolean>;

// 1. 渲染籤筒列表
function renderLottery(): void {
    const list = document.getElementById('lottery-list');
    const select = document.getElementById('lottery-category-select') as HTMLSelectElement;
    
    // 如果有分類功能 (這裡簡化，假設 lotteryList 就是目前分類的項目)
    if (list) {
        list.innerHTML = '';
        (lotteryList || []).forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'lottery-item'; // 假設 CSS
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.padding = '8px';
            div.style.borderBottom = '1px solid #eee';
            
            div.innerHTML = `
                <span>${item}</span>
                <button onclick="deleteLotteryItem(${index})" style="color:#e74c3c; border:none; background:none; cursor:pointer;">&times;</button>
            `;
            list.appendChild(div);
        });
    }
}

// 2. 新增選項
function addLotteryItem(): void {
    const input = document.getElementById('input-lottery-item') as HTMLInputElement;
    if (!input) return;

    const val = input.value.trim();
    if (val) {
        if (!lotteryList) lotteryList = []; // 防呆
        lotteryList.push(val);
        saveData();
        renderLottery();
        input.value = '';
    }
}

// 3. 刪除選項
function deleteLotteryItem(index: number): void {
    if (lotteryList && lotteryList[index]) {
        lotteryList.splice(index, 1);
        saveData();
        renderLottery();
    }
}

// 4. 開始抽籤 (動畫效果)
function startLottery(): void {
    if (!lotteryList || lotteryList.length === 0) {
        showAlert("籤筒是空的，請先新增選項！");
        return;
    }

    const resultBox = document.getElementById('lottery-result-text');
    const btn = document.getElementById('btn-draw') as HTMLButtonElement;
    
    if (!resultBox || !btn) return;

    btn.disabled = true; // 防止連點
    let counter = 0;
    const maxTimes = 20; // 跳動次數
    
    // 快速跳動動畫
    const interval = setInterval(() => {
        const randIndex = Math.floor(Math.random() * lotteryList.length);
        resultBox.innerText = lotteryList[randIndex];
        resultBox.style.color = '#aaa';
        
        counter++;
        if (counter >= maxTimes) {
            clearInterval(interval);
            // 最終結果
            const finalIndex = Math.floor(Math.random() * lotteryList.length);
            resultBox.innerText = "🎉 " + lotteryList[finalIndex];
            resultBox.style.color = '#e74c3c';
            resultBox.style.transform = 'scale(1.2)';
            setTimeout(() => { resultBox.style.transform = 'scale(1)'; }, 200);
            
            btn.disabled = false;
        }
    }, 50); // 每 50ms 跳一次
}

// 這裡省略了「分類管理」的複雜邏輯，你可以依據需求補上
// 只要記得用 as HTMLSelectElement 轉型即可
// js/lottery.ts

// 1. 切換分類
function switchLotteryCategory(): void {
    const select = document.getElementById('lottery-category-select') as HTMLSelectElement;
    if (select) {
        const newCat = select.value;
        currentLotteryCategory = newCat;
        
        // 關鍵：把「目前的清單」指向「選中分類的資料」
        lotteryList = lotteryData[newCat];
        
        saveData(); // 記住使用者的選擇
        renderLottery();
    }
}

// 2. 新增分類
function addNewLotteryCategory(): void {
    showPrompt("請輸入新分類名稱 (例如: 飲料)", "", "新增籤筒").then(name => {
        if (name) {
            if (lotteryData[name]) {
                showAlert("這個分類已經存在囉！");
                return;
            }
            // 建立一個空陣列給它
            lotteryData[name] = [];
            
            // 自動切換過去
            currentLotteryCategory = name;
            lotteryList = lotteryData[name];
            
            saveData();
            renderLottery();
            showAlert(`已新增並切換至：${name}`);
        }
    });
}

// 3. 刪除分類
function deleteLotteryCategory(): void {
    // 預設分類不能刪除
    if (currentLotteryCategory === "預設") {
        showAlert("「預設」分類不能刪除喔！");
        return;
    }

    showConfirm(`確定要刪除「${currentLotteryCategory}」這個分類嗎？\n裡面的籤都會消失喔！`).then(ok => {
        if (ok) {
            // 刪除該 Key
            delete lotteryData[currentLotteryCategory];
            
            // 切換回預設
            currentLotteryCategory = "預設";
            lotteryList = lotteryData["預設"];
            
            saveData();
            renderLottery();
            showAlert("分類已刪除");
        }
    });
}