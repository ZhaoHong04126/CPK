// 定義快取版本名稱，更新版本號可強迫瀏覽器更新快取
const CACHE_NAME = 'CampusKing_v6.5_'; 

// 定義需要被預先快取的靜態檔案列表
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
	'./css/base.css',
	'./css/layout.css',
	'./css/components.css',
	'./css/landing.css',
	'./css/auth.css',
	'./css/dashboard.css',
	'./css/calendar.css',
	'./css/settings.css',
	'./js/firebase.js',
	'./js/state.js',
	'./js/ui.js',
	'./js/course.js',
	'./js/grade.js',
	'./js/notification.js',
	'./js/data.js',
	'./js/semester.js',
	'./js/auth.js',
	'./js/main.js',
	'./js/calendar.js',
	'./js/accounting.js',
	'./js/notes.js',
	'./js/anniversary.js',
	'./js/learning.js',
	'./js/lottery.js',
	'./js/homework.js',
];

// 監聽 'install' 事件：當 Service Worker 第一次安裝時觸發
self.addEventListener('install', (e) => {
    e.waitUntil(
        // 開啟指定名稱的快取空間
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);// 將所有檔案加入快取
        })
    );
});

// 監聽 'fetch' 事件：當網頁發出網路請求時觸發 (攔截請求)
self.addEventListener('fetch', (e) => {
    e.respondWith(
        // 檢查快取中是否有對應的資源
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);// 如果有快取就直接回傳 (離線可用)，否則發出真實網路請求
        })
    );

});