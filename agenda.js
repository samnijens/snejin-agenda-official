import { db, auth } from "./firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

let calendar = null;
let selectedEventId = null;
let currentViewEvent = null;
let editingEventId = null;

const appointmentsRef = collection(db, "appointments");
const completedAppointmentsRef = collection(db, "completedAppointments");

const categoryConfig = {
    work: { label: "Werken", color: "#ff3b3b", emoji: "🔴" },
    holiday: { label: "Vakantie", color: "#28a745", emoji: "🟢" },
    activity: { label: "Activiteit", color: "#198754", emoji: "🟩" },
    birthday: { label: "Verjaardag", color: "#fd7e14", emoji: "🎂" },
    holidayofficial: { label: "Officiële feestdag", color: "#ffc107", emoji: "🟡" }
};

document.addEventListener("DOMContentLoaded", () => {
    setupTheme();
    setupButtons();
    setupModals();
    setupSearch();

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.replace("index.html");
            return;
        }

        try {
            createCalendar();
            await loadAppointments();
        } catch (error) {
            console.error("Agenda initialiseren mislukt:", error);
            showMessage("De agenda kon niet worden geladen.", "error");
        }
    });
});

function createCalendar() {
    const calendarEl = document.getElementById("calendar");
    if (!calendarEl) throw new Error("Element #calendar ontbreekt.");
    if (typeof FullCalendar === "undefined" || !FullCalendar.Calendar) {
        throw new Error("FullCalendar is niet geladen.");
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
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
        dateClick(info) {
            calendar.unselect();
            openFormModal(info.dateStr);
        },
        select(info) {
            calendar.unselect();
            openFormModal(info.startStr);
        },
        eventClick(info) {
            info.jsEvent.preventDefault();
            currentViewEvent = info.event;
            selectedEventId = info.event.id;
            openViewModal(info.event);
        },
        eventDidMount(info) {
            const config = categoryConfig[info.event.extendedProps.category] || categoryConfig.activity;
            info.el.title = info.event.title;
            info.el.style.cursor = "pointer";
            info.el.style.borderRadius = "8px";
            info.el.style.border = "none";
            info.el.style.backgroundColor = config.color;
        }
    });

    calendar.render();
}

async function loadAppointments() {
    if (!calendar) return;

    try {
        calendar.removeAllEvents();
        const snapshot = await getDocs(appointmentsRef);

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data.start) return;

            const category = data.category || "activity";
            const config = categoryConfig[category] || categoryConfig.activity;
            const title = data.title || "Afspraak";

            calendar.addEvent({
                id: docSnap.id,
                title: `${config.emoji} ${title}`,
                start: data.start,
                allDay: data.allDay !== false,
                color: config.color,
                backgroundColor: config.color,
                borderColor: config.color,
                extendedProps: {
                    originalTitle: title,
                    description: data.description || "",
                    category,
                    allDay: data.allDay !== false
                }
            });
        });

        await cleanupOldEvents();
    } catch (error) {
        console.error("Afspraken laden mislukt:", error);
        showMessage("De afspraken konden niet worden geladen. Controleer je Firestore-instellingen.", "error");
    }
}

async function saveEvent() {
    const title = document.getElementById("eventTitle").value.trim();
    const description = document.getElementById("eventDescription").value.trim();
    const date = document.getElementById("eventDate").value;
    const time = document.getElementById("eventTime").value;
    const category = document.getElementById("eventType").value || "activity";
    const allDay = document.getElementById("allDay").checked;

    if (!title) {
        showMessage("Vul een naam voor de afspraak in.", "error");
        return;
    }
    if (!date) {
        showMessage("Kies een datum.", "error");
        return;
    }
    if (!allDay && !time) {
        showMessage("Kies een tijd of vink 'Hele dag' aan.", "error");
        return;
    }

    const start = allDay ? date : `${date}T${time}:00`;

    try {
        disableSaveButton(true);

        if (editingEventId) {
            await updateDoc(doc(db, "appointments", editingEventId), {
                title, description, start, allDay, category
            });

            const event = calendar.getEventById(editingEventId);
            if (event) {
                const config = categoryConfig[category] || categoryConfig.activity;
                event.setProp("title", `${config.emoji} ${title}`);
                event.setProp("backgroundColor", config.color);
                event.setProp("borderColor", config.color);
                event.setStart(start);
                event.setAllDay(allDay);
                event.setExtendedProp("originalTitle", title);
                event.setExtendedProp("description", description);
                event.setExtendedProp("category", category);
            }
        } else {
            const newDoc = await addDoc(appointmentsRef, {
                title,
                description,
                start,
                allDay,
                category,
                createdAt: new Date().toISOString()
            });

            const config = categoryConfig[category] || categoryConfig.activity;
            calendar.addEvent({
                id: newDoc.id,
                title: `${config.emoji} ${title}`,
                start,
                allDay,
                color: config.color,
                backgroundColor: config.color,
                borderColor: config.color,
                extendedProps: { originalTitle: title, description, category, allDay }
            });
        }

        closeFormModal();
        resetForm();
        showMessage("Afspraak opgeslagen.", "success");
    } catch (error) {
        console.error("Opslaan mislukt:", error);
        showMessage("Opslaan mislukt. Controleer je Firestore-regels.", "error");
    } finally {
        disableSaveButton(false);
    }
}

function editCurrentEvent() {
    if (!currentViewEvent) return;
    const event = currentViewEvent;
    editingEventId = event.id;

    document.getElementById("formTitle").textContent = "Afspraak bewerken";
    document.getElementById("eventTitle").value = event.extendedProps.originalTitle || removeEmojiFromTitle(event.title);
    document.getElementById("eventDescription").value = event.extendedProps.description || "";
    document.getElementById("eventType").value = event.extendedProps.category || "activity";
    document.getElementById("allDay").checked = event.allDay;

    if (event.start) {
        document.getElementById("eventDate").value = formatDateForInput(event.start);
        document.getElementById("eventTime").value = event.allDay ? "" : formatTimeForInput(event.start);
    }

    updateTimeInputState();
    closeViewModal();
    openModal("eventModal");

    setTimeout(() => { document.getElementById("eventTitle")?.focus(); }, 50);
}

async function markEventAsDone() {
    if (!currentViewEvent) return;
    const event = currentViewEvent;

    try {
        await addDoc(completedAppointmentsRef, {
            title: event.extendedProps.originalTitle || removeEmojiFromTitle(event.title),
            description: event.extendedProps.description || "",
            start: event.startStr,
            allDay: event.allDay,
            category: event.extendedProps.category || "activity",
            completedAt: new Date().toISOString(),
            originalId: event.id
        });

        await deleteDoc(doc(db, "appointments", event.id));
        event.remove();

        currentViewEvent = null;
        selectedEventId = null;
        closeViewModal();
        showMessage("Afspraak is gemarkeerd als gedaan.", "success");
    } catch (error) {
        console.error("Afronden mislukt:", error);
        showMessage("De afspraak kon niet als gedaan worden gemarkeerd.", "error");
    }
}

async function deleteCurrentEvent() {
    const id = currentViewEvent?.id || selectedEventId;
    if (!id) return;

    if (!confirm("Weet je zeker dat je deze afspraak wilt verwijderen?")) return;

    try {
        await deleteDoc(doc(db, "appointments", id));
        const event = calendar.getEventById(id);
        if (event) event.remove();

        currentViewEvent = null;
        selectedEventId = null;
        closeViewModal();
        closeFormModal();
        showMessage("Afspraak verwijderd.", "success");
    } catch (error) {
        console.error("Verwijderen mislukt:", error);
        showMessage("Verwijderen mislukt. Controleer je Firestore-regels.", "error");
    }
}

async function cleanupOldEvents() {
    try {
        const snapshot = await getDocs(appointmentsRef);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            if (!data.start) continue;

            const eventDate = parseFirestoreDate(data.start);
            if (!eventDate) continue;

            eventDate.setHours(0, 0, 0, 0);

            if (eventDate < today) {
                await addDoc(completedAppointmentsRef, {
                    title: data.title || "Afspraak",
                    description: data.description || "",
                    start: data.start,
                    allDay: data.allDay !== false,
                    category: data.category || "activity",
                    completedAt: new Date().toISOString(),
                    originalId: docSnap.id,
                    automatic: true
                });

                await deleteDoc(doc(db, "appointments", docSnap.id));
                calendar?.getEventById(docSnap.id)?.remove();
            }
        }
    } catch (error) {
        console.error("Oude afspraak opruimen mislukt:", error);
    }
}

function setupButtons() {
    document.getElementById("addEventButton")?.addEventListener("click", () => openFormModal());
    document.getElementById("logoutButton")?.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.replace("index.html");
        } catch (error) {
            console.error("Uitloggen mislukt:", error);
            showMessage("Uitloggen mislukt.", "error");
        }
    });
}

function setupModals() {
    document.getElementById("saveEventButton")?.addEventListener("click", saveEvent);
    document.getElementById("cancelEventButton")?.addEventListener("click", closeFormModal);
    document.getElementById("closeFormX")?.addEventListener("click", closeFormModal);
    document.getElementById("closeViewX")?.addEventListener("click", closeViewModal);
    document.getElementById("closeViewButton")?.addEventListener("click", closeViewModal);
    document.getElementById("editFromViewButton")?.addEventListener("click", editCurrentEvent);
    document.getElementById("deleteFromViewButton")?.addEventListener("click", deleteCurrentEvent);
    document.getElementById("doneFromViewButton")?.addEventListener("click", markEventAsDone);
    document.getElementById("allDay")?.addEventListener("change", updateTimeInputState);

    document.querySelectorAll(".modal").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target !== modal) return;
            if (modal.id === "eventModal") closeFormModal();
            else closeViewModal();
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeFormModal();
            closeViewModal();
        }
    });
}

function setupSearch() {
    const input = document.getElementById("search");
    if (!input) return;

    input.addEventListener("input", () => {
        const query = input.value.trim().toLowerCase();
        if (!calendar) return;

        calendar.getEvents().forEach((event) => {
            const title = (event.extendedProps.originalTitle || event.title || "").toLowerCase();
            const description = (event.extendedProps.description || "").toLowerCase();

            if (title.includes(query) || description.includes(query)) {
                event.setProp("display", "auto");
            } else {
                event.setProp("display", "none");
            }
        });
    });
}

function setupTheme() {
    const themeBtn = document.getElementById("themeButton");
    const isDark = localStorage.getItem("theme") === "dark";
    if (isDark) document.body.classList.add("dark-mode");

    themeBtn?.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const darkModeActive = document.body.classList.contains("dark-mode");
        localStorage.setItem("theme", darkModeActive ? "dark" : "light");
    });
}

// Modal Helpers
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = "flex";
        modal.setAttribute("aria-hidden", "false");
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
    }
}

function openFormModal(dateStr = "") {
    editingEventId = null;
    resetForm();
    document.getElementById("formTitle").textContent = "Nieuwe afspraak";

    if (dateStr) {
        document.getElementById("eventDate").value = dateStr.split("T")[0];
        if (dateStr.includes("T")) {
            document.getElementById("eventTime").value = dateStr.split("T")[1].substring(0, 5);
            document.getElementById("allDay").checked = false;
        }
    } else {
        document.getElementById("eventDate").value = new Date().toISOString().split("T")[0];
    }

    updateTimeInputState();
    openModal("eventModal");
}

function closeFormModal() {
    closeModal("eventModal");
    resetForm();
}

function openViewModal(event) {
    const config = categoryConfig[event.extendedProps.category] || categoryConfig.activity;
    
    document.getElementById("viewTitle").textContent = event.extendedProps.originalTitle || removeEmojiFromTitle(event.title);
    document.getElementById("viewBadge").textContent = `${config.emoji} ${config.label}`;
    document.getElementById("viewBadge").style.backgroundColor = config.color;
    document.getElementById("viewCategoryName").textContent = config.label;
    document.getElementById("viewDescription").textContent = event.extendedProps.description || "Geen omschrijving.";
    
    if (event.start) {
        document.getElementById("viewDate").textContent = event.start.toLocaleDateString("nl-NL", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById("viewTime").textContent = event.allDay ? "Hele dag" : event.start.toLocaleTimeString("nl-NL", { hour: '2-digit', minute: '2-digit' });
    }

    openModal("eventViewModal");
}

function closeViewModal() {
    closeModal("eventViewModal");
}

function resetForm() {
    editingEventId = null;
    document.getElementById("eventTitle").value = "";
    document.getElementById("eventDescription").value = "";
    document.getElementById("eventDate").value = "";
    document.getElementById("eventTime").value = "";
    document.getElementById("eventType").value = "activity";
    document.getElementById("allDay").checked = true;
    updateTimeInputState();
}

function updateTimeInputState() {
    const allDayChecked = document.getElementById("allDay").checked;
    const timeInput = document.getElementById("eventTime");
    if (timeInput) {
        timeInput.disabled = allDayChecked;
        if (allDayChecked) timeInput.value = "";
    }
}

function disableSaveButton(disable) {
    const btn = document.getElementById("saveEventButton");
    if (btn) btn.disabled = disable;
}

function showMessage(text, type = "info") {
    alert(text); // Basis fallback voor meldingen
}

function formatDateForInput(date) {
    return date.toISOString().split("T")[0];
}

function formatTimeForInput(date) {
    return date.toTimeString().substring(0, 5);
}

function parseFirestoreDate(dateStr) {
    return new Date(dateStr);
}

function removeEmojiFromTitle(title) {
    return title.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]\s*/u, '');
}
