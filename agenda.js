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
// GLOBALS
// ======================================================

let calendar = null;

let selectedEventId = null;
let currentViewEvent = null;
let editingEventId = null;

let allAppointments = [];
let completedAppointments = [];

let notificationsEnabled =
    localStorage.getItem("snejin_notifications") === "true";

let notificationMinutes =
    Number(localStorage.getItem("snejin_notification_minutes")) || 10;

const appointmentsRef = collection(db, "appointments");
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

    setupTheme();

    setupButtons();

    setupNotifications();

    setupSearch();

    setupModalButtons();

    setupCalendar();

    await loadAppointments();

    await loadCompletedAppointments();

    cleanupOldAppointments();

    updateNotificationButton();

});


// ======================================================
// CALENDAR INITIALISEREN
// ======================================================

function setupCalendar() {

    const calendarEl = document.getElementById("calendar");

    if (!calendarEl) {
        console.error("❌ #calendar ontbreekt in agenda.html");
        return;
    }

    calendar = new FullCalendar.Calendar(calendarEl, {

        initialView: "dayGridMonth",

        locale: "nl",

        firstDay: 1,

        selectable: true,

        editable: false,

        dayMaxEvents: true,

        height: "auto",

        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,listWeek"
        },

        buttonText: {
            today: "Vandaag",
            month: "Maand",
            week: "Week",
            list: "Lijst"
        },

        select: function(info) {

            openFormModal(info.startStr);

        },

        eventClick: function(info) {

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

                start: data.start,

                description: data.description || "",

                allDay: data.allDay !== false,

                category: data.category || "activity"

            };

            allAppointments.push(appointment);

            addAppointmentToCalendar(appointment);

        });

    } catch (error) {

        console.error("Fout bij laden afspraken:", error);

        alert("De afspraken konden niet worden geladen.");

    }

}


// ======================================================
// EVENT AAN KALENDER TOEVOEGEN
// ======================================================

function addAppointmentToCalendar(appointment) {

    const config =
        categoryConfig[appointment.category] ||
        categoryConfig.activity;

    calendar.addEvent({

        id: appointment.id,

        title:
            `${config.emoji} ${appointment.title}`,

        start: appointment.start,

        allDay: appointment.allDay,

        backgroundColor: config.color,

        borderColor: config.color,

        textColor: "#ffffff",

        extendedProps: {

            description: appointment.description,

            category: appointment.category,

            originalTitle: appointment.title

        }

    });

}


// ======================================================
// NIEUWE AFSPRAAK / BEWERKEN
// ======================================================

async function saveEvent() {

    const titleEl =
        document.getElementById("eventTitle");

    const descriptionEl =
        document.getElementById("eventDescription");

    const dateEl =
        document.getElementById("eventDate");

    const timeEl =
        document.getElementById("eventTime");

    const categoryEl =
        document.getElementById("eventType");

    const allDayEl =
        document.getElementById("allDay");


    if (
        !titleEl ||
        !descriptionEl ||
        !dateEl ||
        !timeEl ||
        !categoryEl ||
        !allDayEl
    ) {

        console.error("Formuliervelden ontbreken.");

        return;

    }


    const title =
        titleEl.value.trim();

    const description =
        descriptionEl.value.trim();

    const date =
        dateEl.value;

    const time =
        timeEl.value;

    const category =
        categoryEl.value || "activity";

    const allDay =
        allDayEl.checked;


    if (!title) {

        alert("Vul een naam in.");

        titleEl.focus();

        return;

    }


    if (!date) {

        alert("Kies een datum.");

        dateEl.focus();

        return;

    }


    let start;


    if (allDay) {

        start = date;

    } else {

        if (!time) {

            alert("Kies een tijd.");

            timeEl.focus();

            return;

        }

        start = `${date}T${time}`;

    }


    try {

        if (editingEventId) {

            await updateDoc(
                doc(
                    db,
                    "appointments",
                    editingEventId
                ),
                {

                    title,

                    description,

                    start,

                    allDay,

                    category

                }
            );

        } else {

            await addDoc(
                appointmentsRef,
                {

                    title,

                    description,

                    start,

                    allDay,

                    category

                }
            );

        }


        editingEventId = null;

        closeFormModal();

        closeViewModal();

        await loadAppointments();

        await loadCompletedAppointments();

        alert(
            "Afspraak opgeslagen!"
        );

    } catch (error) {

        console.error(
            "Fout bij opslaan:",
            error
        );

        alert(
            "De afspraak kon niet worden opgeslagen."
        );

    }

}


// ======================================================
// FORM MODAL OPENEN
// ======================================================

function openFormModal(date = null, event = null) {

    const modal =
        document.getElementById("eventModal");

    if (!modal) return;


    const titleEl =
        document.getElementById("eventTitle");

    const descriptionEl =
        document.getElementById("eventDescription");

    const dateEl =
        document.getElementById("eventDate");

    const timeEl =
        document.getElementById("eventTime");

    const categoryEl =
        document.getElementById("eventType");

    const allDayEl =
        document.getElementById("allDay");

    const formTitle =
        document.getElementById("formTitle");


    if (!titleEl) return;


    if (event) {

        editingEventId = event.id;

        const props =
            event.extendedProps || {};


        titleEl.value =
            props.originalTitle ||
            event.title.replace(
                /^[^\s]+\s/,
                ""
            );


        descriptionEl.value =
            props.description || "";


        const eventDate =
            event.startStr.substring(
                0,
                10
            );

        dateEl.value = eventDate;


        if (event.allDay) {

            timeEl.value = "";

        } else {

            const dateObject =
                event.start;

            timeEl.value =
                dateObject
                    .toTimeString()
                    .substring(0, 5);

        }


        categoryEl.value =
            props.category || "activity";


        allDayEl.checked =
            event.allDay;


        if (formTitle) {

            formTitle.textContent =
                "Afspraak bewerken";

        }

    } else {

        editingEventId = null;

        titleEl.value = "";

        descriptionEl.value = "";

        dateEl.value =
            date ||
            getTodayString();

        timeEl.value = "";

        categoryEl.value =
            "activity";

        allDayEl.checked = true;


        if (formTitle) {

            formTitle.textContent =
                "Nieuwe afspraak";

        }

    }


    modal.style.display = "flex";

    requestAnimationFrame(() => {

        modal.classList.add("open");

    });


    setTimeout(() => {

        titleEl.focus();

    }, 100);

}


// ======================================================
// VIEW MODAL
// ======================================================

function openViewModal(event) {

    const modal =
        document.getElementById(
            "eventViewModal"
        );

    if (!modal) return;


    const props =
        event.extendedProps || {};


    const category =
        props.category || "activity";

    const config =
        categoryConfig[category] ||
        categoryConfig.activity;


    const title =
        props.originalTitle ||
        event.title;


    document.getElementById(
        "viewTitle"
    ).textContent = title;


    document.getElementById(
        "viewDate"
    ).textContent =
        formatDate(event.start);


    document.getElementById(
        "viewTime"
    ).textContent =
        event.allDay
            ? "Hele dag"
            : formatTime(event.start);


    document.getElementById(
        "viewCategoryName"
    ).textContent =
        `${config.emoji} ${config.label}`;


    document.getElementById(
        "viewDescription"
    ).textContent =
        props.description ||
        "Geen omschrijving.";


    const badge =
        document.getElementById(
            "viewBadge"
        );


    if (badge) {

        badge.textContent =
            `${config.emoji} ${config.label}`;

        badge.style.background =
            config.color;

    }


    modal.style.display = "flex";

    requestAnimationFrame(() => {

        modal.classList.add("open");

    });

}


// ======================================================
// MODALS SLUITEN
// ======================================================

function closeViewModal() {

    const modal =
        document.getElementById(
            "eventViewModal"
        );

    if (!modal) return;

    modal.classList.remove("open");

    setTimeout(() => {

        modal.style.display = "none";

    }, 250);

}


function closeFormModal() {

    const modal =
        document.getElementById(
            "eventModal"
        );

    if (!modal) return;

    modal.classList.remove("open");

    setTimeout(() => {

        modal.style.display = "none";

    }, 250);

}


// ======================================================
// BEWERKEN
// ======================================================

function editCurrentEvent() {

    if (!currentViewEvent) return;

    const event =
        currentViewEvent;

    closeViewModal();

    setTimeout(() => {

        openFormModal(
            null,
            event
        );

    }, 250);

}


// ======================================================
// AFSPRAAK AFRONDEN
// ======================================================

async function markEventAsDone() {

    if (!currentViewEvent) return;


    const event =
        currentViewEvent;


    const props =
        event.extendedProps || {};


    try {

        await addDoc(
            completedAppointmentsRef,
            {

                originalId: event.id,

                title:
                    props.originalTitle ||
                    event.title,

                description:
                    props.description ||
                    "",

                start:
                    event.startStr,

                allDay:
                    event.allDay,

                category:
                    props.category ||
                    "activity",

                completedAt:
                    new Date().toISOString()

            }
        );


        await deleteDoc(
            doc(
                db,
                "appointments",
                event.id
            )
        );


        currentViewEvent = null;


        closeViewModal();

        await loadAppointments();

        await loadCompletedAppointments();


        alert(
            "Afspraak gemarkeerd als gedaan!"
        );


    } catch (error) {

        console.error(
            "Fout bij afronden:",
            error
        );

        alert(
            "De afspraak kon niet worden afgerond."
        );

    }

}


// ======================================================
// VERWIJDEREN
// ======================================================

async function deleteCurrentEvent() {

    if (!currentViewEvent) return;


    const id =
        currentViewEvent.id;


    const confirmed =
        confirm(
            "Weet je zeker dat je deze afspraak wilt verwijderen?"
        );


    if (!confirmed) return;


    try {

        await deleteDoc(
            doc(
                db,
                "appointments",
                id
            )
        );


        currentViewEvent = null;


        closeViewModal();

        closeFormModal();

        await loadAppointments();


    } catch (error) {

        console.error(
            "Fout bij verwijderen:",
            error
        );

        alert(
            "Verwijderen mislukt."
        );

    }

}


// ======================================================
// ARCHIEF LADEN
// ======================================================

async function loadCompletedAppointments() {

    const list =
        document.getElementById(
            "completedList"
        );


    if (!list) return;


    list.innerHTML =
        `<li>Archief laden...</li>`;


    try {

        completedAppointments = [];


        const snapshot =
            await getDocs(
                completedAppointmentsRef
            );


        snapshot.forEach(
            (docSnap) => {

                completedAppointments.push({

                    id: docSnap.id,

                    ...docSnap.data()

                });

            }
        );


        renderCompletedAppointments();


    } catch (error) {

        console.error(
            "Fout bij laden archief:",
            error
        );


        list.innerHTML =
            `<li>Archief kon niet worden geladen.</li>`;

    }

}


// ======================================================
// ARCHIEF WEERGEVEN
// ======================================================

function renderCompletedAppointments() {

    const list =
        document.getElementById(
            "completedList"
        );


    if (!list) return;


    list.innerHTML = "";


    if (
        completedAppointments.length === 0
    ) {

        const empty =
            document.createElement("li");

        empty.textContent =
            "Nog geen afgeronde afspraken.";

        list.appendChild(empty);

        return;

    }


    completedAppointments
        .sort(
            (a, b) =>
                new Date(
                    b.completedAt ||
                    b.start ||
                    0
                ) -
                new Date(
                    a.completedAt ||
                    a.start ||
                    0
                )
        )
        .forEach(
            (appointment) => {

                const li =
                    document.createElement(
                        "li"
                    );


                const info =
                    document.createElement(
                        "div"
                    );


                const title =
                    document.createElement(
                        "strong"
                    );


                title.textContent =
                    appointment.title ||
                    "Afspraak";


                const date =
                    document.createElement(
                        "small"
                    );


                date.textContent =
                    appointment.start
                        ? formatDateString(
                            appointment.start
                        )
                        : "";


                info.appendChild(title);

                info.appendChild(
                    document.createElement("br")
                );

                info.appendChild(date);


                const buttons =
                    document.createElement(
                        "div"
                    );


                const restore =
                    document.createElement(
                        "button"
                    );


                restore.type = "button";

                restore.textContent =
                    "↩️ Terugzetten";


                restore.addEventListener(
                    "click",
                    () =>
                        restoreAppointment(
                            appointment
                        )
                );


                const remove =
                    document.createElement(
                        "button"
                    );


                remove.type = "button";

                remove.textContent =
                    "🗑️";


                remove.addEventListener(
                    "click",
                    () =>
                        deleteCompletedAppointment(
                            appointment.id
                        )
                );


                buttons.appendChild(
                    restore
                );

                buttons.appendChild(
                    remove
                );


                li.appendChild(info);

                li.appendChild(buttons);


                list.appendChild(li);

            }
        );

}


// ======================================================
// AFSPRAAK TERUGZETTEN
// ======================================================

async function restoreAppointment(
    appointment
) {

    try {

        await addDoc(
            appointmentsRef,
            {

                title:
                    appointment.title ||
                    "Afspraak",

                description:
                    appointment.description ||
                    "",

                start:
                    appointment.start ||
                    getTodayString(),

                allDay:
                    appointment.allDay !== false,

                category:
                    appointment.category ||
                    "activity"

            }
        );


        await deleteDoc(
            doc(
                db,
                "completedAppointments",
                appointment.id
            )
        );


        await loadAppointments();

        await loadCompletedAppointments();


        alert(
            "Afspraak is teruggezet in de agenda!"
        );


    } catch (error) {

        console.error(
            "Fout bij terugzetten:",
            error
        );

        alert(
            "Terugzetten mislukt."
        );

    }

}


// ======================================================
// ARCHIEF ITEM DEFINITIEF VERWIJDEREN
// ======================================================

async function deleteCompletedAppointment(
    id
) {

    if (
        !confirm(
            "Deze afspraak definitief verwijderen?"
        )
    ) return;


    try {

        await deleteDoc(
            doc(
                db,
                "completedAppointments",
                id
            )
        );


        await loadCompletedAppointments();


    } catch (error) {

        console.error(error);

        alert(
            "Verwijderen uit archief mislukt."
        );

    }

}


// ======================================================
// OUDE EVENTS AUTOMATISCH ARCHIVEREN
// ======================================================

async function cleanupOldAppointments() {

    try {

        const now =
            new Date();


        const snapshot =
            await getDocs(
                appointmentsRef
            );


        for (
            const docSnap of snapshot.docs
        ) {

            const data =
                docSnap.data();


            if (!data.start) continue;


            const eventDate =
                new Date(data.start);


            if (
                eventDate < now &&
                data.allDay !== true
            ) {

                await moveToCompleted(
                    docSnap.id,
                    data
                );

            }

        }


        await loadAppointments();

        await loadCompletedAppointments();


    } catch (error) {

        console.error(
            "Automatisch opruimen mislukt:",
            error
        );

    }

}


// ======================================================
// EVENT NAAR ARCHIEF
// ======================================================

async function moveToCompleted(
    id,
    data
) {

    await addDoc(
        completedAppointmentsRef,
        {

            originalId: id,

            title:
                data.title ||
                "Afspraak",

            description:
                data.description ||
                "",

            start:
                data.start,

            allDay:
                data.allDay !== false,

            category:
                data.category ||
                "activity",

            completedAt:
                new Date().toISOString(),

            automaticallyArchived:
                true

        }
    );


    await deleteDoc(
        doc(
            db,
            "appointments",
            id
        )
    );

}


// ======================================================
// ZOEKEN
// ======================================================

function setupSearch() {

    const search =
        document.getElementById(
            "search"
        );


    if (!search) return;


    search.addEventListener(
        "input",
        () => {

            const query =
                search.value
                    .trim()
                    .toLowerCase();


            if (!calendar) return;


            calendar.getEvents()
                .forEach(
                    (event) => {

                        const title =
                            (
                                event.extendedProps
                                    ?.originalTitle ||
                                event.title
                            )
                                .toLowerCase();


                        const description =
                            (
                                event.extendedProps
                                    ?.description ||
                                ""
                            )
                                .toLowerCase();


                        const match =
                            !query ||
                            title.includes(query) ||
                            description.includes(query);


                        event.setProp(
                            "display",
                            match
                                ? "auto"
                                : "none"
                        );

                    }
                );

        }
    );

}


// ======================================================
// THEME / DARK MODE
// ======================================================

function setupTheme() {

    const button =
        document.getElementById(
            "themeButton"
        );


    const saved =
        localStorage.getItem(
            "snejin_theme"
        );


    if (saved === "dark") {

        document.body.classList.add(
            "dark"
        );

    }


    updateThemeButton();


    if (!button) return;


    button.addEventListener(
        "click",
        () => {

            const fade =
                document.createElement(
                    "div"
                );


            fade.className =
                "theme-fade";


            document.body.appendChild(
                fade
            );


            requestAnimationFrame(
                () => {

                    fade.classList.add(
                        "active"
                    );

                }
            );


            setTimeout(
                () => {

                    document.body.classList.toggle(
                        "dark"
                    );


                    const isDark =
                        document.body.classList.contains(
                            "dark"
                        );


                    localStorage.setItem(
                        "snejin_theme",
                        isDark
                            ? "dark"
                            : "light"
                    );


                    updateThemeButton();


                    setTimeout(
                        () => {

                            fade.classList.remove(
                                "active"
                            );


                            setTimeout(
                                () =>
                                    fade.remove(),
                                350
                            );

                        },
                        100
                    );

                },
                180
            );

        }
    );

}


function updateThemeButton() {

    const button =
        document.getElementById(
            "themeButton"
        );


    if (!button) return;


    const isDark =
        document.body.classList.contains(
            "dark"
        );


    button.textContent =
        isDark
            ? "☀️"
            : "🌙";

}


// ======================================================
// NOTIFICATIES
// ======================================================

function setupNotifications() {

    const button =
        document.getElementById(
            "notifToggle"
        );


    const selector =
        document.getElementById(
            "notifyTime"
        );


    if (selector) {

        selector.value =
            String(notificationMinutes);


        selector.addEventListener(
            "change",
            () => {

                notificationMinutes =
                    Number(
                        selector.value
                    );


                localStorage.setItem(
                    "snejin_notification_minutes",
                    notificationMinutes
                );

            }
        );

    }


    if (!button) return;


    button.addEventListener(
        "click",
        async () => {

            if (!notificationsEnabled) {

                if (
                    !("Notification" in window)
                ) {

                    alert(
                        "Deze browser ondersteunt geen notificaties."
                    );

                    return;

                }


                const permission =
                    await Notification.requestPermission();


                if (
                    permission !== "granted"
                ) {

                    alert(
                        "Notificaties zijn niet toegestaan in je browser."
                    );

                    return;

                }


                notificationsEnabled = true;

            } else {

                notificationsEnabled = false;

            }


            localStorage.setItem(
                "snejin_notifications",
                String(
                    notificationsEnabled
                )
            );


            updateNotificationButton();

        }
    );


    updateNotificationButton();

}


// ======================================================
// NOTIFICATIE KNOP
// ======================================================

function updateNotificationButton() {

    const button =
        document.getElementById(
            "notifToggle"
        );


    if (!button) return;


    if (notificationsEnabled) {

        button.textContent =
            "🔔";

        button.classList.add(
            "active"
        );

        button.title =
            `Notificaties aan (${notificationMinutes} min)`;

    } else {

        button.textContent =
            "🔕";

        button.classList.remove(
            "active"
        );

        button.title =
            "Notificaties uit";

    }

}


// ======================================================
// NOTIFICATIES CONTROLEREN
// ======================================================

setInterval(
    checkNotifications,
    30000
);


function checkNotifications() {

    if (
        !notificationsEnabled ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) return;


    const now =
        new Date();


    allAppointments.forEach(
        (appointment) => {

            if (appointment.allDay) return;

            if (!appointment.start) return;


            const eventDate =
                new Date(
                    appointment.start
                );


            const difference =
                eventDate - now;


            const minutes =
                difference /
                60000;


            if (
                minutes > 0 &&
                minutes <= notificationMinutes &&
                minutes > notificationMinutes - 0.5
            ) {

                const key =
                    `notification_${appointment.id}_${Math.floor(eventDate.getTime() / 60000)}`;


                if (
                    localStorage.getItem(key)
                ) return;


                localStorage.setItem(
                    key,
                    "true"
                );


                new Notification(
                    appointment.title,
                    {

                        body:
                            `Begint over ongeveer ${Math.ceil(minutes)} minuten.`,

                        icon:
                            "logo.png"

                    }
                );

            }

        }
    );

}


// ======================================================
// ALLE KNOPPEN
// ======================================================

function setupButtons() {

    const addButton =
        document.getElementById(
            "addEventButton"
        );


    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            () => {

                openFormModal(
                    getTodayString()
                );

            }
        );

    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "index.html";

            }
        );

    }

}


// ======================================================
// MODAL KNOPPEN
// ======================================================

function setupModalButtons() {

    const saveButton =
        document.getElementById(
            "saveEventButton"
        );


    const cancelButton =
        document.getElementById(
            "cancelEventButton"
        );


    const closeFormX =
        document.getElementById(
            "closeFormX"
        );


    const closeViewX =
        document.getElementById(
            "closeViewX"
        );


    const closeViewButton =
        document.getElementById(
            "closeViewButton"
        );


    const editButton =
        document.getElementById(
            "editFromViewButton"
        );


    const deleteButton =
        document.getElementById(
            "deleteFromViewButton"
        );


    const doneButton =
        document.getElementById(
            "doneFromViewButton"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveEvent
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeFormModal
        );

    }


    if (closeFormX) {

        closeFormX.addEventListener(
            "click",
            closeFormModal
        );

    }


    if (closeViewX) {

        closeViewX.addEventListener(
            "click",
            closeViewModal
        );

    }


    if (closeViewButton) {

        closeViewButton.addEventListener(
            "click",
            closeViewModal
        );

    }


    if (editButton) {

        editButton.addEventListener(
            "click",
            editCurrentEvent
        );

    }


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            deleteCurrentEvent
        );

    }


    if (doneButton) {

        doneButton.addEventListener(
            "click",
            markEventAsDone
        );

    }


    document.querySelectorAll(
        ".modal"
    ).forEach(
        (modal) => {

            modal.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target === modal
                    ) {

                        if (
                            modal.id ===
                            "eventModal"
                        ) {

                            closeFormModal();

                        } else {

                            closeViewModal();

                        }

                    }

                }
            );

        }
    );


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key !== "Escape"
            ) return;


            closeFormModal();

            closeViewModal();

        }
    );

}


// ======================================================
// DATUM HELPERS
// ======================================================

function getTodayString() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


// ======================================================
// DATUM FORMATTER
// ======================================================

function formatDate(date) {

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


function formatDateString(dateString) {

    if (!dateString) return "-";


    const date =
        new Date(dateString);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return new Intl.DateTimeFormat(
        "nl-NL",
        {

            day: "numeric",

            month: "long",

            year: "numeric"

        }
    ).format(date);

}


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
