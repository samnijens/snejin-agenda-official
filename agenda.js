// ===============================
// 🔥 FIREBASE SETUP (pas aan naar jouw config)
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore, collection, addDoc, getDocs,
    deleteDoc, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    // jouw config hier
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const appointmentsRef = collection(db, "appointments");
const completedAppointmentsRef = collection(db, "completedAppointments");

// ===============================
// 📅 GLOBALS
// ===============================
let calendar;
let selectedEvent = null;

// ===============================
// 🌙 DARK MODE
// ===============================
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}

function loadDarkMode() {
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }
}

// ===============================
// 🔔 NOTIFICATIES (LOCAL)
// ===============================
let notificationsEnabled = false;

function loadNotificationSetting() {
    notificationsEnabled = localStorage.getItem("notificationsEnabled") === "true";
    updateNotifButton();
}

function updateNotifButton() {
    const btn = document.getElementById("notifToggle");
    if (!btn) return;

    btn.textContent = notificationsEnabled
        ? "🔔 Notificaties: AAN"
        : "🔕 Notificaties: UIT";
}

async function toggleNotifications() {
    if (!notificationsEnabled) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
    }

    notificationsEnabled = !notificationsEnabled;
    localStorage.setItem("notificationsEnabled", notificationsEnabled);
    updateNotifButton();
}

// ===============================
// 📱 PUSH NOTIFICATIES
// ===============================
let pushEnabled = false;
let notifyMinutes = 5;

function loadPushSettings() {
    pushEnabled = localStorage.getItem("pushEnabled") === "true";
    notifyMinutes = parseInt(localStorage.getItem("notifyMinutes")) || 5;
    updatePushUI();
}

function updatePushUI() {
    const btn = document.getElementById("pushToggle");
    const select = document.getElementById("notifyTime");

    if (btn) {
        btn.textContent = pushEnabled ? "📱 Push: AAN" : "📱 Push: UIT";
    }

    if (select) {
        select.value = notifyMinutes;
    }
}

async function togglePush() {
    if (!pushEnabled) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        await navigator.serviceWorker.register("/sw.js");
    }

    pushEnabled = !pushEnabled;
    localStorage.setItem("pushEnabled", pushEnabled);
    updatePushUI();
}

// ===============================
// 📅 LOAD APPOINTMENTS
// ===============================
async function loadAppointments() {
    const snapshot = await getDocs(appointmentsRef);

    const events = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
    }));

    calendar.removeAllEvents();
    calendar.addEventSource(events);
}

// ===============================
// 📂 LOAD COMPLETED
// ===============================
async function loadCompletedAppointments() {
    const list = document.getElementById("completedList");
    if (!list) return;

    list.innerHTML = "";

    const snapshot = await getDocs(completedAppointmentsRef);

    snapshot.forEach(docSnap => {
        const data = docSnap.data();

        const li = document.createElement("li");

        li.innerHTML = `
            <span>${data.title} (${data.start.split("T")[0]})</span>
            <button class="restore-btn">↩️</button>
        `;

        li.querySelector(".restore-btn").addEventListener("click", () => {
            restoreCompletedEvent(docSnap.id, data);
        });

        list.appendChild(li);
    });
}

// ===============================
// ➕ ADD EVENT
// ===============================
async function addEvent() {
    const title = document.getElementById("title").value;
    const start = document.getElementById("start").value;

    if (!title || !start) return alert("Vul alles in");

    await addDoc(appointmentsRef, {
        title,
        start
    });

    await loadAppointments();
}

// ===============================
// ❌ DELETE
// ===============================
async function deleteEvent() {
    if (!selectedEvent) return;

    await deleteDoc(doc(db, "appointments", selectedEvent.id));
    selectedEvent = null;

    await loadAppointments();
}

// ===============================
// ✏️ UPDATE
// ===============================
async function updateEvent() {
    if (!selectedEvent) return;

    const title = document.getElementById("title").value;
    const start = document.getElementById("start").value;

    await updateDoc(doc(db, "appointments", selectedEvent.id), {
        title,
        start
    });

    await loadAppointments();
}

// ===============================
// ✅ MARK AS DONE
// ===============================
async function markEventAsDone() {
    if (!selectedEvent) return;

    await addDoc(completedAppointmentsRef, {
        ...selectedEvent,
        completedAt: new Date().toISOString()
    });

    await deleteDoc(doc(db, "appointments", selectedEvent.id));
    selectedEvent = null;

    await loadAppointments();
    await loadCompletedAppointments();
}

// ===============================
// ↩️ RESTORE
// ===============================
async function restoreCompletedEvent(id, data) {
    await addDoc(appointmentsRef, data);
    await deleteDoc(doc(db, "completedAppointments", id));

    await loadAppointments();
    await loadCompletedAppointments();
}

// ===============================
// 🧹 AUTO CLEANUP
// ===============================
async function cleanupOldEvents() {
    const snapshot = await getDocs(appointmentsRef);
    const now = new Date();

    snapshot.forEach(async docSnap => {
        const data = docSnap.data();
        const date = new Date(data.start);

        if (date < now) {
            await addDoc(completedAppointmentsRef, {
                ...data,
                autoMoved: true
            });

            await deleteDoc(doc(db, "appointments", docSnap.id));
        }
    });
}

// ===============================
// ⏰ CHECK NOTIFICATIONS
// ===============================
function startNotificationChecker() {
    setInterval(async () => {
        if (!notificationsEnabled) return;

        const snapshot = await getDocs(appointmentsRef);
        const now = new Date();

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const eventTime = new Date(data.start);

            const diff = (eventTime - now) / 60000;

            if (diff > 0 && diff < 5) {
                new Notification("Aankomende afspraak", {
                    body: data.title
                });
            }
        });

    }, 60000);
}

// ===============================
// 📱 PUSH CHECKER
// ===============================
function startPushChecker() {
    setInterval(async () => {
        if (!pushEnabled) return;

        const snapshot = await getDocs(appointmentsRef);
        const now = new Date();

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const eventTime = new Date(data.start);

            const diff = (eventTime - now) / 60000;

            if (diff > 0 && diff < notifyMinutes) {
                navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification("Aankomende afspraak", {
                        body: data.title
                    });
                });
            }
        });

    }, 60000);
}

// ===============================
// 🚀 INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {

    loadDarkMode();
    loadNotificationSetting();
    loadPushSettings();

    document.getElementById("darkModeToggle")?.addEventListener("click", toggleDarkMode);
    document.getElementById("notifToggle")?.addEventListener("click", toggleNotifications);
    document.getElementById("pushToggle")?.addEventListener("click", togglePush);

    document.getElementById("notifyTime")?.addEventListener("change", (e) => {
        notifyMinutes = parseInt(e.target.value);
        localStorage.setItem("notifyMinutes", notifyMinutes);
    });

    document.getElementById("addBtn")?.addEventListener("click", addEvent);
    document.getElementById("deleteBtn")?.addEventListener("click", deleteEvent);
    document.getElementById("updateBtn")?.addEventListener("click", updateEvent);
    document.getElementById("doneFromViewButton")?.addEventListener("click", markEventAsDone);

    const calendarEl = document.getElementById("calendar");

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        eventClick: function(info) {
            selectedEvent = info.event;

            document.getElementById("title").value = info.event.title;
            document.getElementById("start").value = info.event.startStr;
        }
    });

    calendar.render();

    await cleanupOldEvents();
    await loadAppointments();
    await loadCompletedAppointments();

    startNotificationChecker();
    startPushChecker();
});
