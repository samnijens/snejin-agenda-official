// ======================================================
// SNEJIN AGENDA
// VOLLEDIG WERKENDE AGENDA.JS
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
// GLOBALS
// ======================================================

let calendar = null;

let selectedEventId = null;
let currentViewEvent = null;
let editingEventId = null;

let allCalendarEvents = [];


// ======================================================
// FIREBASE COLLECTIONS
// ======================================================

const appointmentsRef =
    collection(db, "appointments");

const completedAppointmentsRef =
    collection(db, "completedAppointments");


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

    try {

        setupTheme();

        setupButtons();

        setupModals();

        setupSearch();

        createCalendar();

        await loadAppointments();

    } catch (error) {

        console.error(
            "Agenda initialiseren mislukt:",
            error
        );

        showError(
            "De agenda kon niet worden geladen. Controleer je Firebase-configuratie en of FullCalendar geladen is."
        );

    }

});


// ======================================================
// CALENDAR MAKEN
// ======================================================

function createCalendar() {

    const calendarEl =
        document.getElementById("calendar");

    if (!calendarEl) {

        throw new Error(
            "Element #calendar bestaat niet in agenda.html."
        );

    }


    // Controle of FullCalendar geladen is

    if (
        typeof FullCalendar === "undefined" ||
        !FullCalendar.Calendar
    ) {

        throw new Error(
            "FullCalendar is niet geladen."
        );

    }


    calendar =
        new FullCalendar.Calendar(
            calendarEl,
            {

                initialView: "dayGridMonth",

                locale: "nl",

                firstDay: 1,

                height: "auto",

                contentHeight: "auto",

                selectable: true,

                editable: false,

                dayMaxEvents: 4,

                navLinks: true,

                nowIndicator: true,

                headerToolbar: {

                    left: "prev,next today",

                    center: "title",

                    right: "dayGridMonth,timeGridWeek,listWeek"

                },


                // ==========================================
                // DATUM AANKLIKKEN
                // ==========================================

                dateClick(info) {

                    openFormModal(
                        info.dateStr
                    );

                },


                // ==========================================
                // DATUM SELECTEREN
                // ==========================================

                select(info) {

                    const date =
                        info.startStr;

                    calendar.unselect();

                    openFormModal(date);

                },


                // ==========================================
                // AFSPRAAK AANKLIKKEN
                // ==========================================

                eventClick(info) {

                    info.jsEvent.preventDefault();

                    currentViewEvent =
                        info.event;

                    selectedEventId =
                        info.event.id;

                    openViewModal(
                        info.event
                    );

                },


                // ==========================================
                // EVENTS RENDEREN
                // ==========================================

                eventDidMount(info) {

                    const category =
                        info.event.extendedProps.category ||
                        "activity";

                    const config =
                        categoryConfig[category] ||
                        categoryConfig.activity;


                    info.el.title =
                        info.event.title;


                    info.el.style.cursor =
                        "pointer";


                    info.el.style.borderRadius =
                        "8px";


                    info.el.style.border =
                        "none";


                    info.el.style.backgroundColor =
                        config.color;


                    // Kleine animatie

                    info.el.style.transition =
                        "transform .2s ease, opacity .2s ease";


                    info.el.addEventListener(
                        "mouseenter",
                        () => {

                            info.el.style.transform =
                                "scale(1.02)";

                        }
                    );


                    info.el.addEventListener(
                        "mouseleave",
                        () => {

                            info.el.style.transform =
                                "scale(1)";

                        }
                    );

                }

            }
        );


    calendar.render();

}


// ======================================================
// AFSPRAKEN LADEN
// ======================================================

async function loadAppointments() {

    if (!calendar) return;


    try {

        calendar.removeAllEvents();

        allCalendarEvents = [];


        const snapshot =
            await getDocs(
                appointmentsRef
            );


        snapshot.forEach(
            docSnap => {

                const data =
                    docSnap.data();


                if (!data.start) {

                    console.warn(
                        "Afspraak zonder datum:",
                        docSnap.id
                    );

                    return;

                }


                const category =
                    data.category ||
                    "activity";


                const config =
                    categoryConfig[category] ||
                    categoryConfig.activity;


                const title =
                    data.title ||
                    "Afspraak";


                const emoji =
                    config.emoji ||
                    "";


                const event = {

                    id: docSnap.id,

                    title:
                        `${emoji} ${title}`,

                    start:
                        data.start,

                    allDay:
                        data.allDay !== false,

                    color:
                        config.color,

                    backgroundColor:
                        config.color,

                    borderColor:
                        config.color,

                    extendedProps: {

                        originalTitle:
                            title,

                        description:
                            data.description || "",

                        category:
                            category,

                        allDay:
                            data.allDay !== false

                    }

                };


                allCalendarEvents.push(
                    event
                );


                calendar.addEvent(
                    event
                );

            }
        );


        // Oude afspraken controleren

        await cleanupOldEvents();


    } catch (error) {

        console.error(
            "Afspraken laden mislukt:",
            error
        );

        showError(
            "De afspraken konden niet worden geladen."
        );

    }

}


// ======================================================
// NIEUWE AFSPRAAK OPSLAAN
// ======================================================

async function saveEvent() {

    const titleInput =
        document.getElementById(
            "eventTitle"
        );

    const descriptionInput =
        document.getElementById(
            "eventDescription"
        );

    const dateInput =
        document.getElementById(
            "eventDate"
        );

    const timeInput =
        document.getElementById(
            "eventTime"
        );

    const categoryInput =
        document.getElementById(
            "eventType"
        );

    const allDayInput =
        document.getElementById(
            "allDay"
        );


    if (
        !titleInput ||
        !descriptionInput ||
        !dateInput ||
        !timeInput ||
        !categoryInput ||
        !allDayInput
    ) {

        showError(
            "Een of meer formulier-elementen ontbreken in agenda.html."
        );

        return;

    }


    const title =
        titleInput.value.trim();

    const description =
        descriptionInput.value.trim();

    const date =
        dateInput.value;

    const time =
        timeInput.value;

    const category =
        categoryInput.value ||
        "activity";

    const allDay =
        allDayInput.checked;


    if (!title) {

        alert(
            "Vul een naam voor de afspraak in."
        );

        titleInput.focus();

        return;

    }


    if (!date) {

        alert(
            "Kies een datum."
        );

        dateInput.focus();

        return;

    }


    let start;


    if (allDay) {

        start = date;

    } else {

        if (!time) {

            alert(
                "Kies een tijd of vink 'Hele dag' aan."
            );

            timeInput.focus();

            return;

        }


        start =
            `${date}T${time}:00`;

    }


    try {

        disableSaveButton(true);


        // ==========================================
        // BESTAANDE AFSPRAAK BIJWERKEN
        // ==========================================

        if (editingEventId) {

            const eventRef =
                doc(
                    db,
                    "appointments",
                    editingEventId
                );


            await updateDoc(
                eventRef,
                {

                    title,

                    description,

                    start,

                    allDay,

                    category

                }
            );


            const existingEvent =
                calendar.getEventById(
                    editingEventId
                );


            if (existingEvent) {

                const config =
                    categoryConfig[category] ||
                    categoryConfig.activity;


                existingEvent.setProp(
                    "title",
                    `${config.emoji} ${title}`
                );


                existingEvent.setStart(
                    start
                );


                existingEvent.setAllDay(
                    allDay
                );


                existingEvent.setProp(
                    "backgroundColor",
                    config.color
                );


                existingEvent.setProp(
                    "borderColor",
                    config.color
                );


                existingEvent.setExtendedProp(
                    "originalTitle",
                    title
                );


                existingEvent.setExtendedProp(
                    "description",
                    description
                );


                existingEvent.setExtendedProp(
                    "category",
                    category
                );


                existingEvent.setExtendedProp(
                    "allDay",
                    allDay
                );

            }

        }

        // ==========================================
        // NIEUWE AFSPRAAK
        // ==========================================

        else {

            const newDoc =
                await addDoc(
                    appointmentsRef,
                    {

                        title,

                        description,

                        start,

                        allDay,

                        category,

                        createdAt:
                            new Date().toISOString()

                    }
                );


            const config =
                categoryConfig[category] ||
                categoryConfig.activity;


            calendar.addEvent({

                id:
                    newDoc.id,

                title:
                    `${config.emoji} ${title}`,

                start,

                allDay,

                color:
                    config.color,

                backgroundColor:
                    config.color,

                borderColor:
                    config.color,

                extendedProps: {

                    originalTitle:
                        title,

                    description,

                    category,

                    allDay

                }

            });

        }


        closeFormModal();

        resetForm();


    } catch (error) {

        console.error(
            "Opslaan mislukt:",
            error
        );

        showError(
            "Opslaan mislukt. Controleer je Firebase Firestore-regels."
        );

    } finally {

        disableSaveButton(false);

    }

}


// ======================================================
// AFSPRAAK BEWERKEN
// ======================================================

function editCurrentEvent() {

    if (!currentViewEvent) {

        return;

    }


    const event =
        currentViewEvent;


    editingEventId =
        event.id;


    const originalTitle =
        event.extendedProps.originalTitle ||
        removeEmojiFromTitle(
            event.title
        );


    document.getElementById(
        "formTitle"
    ).textContent =
        "Afspraak bewerken";


    document.getElementById(
        "eventTitle"
    ).value =
        originalTitle;


    document.getElementById(
        "eventDescription"
    ).value =
        event.extendedProps.description ||
        "";


    document.getElementById(
        "eventType"
    ).value =
        event.extendedProps.category ||
        "activity";


    document.getElementById(
        "allDay"
    ).checked =
        event.allDay;


    if (event.start) {

        const date =
            formatDateForInput(
                event.start
            );


        document.getElementById(
            "eventDate"
        ).value =
            date;


        if (
            !event.allDay
        ) {

            document.getElementById(
                "eventTime"
            ).value =
                formatTimeForInput(
                    event.start
                );

        } else {

            document.getElementById(
                "eventTime"
            ).value =
                "";

        }

    }


    updateTimeInputState();


    closeViewModal();

    openModal(
        "eventModal"
    );

}


// ======================================================
// AFSPRAAK MARKEREN ALS GEDAAN
// ======================================================

async function markEventAsDone() {

    if (!currentViewEvent) {

        return;

    }


    const event =
        currentViewEvent;


    const originalTitle =
        event.extendedProps.originalTitle ||
        removeEmojiFromTitle(
            event.title
        );


    const category =
        event.extendedProps.category ||
        "activity";


    try {

        await addDoc(
            completedAppointmentsRef,
            {

                title:
                    originalTitle,

                description:
                    event.extendedProps.description ||
                    "",

                start:
                    event.startStr,

                allDay:
                    event.allDay,

                category,

                completedAt:
                    new Date().toISOString(),

                originalId:
                    event.id

            }
        );


        await deleteDoc(
            doc(
                db,
                "appointments",
                event.id
            )
        );


        event.remove();


        currentViewEvent =
            null;

        selectedEventId =
            null;


        closeViewModal();


        alert(
            "Afspraak is gemarkeerd als gedaan."
        );


    } catch (error) {

        console.error(
            "Afronden mislukt:",
            error
        );

        showError(
            "De afspraak kon niet als gedaan worden gemarkeerd."
        );

    }

}


// ======================================================
// AFSPRAAK VERWIJDEREN
// ======================================================

async function deleteCurrentEvent() {

    const id =
        currentViewEvent
            ? currentViewEvent.id
            : selectedEventId;


    if (!id) {

        return;

    }


    const confirmed =
        confirm(
            "Weet je zeker dat je deze afspraak wilt verwijderen?"
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "appointments",
                id
            )
        );


        const event =
            calendar.getEventById(
                id
            );


        if (event) {

            event.remove();

        }


        currentViewEvent =
            null;

        selectedEventId =
            null;


        closeViewModal();

        closeFormModal();


    } catch (error) {

        console.error(
            "Verwijderen mislukt:",
            error
        );

        showError(
            "Verwijderen mislukt."
        );

    }

}


// ======================================================
// OUDE AFSPRAKEN AUTOMATISCH OPRUIMEN
//
// Oude afspraken worden verplaatst naar
// completedAppointments.
//
// Ze worden dus NIET definitief verwijderd.
// ======================================================

async function cleanupOldEvents() {

    try {

        const snapshot =
            await getDocs(
                appointmentsRef
            );


        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );


        for (
            const docSnap of snapshot.docs
        ) {

            const data =
                docSnap.data();


            if (!data.start) {

                continue;

            }


            const eventDate =
                parseFirestoreDate(
                    data.start
                );


            if (!eventDate) {

                continue;

            }


            eventDate.setHours(
                0,
                0,
                0,
         
