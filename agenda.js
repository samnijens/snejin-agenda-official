let db = null;
let auth = null;
let firestoreFns = null;
let authFns = null;
let firebaseReady = false;

let calendar = null;
let selectedEventId = null;
let currentViewEvent = null;
let editingEventId = null;
let activeCategoryFilter = "all";
let firestoreAvailable = false;
let miniCalDate = new Date();

let appointmentsRef = null;
let completedAppointmentsRef = null;
let categoriesRef = null;

const DEFAULT_CATEGORIES = {
    work: { id: "work", label: "Werken", color: "#0B57D0", emoji: "🔵", isDefault: true },
    holiday: { id: "holiday", label: "Vakantie", color: "#0F9D58", emoji: "🟢", isDefault: true },
    activity: { id: "activity", label: "Activiteit", color: "#1A73E8", emoji: "🟦", isDefault: true },
    birthday: { id: "birthday", label: "Verjaardag", color: "#E37400", emoji: "🎂", isDefault: true },
    holidayofficial: { id: "holidayofficial", label: "Feestdag", color: "#9334E6", emoji: "🟣", isDefault: true }
};

let categoryConfig = { ...DEFAULT_CATEGORIES };

document.addEventListener("DOMContentLoaded", async () => {
    setupTheme();
    setupButtons();
    setupModals();
    setupSearch();
    setupBackupAndTools();

    loadCategoriesLocalFirst();
    renderCategoryUI();
    renderMiniCalendar();
    createCalendar();
    loadAppointmentsLocalFirst();
    updateStats();
    syncHeaderTitle();

    await initFirebaseSafely();
});

async function initFirebaseSafely() {
    try {
        const fbModule = await import("./firebase.js");
        const fsModule = await import("https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js");
        const authModule = await import("https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js");

        db = fbModule.db;
        auth = fbModule.auth;
        firestoreFns = fsModule;
        authFns = authModule;

        if (!db || !auth) {
            return;
        }

        appointmentsRef = firestoreFns.collection(db, "appointments");
        completedAppointmentsRef = firestoreFns.collection(db, "completedAppointments");
        categoriesRef = firestoreFns.collection(db, "categories");
        firebaseReady = true;

        authFns.onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // Alleen doorsturen naar index.html als de gebruiker niet al op index.html zit
                if (!window.location.pathname.endsWith("index.html")) {
                    // Laat de agenda direct werken met lokale opslag als er nog niet is ingelogd via Firebase
                    firestoreAvailable = false;
                }
                return;
            }

            firestoreAvailable = true;
            await loadCategoriesFromFirestore();
            await loadAppointmentsFromFirestore();
            updateStats();
            syncHeaderTitle();
        });
    } catch (err) {
        console.warn("Firebase niet actief of lokaal gestart; lokale opslag is actief:", err);
        firestoreAvailable = false;
    }
}

function syncHeaderTitle() {
    if (!calendar) return;
    const titleEl = document.getElementById("gcalCurrentTitle");
    if (titleEl && calendar.view) {
        titleEl.textContent = calendar.view.title;
    }
    const activeView = calendar.view?.type;
    document.querySelectorAll(".gcal-view-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.view === activeView);
    });
}

function renderMiniCalendar() {
    const labelEl = document.getElementById("miniCalMonthLabel");
    const gridEl = document.getElementById("miniCalGrid");
    if (!labelEl || !gridEl) return;

    const year = miniCalDate.getFullYear();
    const month = miniCalDate.getMonth();

    const monthFormatter = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" });
    const formatted = monthFormatter.format(new Date(year, month, 1));
    labelEl.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);

    const firstDayOfMonth = new Date(year, month, 1);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    gridEl.innerHTML = "";

    for (let i = startOffset - 1; i >= 0; i--) {
        const dayNum = prevMonthDays - i;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "gcal-mini-day muted";
        btn.textContent = String(dayNum);
        const target = new Date(year, month - 1, dayNum);
        btn.addEventListener("click", () => {
            calendar?.gotoDate(target);
            syncHeaderTitle();
        });
        gridEl.appendChild(btn);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const current = new Date(year, month, d);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "gcal-mini-day" + (isSameDay(current, today) ? " today" : "");
        btn.textContent = String(d);
        btn.addEventListener("click", () => {
            calendar?.gotoDate(current);
            syncHeaderTitle();
        });
        gridEl.appendChild(btn);
    }

    const totalCells = gridEl.children.length;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let n = 1; n <= remaining; n++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "gcal-mini-day muted";
        btn.textContent = String(n);
        const target = new Date(year, month + 1, n);
        btn.addEventListener("click", () => {
            calendar?.gotoDate(target);
            syncHeaderTitle();
        });
        gridEl.appendChild(btn);
    }
}

function loadCategoriesLocalFirst() {
    categoryConfig = { ...DEFAULT_CATEGORIES };
    try {
        const localCats = JSON.parse(localStorage.getItem("snejin_categories") || "{}");
        Object.assign(categoryConfig, localCats);
    } catch (e) {
        console.warn("Kon lokale categorieën niet lezen:", e);
    }
}

async function loadCategoriesFromFirestore() {
    if (!firestoreAvailable || !categoriesRef || !firestoreFns) return;
    try {
        const snapshot = await firestoreFns.getDocs(categoriesRef);
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            categoryConfig[docSnap.id] = {
                id: docSnap.id,
                label: data.label || "Categorie",
                color: data.color || "#0B57D0",
                emoji: data.emoji || "🟦",
                isDefault: Boolean(data.isDefault)
            };
        });
        renderCategoryUI();
    } catch (error) {
        console.warn("Categorieën laden uit Firestore mislukt:", error);
    }
}

function saveCategoriesLocal() {
    const customOnly = {};
    Object.entries(categoryConfig).forEach(([key, val]) => {
        if (!DEFAULT_CATEGORIES[key]) {
            customOnly[key] = val;
        }
    });
    localStorage.setItem("snejin_categories", JSON.stringify(customOnly));
}

function renderCategoryUI() {
    const selectEl = document.getElementById("eventType");
    const listEl = document.getElementById("categoryList");

    if (selectEl) {
        const previousVal = selectEl.value;
        selectEl.innerHTML = "";
        Object.values(categoryConfig).forEach((cat) => {
            const opt = document.createElement("option");
            opt.value = cat.id;
            opt.textContent = `${cat.emoji} ${cat.label}`;
            selectEl.appendChild(opt);
        });
        if (previousVal && categoryConfig[previousVal]) {
            selectEl.value = previousVal;
        } else if (categoryConfig.activity) {
            selectEl.value = "activity";
        }
    }

    if (listEl) {
        listEl.innerHTML = "";
        Object.values(categoryConfig).forEach((cat) => {
            const li = document.createElement("li");
            li.className = "gcal-cat-item" + (activeCategoryFilter === cat.id ? " active" : "");

            const filterBtn = document.createElement("button");
            filterBtn.type = "button";
            filterBtn.className = "gcal-cat-filter-btn";
            filterBtn.innerHTML = `
                <span class="gcal-cat-square" style="background:${cat.color}"></span>
                <span>${escapeHtml(cat.label)}</span>
            `;
            filterBtn.addEventListener("click", () => {
                activeCategoryFilter = activeCategoryFilter === cat.id ? "all" : cat.id;
                applyFilters();
                renderCategoryUI();
            });

            li.appendChild(filterBtn);

            if (!cat.isDefault) {
                const delBtn = document.createElement("button");
                delBtn.type = "button";
                delBtn.className = "gcal-cat-del-btn";
                delBtn.title = `Verwijder categorie '${cat.label}'`;
                delBtn.setAttribute("aria-label", `Verwijder categorie ${cat.label}`);
                delBtn.textContent = "×";
                delBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    deleteCategory(cat.id);
                });
                li.appendChild(delBtn);
            }

            listEl.appendChild(li);
        });
    }
}

async function createCategory() {
    const nameInput = document.getElementById("newCategoryName");
    const emojiInput = document.getElementById("newCategoryEmoji");
    const colorInput = document.getElementById("newCategoryColor");

    const label = (nameInput?.value || "").trim();
    const emoji = emojiInput?.value || "🟦";
    const color = colorInput?.value || "#0B57D0";

    if (!label) {
        showMessage("Vul een naam in voor de categorie.", "error");
        nameInput?.focus();
        return;
    }

    const slugId = "cat_" + label.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + Date.now().toString().slice(-4);
    const newCat = { id: slugId, label, emoji, color, isDefault: false };

    categoryConfig[slugId] = newCat;
    saveCategoriesLocal();

    if (firestoreAvailable && db && firestoreFns) {
        try {
            await firestoreFns.setDoc(firestoreFns.doc(db, "categories", slugId), newCat);
        } catch (error) {
            console.warn("Categorie opslaan in Firestore mislukt:", error);
        }
    }

    renderCategoryUI();
    closeModal("categoryModal");
    if (nameInput) nameInput.value = "";
    showMessage(`Categorie '${label}' toegevoegd.`, "success");
}

async function deleteCategory(catId) {
    const cat = categoryConfig[catId];
    if (!cat) return;

    if (cat.isDefault) {
        showMessage("Standaard categorieën kunnen niet worden verwijderd.", "error");
        return;
    }

    if (!confirm(`Weet je zeker dat je de categorie '${cat.label}' wilt verwijderen?`)) return;

    delete categoryConfig[catId];
    saveCategoriesLocal();

    if (firestoreAvailable && db && firestoreFns) {
        try {
            await firestoreFns.deleteDoc(firestoreFns.doc(db, "categories", catId));
        } catch (error) {
            console.warn("Categorie verwijderen uit Firestore mislukt:", error);
        }
    }

    if (calendar) {
        calendar.getEvents().forEach((ev) => {
            if (ev.extendedProps.category === catId) {
                const fallback = categoryConfig.activity || { label: "Activiteit", color: "#1A73E8", emoji: "🟦" };
                const cleanTitle = ev.extendedProps.originalTitle || removeEmojiFromTitle(ev.title);
                ev.setExtendedProp("category", "activity");
                ev.setProp("title", cleanTitle);
                ev.setProp("backgroundColor", fallback.color);
                ev.setProp("borderColor", fallback.color);
            }
        });
    }

    if (activeCategoryFilter === catId) {
        activeCategoryFilter = "all";
    }

    renderCategoryUI();
    applyFilters();
    updateStats();
    showMessage(`Categorie '${cat.label}' verwijderd.`, "success");
}

function createCalendar() {
    const calendarEl = document.getElementById("calendar");
    if (!calendarEl) return;

    if (typeof FullCalendar === "undefined" || !FullCalendar.Calendar) {
        calendarEl.innerHTML = "<p style='padding:16px;'>Kalenderbibliotheek kon niet laden. Controleer de internetverbinding.</p>";
        return;
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "nl",
        firstDay: 1,
        height: "auto",
        contentHeight: "auto",
        selectable: true,
        editable: true,
        dayMaxEvents: 4,
        navLinks: true,
        nowIndicator: true,
        headerToolbar: false,
        datesSet() {
            syncHeaderTitle();
            if (calendar?.getDate) {
                const currentCalDate = calendar.getDate();
                miniCalDate = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), 1);
                renderMiniCalendar();
            }
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
        async eventDrop(info) {
            const ev = info.event;
            const newStart = ev.allDay
                ? formatDateForInput(ev.start)
                : `${formatDateForInput(ev.start)}T${formatTimeForInput(ev.start)}:00`;

            saveLocalAppointment(ev.id, {
                title: ev.extendedProps.originalTitle || removeEmojiFromTitle(ev.title),
                description: ev.extendedProps.description || "",
                start: newStart,
                allDay: ev.allDay,
                category: ev.extendedProps.category || "activity"
            });

            if (firestoreAvailable && db && firestoreFns && !ev.id.startsWith("local_")) {
                try {
                    await firestoreFns.updateDoc(firestoreFns.doc(db, "appointments", ev.id), {
                        start: newStart,
                        allDay: ev.allDay
                    });
                } catch (err) {
                    console.warn("Versleepte datum bijwerken in Firestore mislukt:", err);
                }
            }
            updateStats();
            showMessage("Afspraak verplaatst.", "success");
        },
        eventDidMount(info) {
            const catId = info.event.extendedProps.category;
            const config = categoryConfig[catId] || categoryConfig.activity;
            info.el.title = info.event.title;
            info.el.style.cursor = "pointer";
            info.el.style.borderRadius = "6px";
            info.el.style.border = "none";
            if (config) {
                info.el.style.backgroundColor = config.color;
                info.el.style.color = "#ffffff";
            }
        }
    });

    calendar.render();
    syncHeaderTitle();
}

function getLocalAppointments() {
    try {
        return JSON.parse(localStorage.getItem("snejin_appointments") || "{}");
    } catch {
        return {};
    }
}

function saveLocalAppointment(id, data) {
    const all = getLocalAppointments();
    all[id] = data;
    localStorage.setItem("snejin_appointments", JSON.stringify(all));
}

function removeLocalAppointment(id) {
    const all = getLocalAppointments();
    delete all[id];
    localStorage.setItem("snejin_appointments", JSON.stringify(all));
}

function addEventToCalendarObject(id, data) {
    if (!calendar) return;
    const category = categoryConfig[data.category] ? data.category : "activity";
    const config = categoryConfig[category] || { label: "Activiteit", color: "#1A73E8", emoji: "🟦" };
    const title = data.title || "Afspraak";

    calendar.addEvent({
        id,
        title,
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
}

function loadAppointmentsLocalFirst() {
    if (!calendar) return;
    calendar.removeAllEvents();
    const localData = getLocalAppointments();
    Object.entries(localData).forEach(([id, data]) => {
        if (data && data.start) {
            addEventToCalendarObject(id, data);
        }
    });
    applyFilters();
    updateStats();
}

async function loadAppointmentsFromFirestore() {
    if (!calendar || !firestoreAvailable || !appointmentsRef || !firestoreFns) return;
    try {
        const snapshot = await firestoreFns.getDocs(appointmentsRef);
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && data.start) {
                saveLocalAppointment(docSnap.id, data);
            }
        });
        loadAppointmentsLocalFirst();
    } catch (error) {
        console.warn("Firestore afspraken laden mislukt:", error);
    }
}

function buildOccurrenceDates(baseDateStr, timeStr, allDay, repeatMode) {
    const dates = [];
    const baseDate = new Date(`${baseDateStr}T12:00:00`);
    const count = repeatMode === "weekly" ? 4 : repeatMode === "monthly" ? 3 : 1;

    for (let i = 0; i < count; i++) {
        const d = new Date(baseDate);
        if (repeatMode === "weekly") {
            d.setDate(baseDate.getDate() + i * 7);
        } else if (repeatMode === "monthly") {
            d.setMonth(baseDate.getMonth() + i);
        }
        const datePart = formatDateForInput(d);
        dates.push(allDay ? datePart : `${datePart}T${timeStr}:00`);
    }
    return dates;
}

async function saveEvent() {
    const title = (document.getElementById("eventTitle")?.value || "").trim();
    const description = (document.getElementById("eventDescription")?.value || "").trim();
    const date = document.getElementById("eventDate")?.value || "";
    const time = document.getElementById("eventTime")?.value || "";
    const category = document.getElementById("eventType")?.value || "activity";
    const repeatMode = document.getElementById("eventRepeat")?.value || "none";
    const allDay = Boolean(document.getElementById("allDay")?.checked);

    if (!title) {
        showMessage("Voeg een titel toe voor de afspraak.", "error");
        document.getElementById("eventTitle")?.focus();
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
            const payload = { title, description, start, allDay, category };
            saveLocalAppointment(editingEventId, payload);

            if (firestoreAvailable && db && firestoreFns && !editingEventId.startsWith("local_")) {
                try {
                    await firestoreFns.updateDoc(firestoreFns.doc(db, "appointments", editingEventId), payload);
                } catch (err) {
                    console.warn("Update in Firestore mislukt, lokaal bijgewerkt:", err);
                }
            }

            const event = calendar?.getEventById(editingEventId);
            if (event) {
                const config = categoryConfig[category] || categoryConfig.activity;
                event.setProp("title", title);
                event.setProp("backgroundColor", config.color);
                event.setProp("borderColor", config.color);
                event.setStart(start);
                event.setAllDay(allDay);
                event.setExtendedProp("originalTitle", title);
                event.setExtendedProp("description", description);
                event.setExtendedProp("category", category);
            }
            showMessage("Afspraak bijgewerkt.", "success");
        } else {
            const occurrences = buildOccurrenceDates(date, time, allDay, repeatMode);

            for (const occStart of occurrences) {
                const payload = {
                    title,
                    description,
                    start: occStart,
                    allDay,
                    category,
                    createdAt: new Date().toISOString()
                };

                let createdId = "local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
                if (firestoreAvailable && appointmentsRef && firestoreFns) {
                    try {
                        const newDoc = await firestoreFns.addDoc(appointmentsRef, payload);
                        createdId = newDoc.id;
                    } catch (err) {
                        console.warn("Firestore addDoc mislukt, lokaal opgeslagen:", err);
                    }
                }

                saveLocalAppointment(createdId, payload);
                addEventToCalendarObject(createdId, payload);
            }

            showMessage(
                occurrences.length > 1
                    ? `${occurrences.length} herhalende afspraken opgeslagen.`
                    : "Afspraak opgeslagen.",
                "success"
            );
        }

        closeFormModal();
        resetForm();
        applyFilters();
        updateStats();
    } catch (error) {
        console.error("Opslaan mislukt:", error);
        showMessage("Opslaan mislukt.", "error");
    } finally {
        disableSaveButton(false);
    }
}

function editCurrentEvent() {
    if (!currentViewEvent) return;
    const event = currentViewEvent;
    editingEventId = event.id;

    document.getElementById("formTitle").textContent = "Afspraak wijzigen";
    document.getElementById("eventTitle").value = event.extendedProps.originalTitle || removeEmojiFromTitle(event.title);
    document.getElementById("eventDescription").value = event.extendedProps.description || "";
    document.getElementById("eventType").value = categoryConfig[event.extendedProps.category]
        ? event.extendedProps.category
        : "activity";
    if (document.getElementById("eventRepeat")) {
        document.getElementById("eventRepeat").value = "none";
    }
    document.getElementById("allDay").checked = event.allDay;

    if (event.start) {
        document.getElementById("eventDate").value = formatDateForInput(event.start);
        document.getElementById("eventTime").value = event.allDay ? "" : formatTimeForInput(event.start);
    }

    updateTimeInputState();
    closeViewModal();
    openModal("eventModal");

    setTimeout(() => {
        document.getElementById("eventTitle")?.focus();
    }, 50);
}

async function markEventAsDone() {
    if (!currentViewEvent) return;
    const event = currentViewEvent;

    try {
        const donePayload = {
            title: event.extendedProps.originalTitle || removeEmojiFromTitle(event.title),
            description: event.extendedProps.description || "",
            start: event.startStr,
            allDay: event.allDay,
            category: event.extendedProps.category || "activity",
            completedAt: new Date().toISOString(),
            originalId: event.id
        };

        if (firestoreAvailable && completedAppointmentsRef && db && firestoreFns) {
            try {
                await firestoreFns.addDoc(completedAppointmentsRef, donePayload);
                if (!event.id.startsWith("local_")) {
                    await firestoreFns.deleteDoc(firestoreFns.doc(db, "appointments", event.id));
                }
            } catch (err) {
                console.warn("Kon voltooide afspraak niet naar Firestore verplaatsen:", err);
            }
        }

        removeLocalAppointment(event.id);
        event.remove();

        currentViewEvent = null;
        selectedEventId = null;
        closeViewModal();
        updateStats();
        showMessage("Afspraak gemarkeerd als gereed.", "success");
    } catch (error) {
        console.error("Afronden mislukt:", error);
        showMessage("De afspraak kon niet als gereed worden gemarkeerd.", "error");
    }
}

async function deleteCurrentEvent() {
    const id = currentViewEvent?.id || selectedEventId;
    if (!id) return;

    if (!confirm("Weet je zeker dat je deze afspraak wilt verwijderen?")) return;

    try {
        if (firestoreAvailable && db && firestoreFns && !id.startsWith("local_")) {
            try {
                await firestoreFns.deleteDoc(firestoreFns.doc(db, "appointments", id));
            } catch (err) {
                console.warn("Kon afspraak niet uit Firestore verwijderen:", err);
            }
        }

        removeLocalAppointment(id);
        const event = calendar?.getEventById(id);
        if (event) event.remove();

        currentViewEvent = null;
        selectedEventId = null;
        closeViewModal();
        closeFormModal();
        updateStats();
        showMessage("Afspraak verwijderd.", "success");
    } catch (error) {
        console.error("Verwijderen mislukt:", error);
        showMessage("Verwijderen mislukt.", "error");
    }
}

function setupButtons() {
    document.getElementById("addEventButton")?.addEventListener("click", () => openFormModal());

    document.getElementById("gcalTodayBtn")?.addEventListener("click", () => {
        calendar?.today();
        syncHeaderTitle();
        showMessage("Terug naar vandaag.", "info");
    });

    document.getElementById("gcalPrevBtn")?.addEventListener("click", () => {
        calendar?.prev();
        syncHeaderTitle();
    });

    document.getElementById("gcalNextBtn")?.addEventListener("click", () => {
        calendar?.next();
        syncHeaderTitle();
    });

    document.querySelectorAll(".gcal-view-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const viewName = btn.dataset.view;
            if (viewName && calendar) {
                calendar.changeView(viewName);
                syncHeaderTitle();
            }
        });
    });

    document.getElementById("toggleSidebarBtn")?.addEventListener("click", () => {
        document.getElementById("gcalSidebar")?.classList.toggle("collapsed");
    });

    document.getElementById("miniPrevMonth")?.addEventListener("click", () => {
        miniCalDate = new Date(miniCalDate.getFullYear(), miniCalDate.getMonth() - 1, 1);
        renderMiniCalendar();
    });

    document.getElementById("miniNextMonth")?.addEventListener("click", () => {
        miniCalDate = new Date(miniCalDate.getFullYear(), miniCalDate.getMonth() + 1, 1);
        renderMiniCalendar();
    });

    document.getElementById("openCategoryModalBtn")?.addEventListener("click", () => {
        const input = document.getElementById("newCategoryName");
        if (input) input.value = "";
        openModal("categoryModal");
        setTimeout(() => input?.focus(), 50);
    });

    document.getElementById("logoutButton")?.addEventListener("click", async () => {
        if (firebaseReady && auth && authFns) {
            try {
                await authFns.signOut(auth);
            } catch (err) {
                console.warn("Uitloggen bij Firebase overgeslagen:", err);
            }
        }
        window.location.href = "index.html";
    });
}

function setupModals() {
    document.getElementById("saveEventButton")?.addEventListener("click", saveEvent);
    document.getElementById("cancelEventButton")?.addEventListener("click", closeFormModal);
    document.getElementById("closeFormX")?.addEventListener("click", closeFormModal);

    document.getElementById("saveCategoryButton")?.addEventListener("click", createCategory);
    document.getElementById("cancelCategoryButton")?.addEventListener("click", () => closeModal("categoryModal"));
    document.getElementById("closeCategoryX")?.addEventListener("click", () => closeModal("categoryModal"));

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
            else closeModal(modal.id);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeFormModal();
            closeViewModal();
            closeModal("categoryModal");
        }
    });
}

function applyFilters() {
    if (!calendar) return;
    const query = (document.getElementById("search")?.value || "").trim().toLowerCase();

    calendar.getEvents().forEach((event) => {
        const title = (event.extendedProps.originalTitle || event.title || "").toLowerCase();
        const description = (event.extendedProps.description || "").toLowerCase();
        const cat = event.extendedProps.category || "activity";

        const matchesSearch = !query || title.includes(query) || description.includes(query);
        const matchesCategory = activeCategoryFilter === "all" || cat === activeCategoryFilter;

        event.setProp("display", matchesSearch && matchesCategory ? "auto" : "none");
    });
}

function setupSearch() {
    const input = document.getElementById("search");
    if (!input) return;
    input.addEventListener("input", applyFilters);
}

function setupBackupAndTools() {
    document.getElementById("showAllCategoriesBtn")?.addEventListener("click", () => {
        activeCategoryFilter = "all";
        renderCategoryUI();
        applyFilters();
        showMessage("Alle categorieën zichtbaar.", "info");
    });

    document.getElementById("printAgendaBtn")?.addEventListener("click", () => {
        window.print();
    });

    document.getElementById("exportJsonButton")?.addEventListener("click", () => {
        const payload = {
            exportedAt: new Date().toISOString(),
            categories: categoryConfig,
            appointments: getLocalAppointments()
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `snejin-agenda-backup-${formatDateForInput(new Date())}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showMessage("Back-up gedownload.", "success");
    });

    document.getElementById("importJsonButton")?.addEventListener("click", () => {
        document.getElementById("importJsonInput")?.click();
    });

    document.getElementById("importJsonInput")?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            if (parsed.categories) {
                Object.entries(parsed.categories).forEach(([k, v]) => {
                    if (!DEFAULT_CATEGORIES[k]) categoryConfig[k] = v;
                });
                saveCategoriesLocal();
                renderCategoryUI();
            }
            if (parsed.appointments) {
                const existing = getLocalAppointments();
                Object.assign(existing, parsed.appointments);
                localStorage.setItem("snejin_appointments", JSON.stringify(existing));
            }
            loadAppointmentsLocalFirst();
            showMessage("Back-up succesvol geïmporteerd.", "success");
        } catch (err) {
            console.error("Import mislukt:", err);
            showMessage("Kon het JSON-bestand niet importeren.", "error");
        } finally {
            e.target.value = "";
        }
    });

    document.getElementById("exportIcsButton")?.addEventListener("click", () => {
        if (!calendar) return;
        const lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Snejin Agenda//NL"
        ];
        calendar.getEvents().forEach((ev, idx) => {
            const title = (ev.extendedProps.originalTitle || removeEmojiFromTitle(ev.title)).replace(/[,;]/g, " ");
            const desc = (ev.extendedProps.description || "").replace(/
/g, "\n").replace(/[,;]/g, " ");
            const startFormatted = ev.allDay
                ? formatDateForInput(ev.start).replace(/-/g, "")
                : ev.start.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

            lines.push("BEGIN:VEVENT");
            lines.push(`UID:${ev.id || idx}@snejin-agenda`);
            lines.push(`DTSTART:${startFormatted}`);
            lines.push(`SUMMARY:${title}`);
            if (desc) lines.push(`DESCRIPTION:${desc}`);
            lines.push("END:VEVENT");
        });
        lines.push("END:VCALENDAR");

        const blob = new Blob([lines.join("
")], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "snejin-agenda.ics";
        a.click();
        URL.revokeObjectURL(url);
        showMessage("Agenda geëxporteerd als .ICS.", "success");
    });
}

function updateStats() {
    if (!calendar) return;
    const events = calendar.getEvents();
    const totalEl = document.getElementById("statTotalEvents");
    const weekEl = document.getElementById("statUpcomingWeek");

    if (totalEl) totalEl.textContent = String(events.length);

    if (weekEl) {
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay() || 7;
        startOfWeek.setDate(startOfWeek.getDate() - day + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const countThisWeek = events.filter((ev) => ev.start && ev.start >= startOfWeek && ev.start < endOfWeek).length;
        weekEl.textContent = String(countThisWeek);
    }
}

function setupTheme() {
    const themeBtn = document.getElementById("themeButton");
    const isDark = localStorage.getItem("theme") === "dark";
    if (isDark) {
        document.body.classList.add("dark");
        document.body.classList.add("dark-mode");
        if (themeBtn) themeBtn.textContent = "☀️";
    }

    themeBtn?.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        document.body.classList.toggle("dark-mode");
        const darkModeActive = document.body.classList.contains("dark");
        localStorage.setItem("theme", darkModeActive ? "dark" : "light");
        if (themeBtn) themeBtn.textContent = darkModeActive ? "☀️" : "🌙";
    });
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove("open");
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
        document.getElementById("eventDate").value = formatDateForInput(new Date());
    }

    updateTimeInputState();
    openModal("eventModal");
    setTimeout(() => document.getElementById("eventTitle")?.focus(), 50);
}

function closeFormModal() {
    closeModal("eventModal");
    resetForm();
}

function openViewModal(event) {
    const catId = event.extendedProps.category;
    const config = categoryConfig[catId] || { label: "Activiteit", color: "#1A73E8", emoji: "🟦" };

    document.getElementById("viewTitle").textContent = event.extendedProps.originalTitle || removeEmojiFromTitle(event.title);
    const badgeEl = document.getElementById("viewBadge");
    if (badgeEl) {
        badgeEl.style.backgroundColor = config.color;
    }
    document.getElementById("viewCategoryName").textContent = config.label;
    document.getElementById("viewDescription").textContent = event.extendedProps.description || "Geen omschrijving beschikbaar.";

    if (event.start) {
        const dateStr = event.start.toLocaleDateString("nl-NL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
        document.getElementById("viewDate").textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        document.getElementById("viewTime").textContent = event.allDay
            ? "Hele dag"
            : event.start.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
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
    const typeSelect = document.getElementById("eventType");
    if (typeSelect) {
        typeSelect.value = categoryConfig.activity ? "activity" : (Object.keys(categoryConfig)[0] || "");
    }
    const repeatSelect = document.getElementById("eventRepeat");
    if (repeatSelect) repeatSelect.value = "none";
    document.getElementById("allDay").checked = true;
    updateTimeInputState();
}

function updateTimeInputState() {
    const allDayChecked = Boolean(document.getElementById("allDay")?.checked);
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
    let msgContainer = document.getElementById("toast-message");
    if (!msgContainer) {
        msgContainer = document.createElement("div");
        msgContainer.id = "toast-message";
        msgContainer.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 24px;
            padding: 12px 20px;
            border-radius: 12px;
            background: #1f1f1f;
            color: #ffffff;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 6px 20px rgba(0,0,0,0.22);
            z-index: 10000;
            transition: all 0.25s ease;
        `;
        document.body.appendChild(msgContainer);
    }
    msgContainer.style.background = type === "error" ? "#b3261e" : "#1f1f1f";
    msgContainer.textContent = text;
    msgContainer.style.display = "block";
    msgContainer.style.opacity = "1";
    clearTimeout(msgContainer._timer);
    msgContainer._timer = setTimeout(() => {
        msgContainer.style.opacity = "0";
        setTimeout(() => { msgContainer.style.display = "none"; }, 250);
    }, 3000);
}

function formatDateForInput(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function formatTimeForInput(date) {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}

function removeEmojiFromTitle(title) {
    return title.replace(/^[^\w\s]+\s*/u, "");
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
