// =====================================================
// SNEJIN AGENDA - agenda.js
// =====================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


// =====================================================
// ELEMENTEN
// =====================================================

const calendarElement = document.getElementById("calendar");
const themeButton     = document.getElementById("themeButton");
const logoutButton    = document.getElementById("logoutButton");
const addButton       = document.getElementById("addEventButton");
const searchInput     = document.getElementById("search");

// Form modal
const formModal      = document.getElementById("eventModal");
const formTitle      = document.getElementById("formTitle");
const saveButton     = document.getElementById("saveEventButton");
const cancelButton   = document.getElementById("cancelEventButton");
const closeFormX     = document.getElementById("closeFormX");

const titleInput       = document.getElementById("eventTitle");
const descriptionInput = document.getElementById("eventDescription");
const dateInput        = document.getElementById("eventDate");
const timeInput        = document.getElementById("eventTime");
const allDayInput      = document.getElementById("allDay");
const categoryInput    = document.getElementById("eventType");

// View modal
const viewModal          = document.getElementById("eventViewModal");
const viewBadge          = document.getElementById("viewBadge");
const viewTitle          = document.getElementById("viewTitle");
const viewDate           = document.getElementById("viewDate");
const viewTime           = document.getElementById("viewTime");
const viewCategoryName   = document.getElementById("viewCategoryName");
const viewDescription    = document.getElementById("viewDescription");
const editFromViewButton   = document.getElementById("editFromViewButton");
const deleteFromViewButton = document.getElementById("deleteFromViewButton");
const closeViewButton      = document.getElementById("closeViewButton");
const closeViewX           = document.getElementById("closeViewX");


// =====================================================
// VARIABELEN
// =====================================================

let calendar          = null;
let selectedEventId   = null;   // Firestore doc id bij bewerken
let currentViewEvent  = null;   // FullCalendar event dat bekeken wordt
let searchTerm        = "";

const appointmentsRef = collection(db, "appointments");


// =====================================================
// KLEUREN + LABELS
// =====================================================

const categoryColors = {
    work:            "#e74c3c",
    holiday:         "#27ae60",
    activity:        "#2ecc71",
    birthday:        "#f39c12",
    holidayofficial: "#f1c40f"
};

const categoryLabels = {
    work:            "🔴 Werken",
    holiday:         "🟢 Vakantie",
    activity:        "🟩 Activiteit",
    birthday:        "🟠 Verjaardag",
    holidayofficial: "🟡 Officiële feestdag"
    other: "⚫ Overig"
};

function getEventColor(category) {
    return categoryColors[category] || "#3788d8";
}


// =====================================================
// HULPFUNCTIES DATUM (lokaal, dus geen dag-verschuiving)
// =====================================================

function toLocalDateStr(d) {
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function toLocalTimeStr(d) {
    return String(d.getHours()).padStart(2, "0") + ":" +
           String(d.getMinutes()).padStart(2, "0");
}

function formatDateNL(d) {
    return d.toLocaleDateString("nl-NL", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
}

function formatTimeNL(d) {
    return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}


// =====================================================
// MODAL: FORM (nieuw + bewerken)
// =====================================================

function resetForm() {
    selectedEventId       = null;
    titleInput.value      = "";
    descriptionInput.value = "";
    dateInput.value       = "";
    timeInput.value       = "";
    allDayInput.checked   = false;
    categoryInput.selectedIndex = 0;
}

function openNewEvent() {
    resetForm();
    formTitle.textContent = "Nieuwe afspraak";
    formModal.classList.add("open");
}

function openEditEvent(event) {
    selectedEventId       = event.id;
    formTitle.textContent = "Afspraak bewerken";

    titleInput.value       = event.title || "";
    descriptionInput.value = event.extendedProps.description || "";
    categoryInput.value    = event.extendedProps.category || "activity";
    allDayInput.checked    = !!event.allDay;

    const start = event.start;
    dateInput.value = toLocalDateStr(start);
    timeInput.value = event.allDay ? "" : toLocalTimeStr(start);

    formModal.classList.add("open");
}

function closeFormModal() {
    formModal.classList.remove("open");
    resetForm();
}


// =====================================================
// MODAL: VIEW (info bekijken)
// =====================================================

function openViewEvent(event) {
    currentViewEvent = event;

    const cat = event.extendedProps.category || "activity";

    viewBadge.textContent        = categoryLabels[cat] || cat;
    viewBadge.style.background   = getEventColor(cat);
    viewTitle.textContent        = event.title || "(geen naam)";
    viewDate.textContent         = formatDateNL(event.start);
    viewTime.textContent         = event.allDay ? "Hele dag" : formatTimeNL(event.start);
    viewCategoryName.textContent = categoryLabels[cat] || cat;

    const desc = (event.extendedProps.description || "").trim();
    viewDescription.textContent = desc ? desc : "Geen omschrijving.";

    viewModal.classList.add("open");
}

function closeViewModal() {
    viewModal.classList.remove("open");
    currentViewEvent = null;
}


// =====================================================
// FIRESTORE: AFSPRAKEN LADEN
// =====================================================

async function loadAppointments() {
    if (!calendar) return;

    calendar.removeAllEvents();

    try {
        const snapshot = await getDocs(appointmentsRef);

        snapshot.forEach((document) => {
            const data = document.data();

            calendar.addEvent({
                id:    document.id,
                title: data.title,
                start: data.start,
                allDay: !!data.allDay,
                backgroundColor: getEventColor(data.category),
                borderColor:     getEventColor(data.category),
                extendedProps: {
                    description: data.description || "",
                    category:    data.category || "activity"
                }
            });
        });

        // zoekfilter opnieuw toepassen
        if (searchTerm) calendar.render();

    } catch (error) {
        console.error("Fout bij laden afspraken:", error);
        alert("⚠️ Afspraken konden niet geladen worden.\n\nControleer je internetverbinding en de Firestore-regels.\n\n" + error.message);
    }
}


// =====================================================
// FULLCALENDAR INITIALISATIE
// =====================================================

function initCalendar() {
    if (calendar || !calendarElement) return;

    calendar = new FullCalendar.Calendar(calendarElement, {
        initialView: "dayGridMonth",
        locale:      "nl",
        firstDay:    1,
        height:      "auto",
        editable:    true,
        selectable:  true,

        headerToolbar: {
            left:   "prev,next today",
            center: "title",
            right:  "dayGridMonth,timeGridWeek,timeGridDay,listYear"
        },

        buttonText: {
            today: "Vandaag",
            month: "Maand",
            week:  "Week",
            day:   "Dag",
            list:  "Agenda"
        },

        events: [],

        // zoeken: verberg events die niet matchen
        eventDidMount(info) {
            if (!searchTerm) return;
            const hay = (
                info.event.title + " " +
                (info.event.extendedProps.description || "")
            ).toLowerCase();
            info.el.style.display = hay.includes(searchTerm) ? "" : "none";
        },

        dateClick(info) {
            openNewEvent();
            dateInput.value = info.dateStr;
        },

        eventClick(info) {
            openViewEvent(info.event);   // eerst INFO tonen
        }
    });

    calendar.render();
}


// =====================================================
// LOGIN-STATUS: pas kalender laden NA bevestigde login
// =====================================================

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    // Nu pas is de sessie gegarandeerd beschikbaar voor Firestore
    initCalendar();
    await loadAppointments();
});


// =====================================================
// UITLOGGEN
// =====================================================

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "index.html";
    });
}


// =====================================================
// KNOPPEN: NIEUW / ANNULEREN / SLUITEN
// =====================================================

if (addButton)    addButton.addEventListener("click", openNewEvent);
if (cancelButton) cancelButton.addEventListener("click", closeFormModal);
if (closeFormX)   closeFormX.addEventListener("click", closeFormModal);

if (closeViewButton) closeViewButton.addEventListener("click", closeViewModal);
if (closeViewX)      closeViewX.addEventListener("click", closeViewModal);

// Klik op de donkere achtergrond sluit de modal
[formModal, viewModal].forEach((m) => {
    if (m) m.addEventListener("click", (e) => {
        if (e.target === m) {
            if (m === formModal) closeFormModal();
            else closeViewModal();
        }
    });
});


// =====================================================
// VANUIT INFO -> BEWERKEN
// =====================================================

if (editFromViewButton) {
    editFromViewButton.addEventListener("click", () => {
        if (!currentViewEvent) return;
        const ev = currentViewEvent;
        closeViewModal();
        openEditEvent(ev);
    });
}


// =====================================================
// VERWIJDEREN (vanuit info-modal)
// =====================================================

async function deleteCurrentEvent() {
    const id = currentViewEvent ? currentViewEvent.id : selectedEventId;

    if (!id) {
        closeViewModal();
        closeFormModal();
        return;
    }

    const akkoord = confirm("Weet je zeker dat je deze afspraak wilt verwijderen?");
    if (!akkoord) return;

    try {
        await deleteDoc(doc(db, "appointments", id));
        closeViewModal();
        closeFormModal();
        await loadAppointments();
    } catch (error) {
        console.error("Fout bij verwijderen:", error);
        alert("⚠️ Verwijderen mislukt.\n\n" + error.message);
    }
}

if (deleteFromViewButton) {
    deleteFromViewButton.addEventListener("click", deleteCurrentEvent);
}


// =====================================================
// OPSLAAN / BEWERKEN
// =====================================================

if (saveButton) {
    saveButton.addEventListener("click", async () => {

        if (titleInput.value.trim() === "") {
            alert("Geef de afspraak een naam.");
            return;
        }
        if (dateInput.value === "") {
            alert("Kies een datum.");
            return;
        }

        let start = dateInput.value;
        if (!allDayInput.checked && timeInput.value) {
            start += "T" + timeInput.value;
        }

        const eventData = {
            title:       titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            start:       start,
            allDay:      allDayInput.checked,
            category:    categoryInput.value
        };

        try {
            if (selectedEventId) {
                await updateDoc(doc(db, "appointments", selectedEventId), eventData);
            } else {
                await addDoc(appointmentsRef, eventData);
            }

            closeFormModal();
            await loadAppointments();
        } catch (error) {
            console.error("Fout bij opslaan:", error);
            alert("⚠️ Opslaan mislukt.\n\nWaarschijnlijk blokkeren de Firestore-regels het schrijven.\n\n" + error.message);
        }
    });
}


// =====================================================
// ZOEKEN
// =====================================================

if (searchInput) {
    searchInput.addEventListener("input", () => {
        searchTerm = searchInput.value.toLowerCase().trim();
        if (calendar) calendar.render();   // triggert eventDidMount opnieuw
    });
}


// =====================================================
// LICHT / DONKER MODUS
// =====================================================

function updateThemeIcon() {
    if (!themeButton) return;
    if (document.body.classList.contains("dark")) {
        themeButton.textContent = "☀️";
        themeButton.title = "Ga naar lichte modus";
    } else {
        themeButton.textContent = "🌙";
        themeButton.title = "Ga naar donkere modus";
    }
}

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

if (themeButton) {
    updateThemeIcon();
    themeButton.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        localStorage.setItem(
            "theme",
            document.body.classList.contains("dark") ? "dark" : "light"
        );
        updateThemeIcon();
    });
}
