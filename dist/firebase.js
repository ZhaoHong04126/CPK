const firebaseConfig = {
    apiKey: "AIzaSyBvWcCroeNSe4O1H_-hXgOJysO-Fyez0Qg",
    authDomain: "campusking6.firebaseapp.com",
    projectId: "campusking6",
    storageBucket: "campusking6.firebasestorage.app",
    messagingSenderId: "904334224237",
    appId: "1:904334224237:web:21e9c3717bd05896af0864",
    measurementId: "G-ER6B64XEBJ"
};
// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
// 加上型別註記，讓滑鼠移上去時知道這些變數是什麼
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const db = firebase.firestore();
const ADMIN_UID = "zxMKZHLkk1NvCKfAKEEWppXHCH73";
