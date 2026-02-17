// js/accounting.ts

declare const Chart: any;

declare var accountingList: AccountingItem[];
declare var paymentMethods: string[];
declare function saveData(): void;
declare function openModal(id: string): void;
declare function closeModal(id: string): void;
declare function showAlert(msg: string, title?: string): Promise<void>;

let accChartInstance: any = null;

// 1. 切換分頁
function switchAccTab(tab: string): void {
    const tabs = ['summary', 'details', 'chart', 'daily', 'accounts'];
    tabs.forEach(t => {
        const view = document.getElementById(`view-acc-${t}`);
        const btn = document.getElementById(`btn-acc-${t}`);
        if (view && btn) {
            if (t === tab) {
                view.style.display = 'block';
                btn.classList.add('active');
                if (t === 'chart') renderAccountingChart();
                if (t === 'daily') renderDailyAccounting();
                if (t === 'accounts') renderAccountsBalance();
            } else {
                view.style.display = 'none';
                btn.classList.remove('active');
            }
        }
    });
}

// 2. 渲染摘要與列表
function renderAccounting(): void {
    renderAccountingSummary();
    renderAccountingList();
    renderPaymentMethodsOptions();
}

function renderAccountingSummary(): void {
    let income = 0;
    let expense = 0;

    accountingList.forEach(item => {
        if (item.type === 'income') income += item.amount;
        if (item.type === 'expense') expense += item.amount;
    });

    const elIncome = document.getElementById('acc-summary-income');
    const elExpense = document.getElementById('acc-summary-expense');
    const elBalance = document.getElementById('acc-summary-balance');

    if (elIncome) elIncome.innerText = `$${income}`;
    if (elExpense) elExpense.innerText = `$${expense}`;
    if (elBalance) elBalance.innerText = `$${income - expense}`;
}

function renderAccountingList(): void {
    const tbody = document.getElementById('accounting-list-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    // 依日期倒序 (新的在上面)
    const sorted = [...accountingList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sorted.forEach((item, index) => {
        const tr = document.createElement('tr');
        const color = item.type === 'income' ? '#2ecc71' : (item.type === 'expense' ? '#e74c3c' : '#3498db');
        const sign = item.type === 'income' ? '+' : (item.type === 'expense' ? '-' : '->');
        
        // 在原始陣列中的索引 (因為 sorted 過，刪除時需要知道原始索引，或者用 ID)
        // 這裡簡單用 indexOf (如果資料完全一樣可能會刪錯，建議加 ID)
        // 為了安全，我們之後應該給 AccountingItem 加個 id 欄位。這裡先暫時用物件比對。
        
        tr.innerHTML = `
            <td>${item.date}</td>
            <td>${item.title}</td>
            <td>${item.method}</td>
            <td style="color:${color}; font-weight:bold;">${sign}$${item.amount}</td>
            <td><button onclick="deleteTransaction(${accountingList.indexOf(item)})" style="color:#999; border:none; background:none; cursor:pointer;">&times;</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. 新增交易
function openAccountingModal(): void {
    // 預設日期為今天
    const iDate = document.getElementById('input-acc-date') as HTMLInputElement;
    if (iDate) iDate.value = new Date().toISOString().split('T')[0];
    
    // 清空其他
    const iTitle = document.getElementById('input-acc-title') as HTMLInputElement;
    const iAmount = document.getElementById('input-acc-amount') as HTMLInputElement;
    if (iTitle) iTitle.value = '';
    if (iAmount) iAmount.value = '';
    
    openModal('accounting-modal');
}

function addTransaction(): void {
    const iType = document.getElementById('input-acc-type') as HTMLSelectElement;
    const iDate = document.getElementById('input-acc-date') as HTMLInputElement;
    const iTitle = document.getElementById('input-acc-title') as HTMLInputElement;
    const iAmount = document.getElementById('input-acc-amount') as HTMLInputElement;
    const iMethod = document.getElementById('input-acc-method') as HTMLSelectElement;
    
    if (!iDate.value || !iTitle.value || !iAmount.value) {
        showAlert("資料不完整");
        return;
    }

    // 強制轉型成 Union Type
    const type = iType.value as 'income' | 'expense' | 'transfer';

    const newItem: AccountingItem = {
        date: iDate.value,
        title: iTitle.value,
        amount: parseFloat(iAmount.value),
        type: type,
        method: iMethod.value
    };

    if (type === 'transfer') {
        const iTo = document.getElementById('input-acc-to-method') as HTMLSelectElement;
        newItem.to_method = iTo.value;
    }

    accountingList.push(newItem);
    saveData();
    renderAccounting();
    closeModal('accounting-modal');
    showAlert("記帳成功！");
}

function deleteTransaction(index: number): void {
    showConfirm("確定刪除這筆紀錄？").then(ok => {
        if (ok && index > -1) {
            accountingList.splice(index, 1);
            saveData();
            renderAccounting();
        }
    });
}

// 4. 輔助功能
function toggleAccType(): void {
    const iType = document.getElementById('input-acc-type') as HTMLSelectElement;
    const groupTo = document.getElementById('group-acc-to-method');
    const labelMethod = document.getElementById('label-acc-method');
    
    if (iType && groupTo && labelMethod) {
        if (iType.value === 'transfer') {
            groupTo.style.display = 'block';
            labelMethod.innerText = '轉出帳戶 (支出)';
        } else {
            groupTo.style.display = 'none';
            labelMethod.innerText = '支付方式';
        }
    }
}

function renderPaymentMethodsOptions(): void {
    const selects = ['input-acc-method', 'input-acc-to-method'];
    selects.forEach(id => {
        const sel = document.getElementById(id) as HTMLSelectElement;
        if (sel) {
            sel.innerHTML = '';
            paymentMethods.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.innerText = m;
                sel.appendChild(opt);
            });
        }
    });
}

// 5. 圖表 (月報表)
function renderAccountingChart(): void {
    const ctx = document.getElementById('accountingChart') as HTMLCanvasElement;
    if (!ctx) return;

    // 統計每月收支
    // 簡單實作：最近 6 個月
    const stats: Record<string, {income: number, expense: number}> = {};
    const labels: string[] = [];
    
    // 初始化月份 Key
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        labels.push(key);
        stats[key] = { income: 0, expense: 0 };
    }

    accountingList.forEach(item => {
        const key = item.date.substring(0, 7); // YYYY-MM
        if (stats[key]) {
            if (item.type === 'income') stats[key].income += item.amount;
            if (item.type === 'expense') stats[key].expense += item.amount;
        }
    });

    const dataIncome = labels.map(l => stats[l].income);
    const dataExpense = labels.map(l => stats[l].expense);

    if (accChartInstance) accChartInstance.destroy();

    accChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: '收入', data: dataIncome, backgroundColor: '#2ecc71' },
                { label: '支出', data: dataExpense, backgroundColor: '#e74c3c' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// 6. 每日統計 (Daily)
function renderDailyAccounting(): void {
    const tbody = document.getElementById('daily-acc-body');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    const dailyStats: Record<string, number> = {};
    
    // 這裡只簡單算淨收支，你可以擴充成 object 存收入和支出
    accountingList.forEach(item => {
        if(!dailyStats[item.date]) dailyStats[item.date] = 0;
        if(item.type === 'income') dailyStats[item.date] += item.amount;
        if(item.type === 'expense') dailyStats[item.date] -= item.amount;
    });

    // 排序日期
    const dates = Object.keys(dailyStats).sort().reverse();
    dates.forEach(d => {
        const val = dailyStats[d];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${d}</td>
            <td>-</td> 
            <td>-</td>
            <td style="color:${val >= 0 ? '#2ecc71' : '#e74c3c'}">$${val}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 7. 帳戶餘額 (Accounts)
function renderAccountsBalance(): void {
    const list = document.getElementById('acc-accounts-list');
    if (!list) return;
    
    list.innerHTML = '';
    const balances: Record<string, number> = {};
    paymentMethods.forEach(m => balances[m] = 0);

    accountingList.forEach(item => {
        if (item.type === 'income') balances[item.method] = (balances[item.method] || 0) + item.amount;
        if (item.type === 'expense') balances[item.method] = (balances[item.method] || 0) - item.amount;
        if (item.type === 'transfer' && item.to_method) {
            balances[item.method] = (balances[item.method] || 0) - item.amount;
            balances[item.to_method] = (balances[item.to_method] || 0) + item.amount;
        }
    });

    Object.keys(balances).forEach(m => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.padding = '15px';
        div.style.marginBottom = '10px';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.innerHTML = `
            <span>${m}</span>
            <span style="font-weight:bold; color:${balances[m] >= 0 ? '#333' : '#e74c3c'}">$${balances[m]}</span>
        `;
        list.appendChild(div);
    });
}

function addPaymentMethod(): void {
    showPrompt("輸入新帳戶名稱 (如: LINE Pay)").then(name => {
        if (name && !paymentMethods.includes(name)) {
            paymentMethods.push(name);
            saveData();
            renderAccountsBalance();
            showAlert("帳戶已新增");
        }
    });
}