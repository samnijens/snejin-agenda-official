// ===============================
// IMPORTS
// ===============================
import { db } from "./firebase.js";
import {
collection,
addDoc,
getDocs,
deleteDoc,
doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================
// GLOBALS
// ===============================
let calendar;
let selectedEventId = null;
let currentViewEvent = null;

const appointmentsRef = collection(db, "appointments");
const completedAppointmentsRef = collection(db, "completedAppointments");

// ===============================
// 🎨 CATEGORIE DATA
// ===============================
const categoryConfig = {
work: {
label: "🔴 Werken",
color: "#ff3b3b",
emoji: "🔴"
},
holiday: {
label: "🟢 Vakantie",
color: "#28a745",
emoji: "🟢"
},
activity: {
label: "🟩 Activiteit",
color: "#198754",
emoji: "🟩"
},
birthday: {
label: "🟠 Verjaardag",
color: "#fd7e14",
emoji: "🎂"
},
holidayofficial: {
label: "🟡 Feestdag",
color: "#ffc107",
emoji: "🟡"
}
};

// ===============================
// INIT CALENDAR
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
const calendarEl = document.getElementById("calendar");

calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    selectable: true,

    select: function(info) {
        selectedEventId = null;
        openFormModal(info.startStr);
    },

    eventClick: function(info) {
        currentViewEvent = info.event;
        openViewModal(info.event);
    }
});

calendar.render();
await loadAppointments();

});

// ===============================
// LOAD EVENTS
// ===============================
async function loadAppointments() {
calendar.removeAllEvents();

const snapshot = await getDocs(appointmentsRef);

snapshot.forEach(docSnap => {
    const data = docSnap.data();

    const category = data.category || "activity";
    const config = categoryConfig[category] || {};

    const color = config.color || "#6c757d";
    const emoji = config.emoji || "";

    calendar.addEvent({
        id: docSnap.id,

        // 🎉 EMOJI IN TITEL
        title: `${emoji} ${data.title}`,

        start: data.start,
        allDay: data.allDay,

        color: color,

        extendedProps: {
            description: data.description || "",
            category: category
        }
    });
});

}

// ===============================
// SAVE EVENT
// ===============================
async function saveEvent() {
const title = document.getElementById("title").value;
const date = document.getElementById("date").value;
const description = document.getElementById("description").value;
const category = document.getElementById("category").value;

if (!title || !date) {
    alert("Vul titel en datum in.");
    return;
}

await addDoc(appointmentsRef, {
    title,
    start: date,
    description,
    allDay: true,
    category
});

closeFormModal();
await loadAppointments();

}

// ===============================
// AFSPRAAK AFRONDEN
// ===============================
async function markEventAsDone() {
if (!currentViewEvent) return;

try {
    const event = currentViewEvent;

    await addDoc(completedAppointmentsRef, {
        title: event.title,
        description: event.extendedProps.description || "",
        start: event.startStr,
        allDay: event.allDay,
        category: event.extendedProps.category || "activity",
        completedAt: new Date().toISOString()
    });

    await deleteDoc(doc(db, "appointments", event.id));

    closeViewModal();
    await loadAppointments();

    alert("Afspraak afgerond!");
} catch (error) {
    console.error(error);
    alert("Fout bij afronden.");
}

}

// ===============================
// DELETE EVENT
// ===============================
async function deleteCurrentEvent() {
const id = currentViewEvent ? currentViewEvent.id : selectedEventId;

if (!id) return;

const confirmDelete = confirm("Weet je zeker dat je wilt verwijderen?");
if (!confirmDelete) return;

try {
    await deleteDoc(doc(db, "appointments", id));
    closeViewModal();
    closeFormModal();
    await loadAppointments();
} catch (error) {
    console.error(error);
    alert("Verwijderen mislukt.");
}

}

// ===============================
// MODALS
// ===============================
function openFormModal(date) {
document.getElementById("formModal").style.display = "block";
document.getElementById("date").value = date;
}

function closeFormModal() {
document.getElementById("formModal").style.display = "none";
}

function openViewModal(event) {
document.getElementById("viewTitle").innerText = event.title;
document.getElementById("viewDate").innerText = event.startStr;
document.getElementById("viewDescription").innerText =
event.extendedProps.description || "";

document.getElementById("viewModal").style.display = "block";

}

function closeViewModal() {
document.getElementById("viewModal").style.display = "none";
}

// ===============================
// BUTTONS
// ===============================
document.getElementById("saveBtn")?.addEventListener("click", saveEvent);
document.getElementById("deleteBtn")?.addEventListener("click", deleteCurrentEvent);
document.getElementById("doneBtn")?.addEventListener("click", markEventAsDone);
