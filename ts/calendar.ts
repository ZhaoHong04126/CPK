// js/calendar.ts

// 宣告變數
// 雖然 state.ts 有 calendarEvents: any[]，但為了更好用，我們可以在這裡定義介面
interface CalendarEvent {
    id: number;
    title: string;
    start: string; // "YYYY-MM-DD"
    end?: string;
    isAllDay: boolean;
    startTime?: string;
    endTime?: string;
}

declare var calendarEvents: CalendarEvent[]; // 覆寫 state.ts 的型別定義 (TS 允許這樣做合併，或直接當它是 any[] 也行)
declare function saveData(): void;

// 當前檢視的年月
let displayDate = new Date();

function renderCalendar(): void {
    const grid = document.getElementById('calendar-grid');
    const monthTitle = document.getElementById('calendar-month-year');
    const eventList = document.getElementById('calendar-list');
    
    if (!grid || !monthTitle) return;

    const year = displayDate.getFullYear();
    const month = displayDate.getMonth(); // 0-11

    // 設定標題
    monthTitle.innerText = `${year}年 ${month + 1}月`;

    // 清空格子 (保留前7個 header: 日一二三四五六)
    // 這裡比較危險，如果直接 innerHTML='' 會把 header 刪掉
    // 建議 HTML 結構分開，或者每次重繪 header。
    // 為了安全，我們保留 class="cal-day-header" 的元素，刪除其他的
    const headers = grid.querySelectorAll('.cal-day-header');
    grid.innerHTML = '';
    headers.forEach(h => grid.appendChild(h));

    // 計算該月第一天是星期幾
    const firstDay = new Date(year, month, 1).getDay(); // 0(日) - 6(六)
    
    // 計算該月有幾天
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 填補前面的空白
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-day empty';
        grid.appendChild(empty);
    }

    // 填入日期
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.innerHTML = `<span class="day-num">${d}</span>`;
        
        // 檢查是否有活動
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const events = getEventsForDate(dateStr);
        
        if (events.length > 0) {
            events.forEach(ev => {
                const dot = document.createElement('div');
                dot.className = 'cal-event-dot';
                dot.title = ev.title; // 滑鼠移上去顯示標題
                cell.appendChild(dot);
            });
            cell.classList.add('has-event');
        }

        // 點擊日期 (未來可以做點擊查看當日活動)
        // cell.onclick = () => showEventsForDate(dateStr); 

        grid.appendChild(cell);
    }

    // 渲染下方的活動清單 (只顯示該月份的)
    if (eventList) {
        renderEventList(eventList, year, month);
    }
}

function getEventsForDate(dateStr: string): CalendarEvent[] {
    // calendarEvents 來自 state.ts (全域)
    // 這裡需要把 state.ts 裡的 any[] 轉型成 CalendarEvent[] 使用，或直接用
    const events = (calendarEvents || []) as CalendarEvent[];
    
    return events.filter(e => {
        // 簡單判斷：單日活動
        if (!e.end) return e.start === dateStr;
        // 跨日活動：dateStr 在 start 和 end 之間
        return dateStr >= e.start && dateStr <= e.end;
    });
}

function renderEventList(container: HTMLElement, year: number, month: number): void {
    container.innerHTML = '';
    
    // 篩選本月活動並排序
    const events = (calendarEvents || []) as CalendarEvent[];
    const thisMonthEvents = events.filter(e => {
        const start = new Date(e.start);
        return start.getFullYear() === year && start.getMonth() === month;
    });

    thisMonthEvents.sort((a, b) => a.start.localeCompare(b.start));

    if (thisMonthEvents.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">本月尚無活動</p>';
        return;
    }

    thisMonthEvents.forEach(e => {
        const div = document.createElement('div');
        div.className = 'event-item';
        div.innerHTML = `
            <div style="font-weight:bold; color:var(--primary);">${e.start.slice(5)}</div>
            <div>${e.title}</div>
            <button onclick="deleteCalendarEvent(${e.id})" style="margin-left:auto; color:#ccc; border:none; background:none;">&times;</button>
        `;
        container.appendChild(div);
    });
}

function changeMonth(offset: number): void {
    displayDate.setMonth(displayDate.getMonth() + offset);
    renderCalendar();
}

// 新增活動
function addCalendarEvent(): void {
    const iTitle = document.getElementById('input-cal-title') as HTMLInputElement;
    const iDate = document.getElementById('input-cal-date') as HTMLInputElement;
    const iEndDate = document.getElementById('input-cal-end-date') as HTMLInputElement;
    const iAllDay = document.getElementById('input-cal-allday') as HTMLInputElement;

    if (!iTitle.value || !iDate.value) {
        showAlert("請輸入標題與日期");
        return;
    }

    const newEvent: CalendarEvent = {
        id: Date.now(),
        title: iTitle.value,
        start: iDate.value,
        end: iEndDate.value || undefined, // 如果空字串就存成 undefined
        isAllDay: iAllDay.checked
    };

    calendarEvents.push(newEvent);
    saveData();
    renderCalendar();
    
    closeCalendarModal();
    showAlert("活動已新增");
}

function deleteCalendarEvent(id: number): void {
    showConfirm("刪除此活動？").then(ok => {
        if (ok) {
            const idx = calendarEvents.findIndex(e => e.id === id);
            if (idx > -1) {
                calendarEvents.splice(idx, 1);
                saveData();
                renderCalendar();
            }
        }
    });
}

// 切換輸入時間的顯示 (Modal 裡的 checkbox)
function toggleCalTimeInput(): void {
    const checkbox = document.getElementById('input-cal-allday') as HTMLInputElement;
    const timeInputs = document.getElementById('cal-time-inputs');
    if (checkbox && timeInputs) {
        // 如果是全天，隱藏時間輸入
        timeInputs.style.display = checkbox.checked ? 'none' : 'flex';
    }
}