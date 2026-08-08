// ======================================================
// SNEJIN AGENDA
// COMPLETE AGENDA.JS
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ======================================================
// FIREBASE COLLECTIONS
// ======================================================

const appointmentsRef = collection(db, "appointments");
const completedAppointmentsRef = collection(db, "completedAppointments");


// ======================================================
// GLOBALS
// ======================================================

let calendar = null;

let selectedEventId = null;
let currentViewEvent = null;
let editingEventId = null;

let allAppointments = [];


// ======================================================
// CATEGORIEËN
// ======================================================

const categoryConfig = {

    work: {
        label: "Werken",
        color: "#ff3b3b",
        emoji: "🔴"
    },

    holiday: {
        label: "Vakantie",
        color: "#28a745",
        emoji: "🟢"
    },

    activity: {
        label: "Activiteit",
        color: "#198754",
        emoji: "🟩"
    },

    birthday: {
        label: "Verjaardag",
        color: "#fd7e14",
        emoji: "🎂"
    },

    holidayofficial: {
        label: "Officiële feestdag",
        color: "#ffc107",
        emoji: "🟡"
    }

};


// ======================================================
// DOM READY
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    setupButtons();

    setupTheme();

    setupSearch();

    setupModalCloseEvents();

    initializeCalendar();

    await loadAppointments();

});


// ======================================================
// KALENDER INITIALISEREN
// ======================================================

function initializeCalendar() {

    const calendarEl = document.getElementById("calendar");

    if (!calendarEl) {
        console.error("Element #calendar bestaat niet.");
        return;
    }

    calendar = new FullCalendar.Calendar(calendarEl, {

        initialView: "dayGridMonth",

        locale: "nl",

        firstDay: 1,

        height: "auto",

        selectable: true,

        editable: false,

        dayMaxEvents: true,

        headerToolbar: {

            left: "prev,next today",

            center: "title",

            right: "dayGridMonth,timeGridWeek,listWeek"

        },


        // --------------------------------------------------
        // DATUM SELECTEREN
        // --------------------------------------------------

        select(info) {

            openFormModal(info.startStr);

        },


        // --------------------------------------------------
        // EVENT AANKLIKKEN
        // --------------------------------------------------

        eventClick(info) {

            currentViewEvent = info.event;

            openViewModal(info.event);

        }

    });


    calendar.render();

}


// ======================================================
// AFSPRAKEN LADEN
// ======================================================

async function loadAppointments() {

    if (!calendar) return;

    try {

        calendar.removeAllEvents();

        allAppointments = [];

        const snapshot = await getDocs(appointmentsRef);

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            const appointment = {

                id: docSnap.id,

                title: data.title || "Afspraak",

                description: data.description || "",

                start: data.start || "",

                time: data.time || "",

                allDay: data.allDay !== false,

                category: data.category || "activity"

            };

            allAppointments.push(appointment);

            addAppointmentToCalendar(appointment);

        });

    } catch (error) {

        console.error("Afspraken laden mislukt:", error);

        alert("De afspraken konden niet worden geladen.");

    }

}


// ======================================================
// EVENT AAN KALENDER TOEVOEGEN
// ======================================================

function addAppointmentToCalendar(data) {

    const config =
        categoryConfig[data.category] ||
        categoryConfig.activity;

    const emoji = config.emoji;

    let start = data.start;

    // Als het geen hele dag is en er is een tijd,
    // voeg de tijd toe aan de datum.
    if (!data.allDay && data.time && data.start) {

        start = `${data.start}T${data.time}`;

    }

    calendar.addEvent({

        id: data.id,

        title: `${emoji} ${data.title}`,

        start: start,

        allDay: data.allDay,

        backgroundColor: config.color,

        borderColor: config.color,

        textColor: "#ffffff",

        extendedProps: {

            description: data.description,

            category: data.category,

            time: data.time || ""

        }

    });

}


// ======================================================
// NIEUWE AFSPRAAK / BEWERKEN OPENEN
// ======================================================

function openFormModal(date = "") {

    const modal = document.getElementById("eventModal");

    if (!modal) return;

    editingEventId = null;

    document.getElementById("formTitle").textContent =
        "Nieuwe afspraak";

    document.getElementById("eventTitle").value = "";

    document.getElementById("eventDescription").value = "";

    document.getElementById("eventDate").value =
        formatDateForInput(date);

    document.getElementById("eventTime").value = "";

    document.getElementById("eventType").value =
        "activity";

    document.getElementById("allDay").checked = true;

    openModal(modal);

}


// ======================================================
// AFSPRAAK BEWERKEN
// ======================================================

function openEditModal(event) {

    if (!event) return;

    editingEventId = event.id;

    closeViewModal();

    const modal = document.getElementById("eventModal");

    document.getElementById("formTitle").textContent =
        "Afspraak bewerken";

    document.getElementById("eventTitle").value =
        removeEmojiFromTitle(event.title);

    document.getElementById("eventDescription").value =
        event.extendedProps.description || "";

    document.getElementById("eventDate").value =
        event.startStr.substring(0, 10);

    document.getElementById("eventTime").value =
        event.extendedProps.time || "";

    document.getElementById("eventType").value =
        event.extendedProps.category || "activity";

    document.getElementById("allDay").checked =
        event.allDay;

    openModal(modal);

}


// ======================================================
// OPSLAAN
// ======================================================

async function saveEvent() {

    const title =
        document.getElementById("eventTitle").value.trim();

    const description =
        document.getElementById("eventDescription").value.trim();

    const date =
        document.getElementById("eventDate").value;

    const time =
        document.getElementById("eventTime").value;

    const category =
        document.getElementById("eventType").value;

    const allDay =
        document.getElementById("allDay").checked;


    if (!title || !date) {

        alert("Vul minimaal een naam en datum in.");

        return;

    }


    try {

        if (editingEventId) {

            // ----------------------------------------------
            // BESTAANDE AFSPRAAK BIJWERKEN
            // ----------------------------------------------

            await updateDoc(
                doc(db, "appointments", editingEventId),
                {

                    title,

                    description,

                    start: date,

                    time: allDay ? "" : time,

                    allDay,

                    category

                }
            );

        } else {

            // ----------------------------------------------
            // NIEUWE AFSPRAAK
            // ----------------------------------------------

            await addDoc(
                appointmentsRef,
                {

                    title,

                    description,

                    start: date,

                    time: allDay ? "" : time,

                    allDay,

                    category,

                    createdAt:
                        new Date().toISOString()

                }
            );

        }


        closeFormModal();

        await loadAppointments();

    } catch (error) {

        console.error("Opslaan mislukt:", error);

        alert("Opslaan van de afspraak is mislukt.");

    }

}


// ======================================================
// AFSPRAAK BEKIJKEN
// ======================================================

function openViewModal(event) {

    if (!event) return;

    const modal =
        document.getElementById("eventViewModal");

    currentViewEvent = event;

    const category =
        event.extendedProps.category || "activity";

    const config =
        categoryConfig[category] ||
        categoryConfig.activity;


    document.getElementById("viewBadge").textContent =
        `${config.emoji} ${config.label}`;

    document.getElementById("viewBadge").style.background =
        config.color;


    document.getElementById("viewTitle").textContent =
        removeEmojiFromTitle(event.title);


    document.getElementById("viewDate").textContent =
        formatDutchDate(event.start);


    document.getElementById("viewTime").textContent =
        event.allDay
            ? "Hele dag"
            : (
                event.extendedProps.time ||
                formatTime(event.start)
            );


    document.getElementById("viewCategoryName").textContent =
        config.label;


    document.getElementById("viewDescription").textContent =
        event.extendedProps.description ||
        "Geen omschrijving.";


    openModal(modal);

}


// ======================================================
// MARKEREN ALS GEDAAN
// ======================================================

async function markEventAsDone() {

    if (!currentViewEvent) return;

    const event = currentViewEvent;

    try {

        await addDoc(
            completedAppointmentsRef,
            {

                title:
                    removeEmojiFromTitle(event.title),

                description:
                    event.extendedProps.description || "",

                start:
                    event.startStr.substring(0, 10),

                time:
                    event.extendedProps.time || "",

                allDay:
                    event.allDay,

                category:
                    event.extendedProps.category ||
                    "activity",

                originalId:
                    event.id,

                completedAt:
                    new Date().toISOString()

            }
        );


        await deleteDoc(
            doc(db, "appointments", event.id)
        );


        closeViewModal();

        await loadAppointments();


        alert("Afspraak is gemarkeerd als gedaan.");

    } catch (error) {

        console.error(
            "Afspraak afronden mislukt:",
            error
        );

        alert("De afspraak kon niet worden afgerond.");

    }

}


// ======================================================
// VERWIJDEREN
// ======================================================

async function deleteCurrentEvent() {

    if (!currentViewEvent) return;

    const id = currentViewEvent.id;

    const confirmed =
        confirm(
            "Weet je zeker dat je deze afspraak wilt verwijderen?"
        );

    if (!confirmed) return;


    try {

        await deleteDoc(
            doc(db, "appointments", id)
        );

        closeViewModal();

        await loadAppointments();

    } catch (error) {

        console.error(
            "Verwijderen mislukt:",
            error
        );

        alert("Verwijderen is mislukt.");

    }

}


// ======================================================
// MODAL OPEN
// ======================================================

function openModal(modal) {

    if (!modal) return;

    modal.classList.add("open");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


// ======================================================
// MODAL SLUITEN
// ======================================================

function closeModal(modal) {

    if (!modal) return;

    modal.classList.remove("open");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


// ======================================================
// FORM MODAL SLUITEN
// ======================================================

function closeFormModal() {

    closeModal(
        document.getElementById("eventModal")
    );

    editingEventId = null;

}


// ======================================================
// VIEW MODAL SLUITEN
// ======================================================

function closeViewModal() {

    closeModal(
        document.getElementById("eventViewModal")
    );

    currentViewEvent = null;

}


// ======================================================
// BUTTONS
// ======================================================

function setupButtons() {

    // Nieuwe afspraak
    document
        .getElementById("addEventButton")
        ?.addEventListener(
            "click",
            () => openFormModal()
        );


    // Opslaan
    document
        .getElementById("saveEventButton")
        ?.addEventListener(
            "click",
            saveEvent
        );


    // Annuleren
    document
        .getElementById("cancelEventButton")
        ?.addEventListener(
            "click",
            closeFormModal
        );


    // Form X
    document
        .getElementById("closeFormX")
        ?.addEventListener(
            "click",
            closeFormModal
        );


    // Gedaan
    document
        .getElementById("doneFromViewButton")
        ?.addEventListener(
            "click",
            markEventAsDone
        );


    // Bewerken
    document
        .getElementById("editFromViewButton")
        ?.addEventListener(
            "click",
            () => {

                if (currentViewEvent) {

                    openEditModal(
                        currentViewEvent
                    );

                }

            }
        );


    // Verwijderen
    document
        .getElementById("deleteFromViewButton")
        ?.addEventListener(
            "click",
            deleteCurrentEvent
        );


    // View sluiten
    document
        .getElementById("closeViewButton")
        ?.addEventListener(
            "click",
            closeViewModal
        );


    // View X
    document
        .getElementById("closeViewX")
        ?.addEventListener(
            "click",
            closeViewModal
        );

}


// ======================================================
// MODALS SLUITEN VIA ACHTERGROND / ESC
// ======================================================

function setupModalCloseEvents() {

    document
        .getElementById("eventModal")
        ?.addEventListener(
            "click",
            (event) => {

                if (
                    event.target.id ===
                    "eventModal"
                ) {

                    closeFormModal();

                }

            }
        );


    document
        .getElementById("eventViewModal")
        ?.addEventListener(
            "click",
            (event) => {

                if (
                    event.target.id ===
                    "eventViewModal"
                ) {

                    closeViewModal();

                }

            }
        );


    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {

                closeFormModal();

                closeViewModal();

            }

        }
    );

}


// ======================================================
// ZOEKEN
// ======================================================

function setupSearch() {

    const searchInput =
        document.getElementById("search");

    if (!searchInput) return;


    searchInput.addEventListener(
        "input",
        () => {

            const query =
                searchInput.value
                    .trim()
                    .toLowerCase();


            if (!calendar) return;


            calendar.getEvents().forEach(
                (event) => {

                    if (!query) {

                        event.setProp(
                            "display",
                            "auto"
                        );

                        return;

                    }


                    const title =
                        removeEmojiFromTitle(
                            event.title
                        ).toLowerCase();


                    const description =
                        (
                            event.extendedProps
                                .description || ""
                        ).toLowerCase();


                    const matches =
                        title.includes(query) ||
                        description.includes(query);


                    event.setProp(
                        "display",
                        matches
                            ? "auto"
                            : "none"
                    );

                }
            );

        }
    );

}


// ======================================================
// DARK MODE
// ======================================================

function setupTheme() {

    const button =
        document.getElementById("themeButton");

    if (!button) return;


    const savedTheme =
        localStorage.getItem(
            "snejin-theme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add("dark");

        button.textContent = "☀️";

    }


    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );


            const isDark =
                document.body.classList.contains(
                    "dark"
                );


            localStorage.setItem(
                "snejin-theme",
                isDark
                    ? "dark"
                    : "light"
            );


            button.textContent =
                isDark
                    ? "☀️"
                    : "🌙";

        }
    );

}


// ======================================================
// DATUM FORMATTEREN
// ======================================================

function formatDutchDate(date) {

    if (!date) return "-";


    return new Intl.DateTimeFormat(
        "nl-NL",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(date);

}


// ======================================================
// TIJD FORMATTEREN
// ======================================================

function formatTime(date) {

    if (!date) return "-";


    return new Intl.DateTimeFormat(
        "nl-NL",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

}


// ======================================================
// INPUT DATUM
// ======================================================

function formatDateForInput(date) {

    if (!date) {

        const today =
    
