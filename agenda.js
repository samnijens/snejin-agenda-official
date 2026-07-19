import { auth, db } from "./firebase.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
    collection,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// ELEMENTEN
const calendarEl = document.getElementById("calendar");
const searchInput = document.getElementById("search");
const themeButton = document.getElementById("themeButton");
const logoutButton = document.getElementById("logoutButton");
const addButton = document.getElementById("addEventButton");

// View Modal
const viewModal = document.getElementById("viewModal");
const viewTitle = document.getElementById("viewTitle");
const viewDescription = document.getElementById("viewDescription");
const viewDate = document.getElementById("viewDate");
const viewTime = document.getElementById("viewTime");
const viewCategoryBadge = document.getElementById("viewCategoryBadge");
const viewEditButton = document.getElementById("viewEditButton");
const viewDeleteButton = document.getElementById("viewDeleteButton");
const viewCloseButton = document.getElementById("viewCloseButton");
const viewCloseX = document.getElementById("viewCloseX");

// Form Modal
const eventModal = document.getElementById("eventModal");
const formTitle = document.getElementById("formTitle");
const titleInput = document.getElementById("eventTitle");
const descriptionInput = document.getElementById("eventDescription");
const dateInput = document.getElementById("eventDate");
const timeInput = document.getElementById("eventTime");
const allDayInput = document.getElementById("allDay");
const categoryInput = document.getElementById("eventType");
const saveButton = document.getElementById("saveEventButton");
const cancelButton = document.getElementById("cancelEventButton");
const formCloseX = document.getElementById("formCloseX");

let calendar;
let selectedId = null;
let selectedEventObj = null;

const appointmentsRef = collection(db, "appointments");

const categoryInfo = {
    work: { color: "#e74c3c", label: "🔴 Werken" },
    holiday: { color: "#27ae60", label: "🟢 Vakantie" },
    activity: { color: "#2ecc71", label: "🟩 Activiteit" },
    birthday: { color: "#f39c12", label: "🟠 Verjaardag" },
    holidayofficial: { color: "#f1c40f", label: "🟡 Officiële feestdag" }
};

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        initCalendar();
    }
});

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "index.html";
    });
}

function initCalendar() {
    if (!calendarEl) return;
    if (calendar) return;

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "nl",
        firstDay: 1,
        height: "auto",
        editable: true,
        selectable: true,
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listYear"
        },
        buttonText: { today: "Vandaag", month: "Maand", week: "Week", day: "Dag", list: "Agenda" },
        dateClick: (info) => openNewForm(info.dateStr),
        eventClick: (info) => openViewModal(info.event),
        eventDrop: async (info) => {
            await updateDoc(doc(db, "appointments", info.event.id), {
                start: info.event.startStr,
                allDay: info.event.allDay
            });
        }
    });
    calendar.render();

    // LIVE updates voor iedereen
    onSnapshot(appointmentsRef, (snapshot) => {
        calendar.removeAllEvents();
        snapshot.forEach((d) => {
            const data = d.data();
            calendar.addEvent({
                id: d.id,
                title: data.title,
                start: data.start,
                allDay: data.allDay,
                backgroundColor: (categoryInfo[data.category]?.color || "#3788d8"),
                borderColor: (categoryInfo[data.category]?.color || "#3788d8"),
                extendedProps: {
                    description: data.description || "",
                    category: data.category || "activity"
                }
            });
        });
        filterEvents();
    });
}

// VIEW LOGICA
function openViewModal(event) {
    selectedId = event.id;
    selectedEventObj = event;
    const cat = event.extendedProps.category || "activity";
    const info = categoryInfo[cat];

    viewTitle.textContent = event.title;
    viewDescription.textContent = event.extendedProps.description || "Geen omschrijving toegevoegd.";
    viewCategoryBadge.textContent = info.label;
    viewCategoryBadge.style.background = info.color;

    const start = event.start;
    viewDate.textContent = "📅 " + start.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    viewTime.textContent = event.allDay ? "⏰ Hele dag" : "⏰ " + start.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

    viewModal.classList.add("active");
}

function closeViewModal() {
    viewModal.classList.remove("active");
    selectedId = null;
    selectedEventObj = null;
}

// FORM LOGICA
function openNewForm(dateStr = "") {
    selectedId = null;
    selectedEventObj = null;
    formTitle.textContent = "Nieuwe afspraak";
    titleInput.value = "";
    descriptionInput.value = "";
    dateInput.value = dateStr || new Date().toISOString().split("T")[0];
    timeInput.value = "";
    allDayInput.checked = false;
    categoryInput.value = "activity";
    timeInput.disabled = false;
    eventModal.classList.add("active");
}

function openEditForm() {
    if (!selectedEventObj) return;
    const event = selectedEventObj;
    formTitle.textContent = "Afspraak bewerken";
    titleInput.value = event.title;
    descriptionInput.value = event.extendedProps.description || "";
    categoryInput.value = event.extendedProps.category || "activity";
    allDayInput.checked = event.allDay;

    // timezone fix
    const local = new Date(event.start.getTime() - event.start.getTimezoneOffset() * 60000);
    dateInput.value = local.toISOString().split("T")[0];
    timeInput.value = event.allDay ? "" : event.start.toTimeString().substring(0, 5);
    timeInput.disabled = event.allDay;

    closeViewModal();
    eventModal.classList.add("active");
}

function closeFormModal() {
    eventModal.classList.remove("active");
}

// Opslaan
saveButton.addEventListener("click", async () => {
    if (titleInput.value.trim() === "") return alert("Geef de afspraak een naam.");
    if (dateInput.value === "") return alert("Kies een datum.");

    let start = dateInput.value;
    if (!allDayInput.checked && timeInput.value) {
        start += "T" + timeInput.value;
    }

    const data = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        start: start,
        allDay: allDayInput.checked,
        category: categoryInput.value
    };

    try {
        if (selectedId) {
            await updateDoc(doc(db, "appointments", selectedId), data);
        } else {
            await addDoc(appointmentsRef, data);
        }
        closeFormModal();
    } catch (e) {
        console.error(e);
        alert("Fout bij opslaan: " + e.message);
    }
});

// Verwijderen - werkt nu vanuit view
async function handleDelete() {
    if (!selectedId) return;
    if (!confirm("Weet je zeker dat je deze afspraak wilt verwijderen?")) return;
    try {
        await deleteDoc(doc(db, "appointments", selectedId));
        closeViewModal();
        closeFormModal();
    } catch (e) {
        alert("Verwijderen mislukt: " + e.message);
    }
}
viewDeleteButton.addEventListener("click", handleDelete);

// Buttons
addButton.addEventListener("click", () => openNewForm());
viewEditButton.addEventListener("click", openEditForm);
viewCloseButton.addEventListener("click", closeViewModal);
viewCloseX.addEventListener("click", closeViewModal);
cancelButton.addEventListener("click", closeFormModal);
formCloseX.addEventListener("click", closeFormModal);

viewModal.addEventListener("click", (e) => { if (e.target === viewModal) closeViewModal(); });
eventModal.addEventListener("click", (e) => { if (e.target === eventModal) closeFormModal(); });

allDayInput.addEventListener("change", () => {
    timeInput.disabled = allDayInput.checked;
    if (allDayInput.checked) timeInput.value = "";
});

// Zoek functie
function filterEvents() {
    if (!searchInput || !calendar) return;
    const term = searchInput.value.toLowerCase();
    calendar.getEvents().forEach(ev => {
        const match = ev.title.toLowerCase().includes(term) || (ev.extendedProps.description || "").toLowerCase().includes(term);
        ev.setProp("display", match || term === "" ? "auto" : "none");
    });
}
if (searchInput) searchInput.addEventListener("input", filterEvents);

// Theme
function updateThemeIcon() {
    if (!themeButton) return;
    const isDark = document.body.classList.contains("dark");
    themeButton.textContent = isDark ? "☀️" : "🌙";
}
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");
updateThemeIcon();
if (themeButton) {
    themeButton.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
        updateThemeIcon();
    });
}
