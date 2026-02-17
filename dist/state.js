// --- 以下是原本的變數，但加上了型別註記 ---
// 目前登入的 Firebase 使用者物件
// 初始可能是 null，所以型別是 FirebaseUser 或 null
let currentUser = null;
// 是否為註冊模式
let isRegisterMode = false;
// 目前選擇的星期
let currentDay = new Date().getDay();
if (currentDay === 0 || currentDay === 6)
    currentDay = 1;
let currentSemester = "114-1";
let semesterList = ["114-1"]; // 字串陣列
let userTitle = "同學";
// 定義複雜的全域資料結構 (使用 any 暫時通融，因為結構太深，未來再優化)
let allData = {};
// Record<string, Course[]> 代表：key 是字串(星期幾)，value 是 Course 陣列
let weeklySchedule = {};
let gradeList = []; // 成績陣列
// 這些物件的 key 是科目名稱，value 是成績陣列 (暫時用 any[] 簡化)
let regularExams = {};
let midtermExams = {};
let calendarEvents = [];
let accountingList = [];
// Chart.js 的實例，因為是外部套件物件，暫時用 any
let accChartInstance = null;
let quickNotes = [];
let anniversaryList = [];
let semesterStartDate = "";
let semesterEndDate = "";
let learningList = [];
let lotteryList = [];
let homeworkList = [];
let graduationTarget = 128;
let paymentMethods = [
    "現金", "一卡通", "悠遊卡",
    "信用卡", "行動支付", "轉帳"
];
let userSchoolInfo = {
    school: "",
    department: ""
};
// 鍵值對物件，值可能是數字或是物件(必修/選修)
let categoryTargets = {};
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
const defaultSchedule = { 1: [], 2: [], 3: [], 4: [], 5: [] };
