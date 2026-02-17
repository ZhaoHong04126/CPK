// 1. 定義「使用者」的形狀 (依據 Firebase User 物件的常用欄位)
interface FirebaseUser {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    isAnonymous: boolean;
    delete: () => Promise<void>; // 定義 delete 是一個函式
}

// 2. 定義「課程」的形狀
interface Course {
    period: string; // 例如: "1", "A"
    time: string;   // 例如: "08:10"
    subject: string;
    room: string;
    teacher: string;
    color: string;
    nature?: string;   // ? 代表這個欄位是選填的
    category?: string; // ? 代表選填
    type?: string;     // 為了相容舊資料
}

// 3. 定義「成績」的形狀
interface GradeItem {
    subject: string;
    score: number; // 分數是數字
    credit: number;
    category?: string;
    nature?: string;
}

// 4. 定義「記帳」的形狀
interface AccountingItem {
    date: string;
    title: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer'; // 只能是這三個字串之一，這叫 Union Type
    method: string;
    to_method?: string | null;
}

// --- 以下是原本的變數，但加上了型別註記 ---

// 目前登入的 Firebase 使用者物件
// 初始可能是 null，所以型別是 FirebaseUser 或 null
let currentUser: FirebaseUser | null = null;

// 是否為註冊模式
let isRegisterMode: boolean = false;

// 目前選擇的星期
let currentDay: number = new Date().getDay();
if (currentDay === 0 || currentDay === 6) currentDay = 1;

let currentSemester: string = "114-1";
let semesterList: string[] = ["114-1"]; // 字串陣列

let userTitle: string = "同學";

// 定義複雜的全域資料結構 (使用 any 暫時通融，因為結構太深，未來再優化)
let allData: any = {}; 

// Record<string, Course[]> 代表：key 是字串(星期幾)，value 是 Course 陣列
let weeklySchedule: Record<string, Course[]> = {}; 

let gradeList: GradeItem[] = []; // 成績陣列

// 這些物件的 key 是科目名稱，value 是成績陣列 (暫時用 any[] 簡化)
let regularExams: Record<string, any[]> = {}; 
let midtermExams: Record<string, any[]> = {}; 

let calendarEvents: any[] = [];
let accountingList: AccountingItem[] = [];

// Chart.js 的實例，因為是外部套件物件，暫時用 any
let accChartInstance: any = null; 

let quickNotes: any[] = [];
let anniversaryList: any[] = [];
let semesterStartDate: string = "";
let semesterEndDate: string = "";
let learningList: any[] = [];
let lotteryList: any[] = [];
let homeworkList: any[] = [];

let graduationTarget: number = 128;

let paymentMethods: string[] = [
    "現金", "一卡通", "悠遊卡", 
    "信用卡", "行動支付", "轉帳"
];

let userSchoolInfo = {
    school: "",
    department: ""
};

// 鍵值對物件，值可能是數字或是物件(必修/選修)
let categoryTargets: Record<string, number | { "必修": number, "選修": number }> = {};

let periodConfig = {
    classDur: 50,
    breakDur: 10,
    startHash: "08:10"
};

let notificationSettings = {
    course: true,
    daily: true,
    anniversary: true
};

// 預設的課表結構
const defaultSchedule: Record<number, Course[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };