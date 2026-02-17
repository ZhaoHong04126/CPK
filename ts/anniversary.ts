// js/anniversary.ts

// 定義紀念日形狀
interface Anniversary {
    id: number;
    title: string;
    date: string; // "YYYY-MM-DD"
}

declare var anniversaryList: Anniversary[];
declare function saveData(): void;

function renderAnniversaries(): void {
    const list = document.getElementById('anniversary-list');
    if (!list) return;

    list.innerHTML = '';
    const items = anniversaryList || [];

    if (items.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#999; margin-top:30px;">還沒有紀念日，快去新增一個吧！💖</p>';
        return;
    }

    // 依日期排序
    items.sort((a, b) => a.date.localeCompare(b.date));

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.marginBottom = '10px';
        div.style.padding = '15px';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';

        // 計算天數
        const days = calculateDaysDiff(item.date);
        let tag = '';
        let textClass = '';

        if (days === 0) {
            tag = '🎉 今天！';
            textClass = 'color: #e74c3c; font-weight:bold;';
        } else if (days > 0) {
            tag = `還有 ${days} 天`;
            textClass = 'color: #3498db;';
        } else {
            tag = `已過 ${Math.abs(days)} 天`;
            textClass = 'color: #999;';
        }

        div.innerHTML = `
            <div>
                <div style="font-size:1.1rem; font-weight:bold;">${item.title}</div>
                <div style="font-size:0.85rem; color:#888;">${item.date}</div>
            </div>
            <div style="text-align:right;">
                <div style="${textClass} font-size:1.2rem;">${tag}</div>
                <button onclick="deleteAnniversary(${item.id})" style="font-size:0.8rem; color:#ccc; border:none; background:none; cursor:pointer; margin-top:5px;">刪除</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function calculateDaysDiff(targetDateStr: string): number {
    const now = new Date();
    // 把時間歸零，只比日期
    now.setHours(0, 0, 0, 0);
    
    const target = new Date(targetDateStr);
    // target 也歸零 (雖然輸入通常就是 00:00，但保險起見)
    // 注意：Date(string) 預設是 UTC，這裡為了簡單，假設使用者輸入的是當地時間
    // 更好的作法是用 new Date(y, m-1, d) 來確保是當地時間
    // 這裡簡化處理：
    const targetLocal = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    if (isNaN(targetLocal.getTime())) return 0; // 防止錯誤日期

    const diffMs = targetLocal.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function addAnniversary(): void {
    const iTitle = document.getElementById('input-anniv-title') as HTMLInputElement;
    const iDate = document.getElementById('input-anniv-date') as HTMLInputElement;

    if (!iTitle.value || !iDate.value) {
        showAlert("請輸入標題與日期");
        return;
    }

    const newItem: Anniversary = {
        id: Date.now(),
        title: iTitle.value,
        date: iDate.value
    };

    anniversaryList.push(newItem);
    saveData();
    renderAnniversaries();
    
    closeAnniversaryModal();
    showAlert("紀念日已新增！");
}

function deleteAnniversary(id: number): void {
    showConfirm("刪除此紀念日？").then(ok => {
        if (ok) {
            const idx = anniversaryList.findIndex(x => x.id === id);
            if (idx > -1) {
                anniversaryList.splice(idx, 1);
                saveData();
                renderAnniversaries();
            }
        }
    });
}

function openAnniversaryModal(): void {
    openModal('anniversary-modal');
}