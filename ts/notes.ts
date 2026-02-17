// js/notes.ts

// 定義筆記的資料形狀 (只在這個檔案內部使用，所以不用 export)
interface Note {
    id: number;
    content: string;
    date: string;
}

// 宣告全域變數 (state.ts)
// 雖然我們在 state.ts 定義 quickNotes 是 any[]，但在這裡我們把它當成 Note[] 來用
// 這樣寫程式時會有自動補全
declare var quickNotes: Note[];
declare function saveData(): void;

// 渲染筆記列表
function renderNotes(): void {
    const list = document.getElementById('notes-list');
    if (!list) return;

    list.innerHTML = '';
    
    // 這裡的 notes 指向全域的 quickNotes
    const notes = quickNotes || [];

    // 依照 ID 倒序排列 (新的在上面)
    // 複製一份陣列來排序，以免影響原始資料順序 (雖然在這裡影響也沒關係)
    const sortedNotes = [...notes].sort((a, b) => b.id - a.id);

    if (sortedNotes.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#999; margin-top:30px;">還沒有記事喔，點擊下方按鈕新增。</p>';
        return;
    }

    sortedNotes.forEach((note) => {
        const item = document.createElement('div');
        item.className = 'note-item card'; // 假設 CSS 有 .note-item 樣式，或是直接用 card
        item.style.padding = '15px';
        item.style.marginBottom = '10px';
        item.style.position = 'relative';

        // 轉換換行符號
        const contentHtml = note.content.replace(/\n/g, '<br>');

        item.innerHTML = `
            <div style="font-size: 0.85rem; color: #888; margin-bottom: 5px;">${note.date}</div>
            <div style="font-size: 1rem; color: #333; line-height: 1.5;">${contentHtml}</div>
            <button onclick="deleteNote(${note.id})" style="position: absolute; top: 10px; right: 10px; background: transparent; border: none; color: #e74c3c; cursor: pointer; font-size: 1.2rem;">&times;</button>
        `;
        list.appendChild(item);
    });
}

// 新增筆記
function addNote(): void {
    const input = document.getElementById('input-note-content') as HTMLTextAreaElement;
    if (!input) return;

    const content = input.value.trim();
    if (!content) {
        showAlert("內容不能為空！", "提示");
        return;
    }

    const newNote: Note = {
        id: Date.now(),
        content: content,
        date: new Date().toLocaleString()
    };

    quickNotes.push(newNote);
    saveData();
    renderNotes();
    
    // 清空並關閉
    input.value = '';
    closeNoteModal();
    showAlert("記事已儲存！");
}

// 刪除筆記
function deleteNote(id: number): void {
    showConfirm("確定要刪除這條記事嗎？", "刪除").then((ok) => {
        if (ok) {
            // 找到該 ID 的索引
            const idx = quickNotes.findIndex(n => n.id === id);
            if (idx > -1) {
                quickNotes.splice(idx, 1);
                saveData();
                renderNotes();
            }
        }
    });
}