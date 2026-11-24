/* =========================================================
   SNEJIN AGENDA
   COMPLETE STYLE.CSS
   Login + Agenda + FullCalendar + Modals + Dark Mode
========================================================= */


/* =========================================================
   RESET
========================================================= */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html,
body {
    width: 100%;
    min-height: 100%;
    font-family: "Segoe UI", Arial, sans-serif;
}

button,
input,
textarea,
select {
    font: inherit;
}


/* =========================================================
   LOGIN PAGINA
========================================================= */

body.login-page {
    min-height: 100vh;
    overflow: hidden;

    background:
        linear-gradient(
            135deg,
            rgba(0, 120, 160, .48),
            rgba(255, 180, 80, .30)
        ),
        url("default_background.jpg");

    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}


/* Login overlay */

.login-overlay {
    width: 100%;
    min-height: 100vh;

    display: flex;
    justify-content: center;
    align-items: center;

    padding: 20px;
}


/* Login kaart */

.login-card {
    width: 100%;
    max-width: 450px;

    padding: 45px;

    border-radius: 40px;

    background: rgba(255, 255, 255, .84);

    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);

    border: 1px solid rgba(255, 255, 255, .65);

    box-shadow:
        0 35px 90px rgba(0, 0, 0, .42);

    text-align: center;

    animation:
        loginShow .8s ease both;
}


/* Login logo */

.login-card .logo {
    width: 170px;
    height: auto;

    margin-bottom: 20px;

    filter:
        drop-shadow(
            0 15px 20px rgba(0, 0, 0, .25)
        );
}


/* Login titel */

.login-card h1 {
    font-size: 40px;
    font-weight: 800;

    letter-spacing: -1px;

    color: #007f7f;

    margin-bottom: 8px;
}


/* Login subtitel */

.subtitle {
    font-size: 16px;
    color: #555;

    margin-bottom: 35px;
}


/* Login formulier */

.form-group {
    margin-bottom: 22px;
    text-align: left;
}

.form-group label {
    display: block;

    font-size: 14px;
    font-weight: 700;

    color: #333;

    margin-bottom: 8px;
}

.form-group input {
    width: 100%;
    height: 58px;

    padding: 0 20px;

    border: none;
    border-radius: 20px;

    background: rgba(255, 255, 255, .96);

    color: #222;

    font-size: 16px;

    box-shadow:
        0 8px 20px rgba(0, 0, 0, .08);

    transition:
        transform .2s ease,
        box-shadow .2s ease;
}

.form-group input:focus {
    outline: none;

    transform: translateY(-1px);

    box-shadow:
        0 0 0 4px rgba(0, 168, 150, .25),
        0 10px 25px rgba(0, 0, 0, .10);
}


/* Login knop */

#loginButton {
    width: 100%;
    height: 58px;

    margin-top: 15px;

    border: none;
    border-radius: 20px;

    background:
        linear-gradient(
            135deg,
            #00c9a7,
            #008f87
        );

    color: white;

    font-size: 18px;
    font-weight: 800;

    cursor: pointer;

    box-shadow:
        0 15px 30px rgba(0, 140, 130, .35);

    transition:
        transform .25s ease,
        box-shadow .25s ease;
}

#loginButton:hover {
    transform: translateY(-4px);

    box-shadow:
        0 20px 38px rgba(0, 140, 130, .42);
}

#loginButton:active {
    transform: translateY(-1px);
}


/* Login melding */

.message {
    min-height: 25px;

    margin-top: 20px;

    color: #d62828;

    font-weight: 700;
}


/* Login animatie */

@keyframes loginShow {
    from {
        opacity: 0;
        transform:
            translateY(40px)
            scale(.92);
    }

    to {
        opacity: 1;
        transform:
            translateY(0)
            scale(1);
    }
}


/* =========================================================
   AGENDA PAGINA
========================================================= */

body.agenda-page {
    min-height: 100vh;

    color: #1f2937;

    background:
        linear-gradient(
            135deg,
            rgba(0, 150, 170, .18),
            rgba(255, 220, 120, .16)
        ),
        url("main_background.jpg");

    background-size: cover;
    background-position: center;
    background-attachment: fixed;

    animation:
        pageAppear .7s ease both;
}


/* =========================================================
   HEADER
========================================================= */

.topbar {
    position: relative;
    z-index: 20;

    margin: 20px;
    padding: 16px 22px;

    display: flex;
    justify-content: space-between;
    align-items: center;

    gap: 20px;

    background:
        rgba(255, 255, 255, .86);

    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);

    border:
        1px solid rgba(255, 255, 255, .65);

    border-radius: 26px;

    box-shadow:
        0 20px 55px rgba(0, 0, 0, .18);

    animation:
        slideDown .7s ease both;
}


/* Logo */

.logo-area {
    display: flex;
    align-items: center;

    gap: 14px;

    min-width: 0;
}

.logo-small {
    width: 65px;
    height: auto;

    flex-shrink: 0;

    filter:
        drop-shadow(
            0 8px 12px rgba(0, 0, 0, .16)
        );

    animation:
        floatingLogo 4s ease-in-out infinite;
}

.logo-area h1 {
    color: #008b8b;

    font-size: 25px;
    line-height: 1.1;

    font-weight: 800;
}

.logo-area span {
    display: block;

    margin-top: 4px;

    color: #666;

    font-size: 14px;
}


/* =========================================================
   HEADER KNOPPEN
========================================================= */

.top-buttons {
    display: flex;
    align-items: center;

    gap: 9px;
}

.top-buttons input {
    width: 240px;
    height: 45px;

    padding: 0 16px;

    border: 1px solid rgba(0, 0, 0, .07);
    border-radius: 15px;

    outline: none;

    background:
        rgba(255, 255, 255, .9);

    color: #222;

    box-shadow:
        0 5px 15px rgba(0, 0, 0, .06);

    transition:
        width .25s ease,
        box-shadow .2s ease,
        border-color .2s ease;
}

.top-buttons input:focus {
    border-color: #00a896;

    box-shadow:
        0 0 0 4px rgba(0, 168, 150, .12);
}

.top-buttons button {
    height: 45px;

    padding: 0 16px;

    border: none;
    border-radius: 15px;

    background:
        linear-gradient(
            135deg,
            #00bfa5,
            #008f87
        );

    color: white;

    cursor: pointer;

    font-weight: 700;

    box-shadow:
        0 8px 18px rgba(0, 140, 130, .18);

    transition:
        transform .22s ease,
        box-shadow .22s ease,
        filter .22s ease;
}

.top-buttons button:hover {
    transform:
        translateY(-3px);

    box-shadow:
        0 13px 25px rgba(0, 0, 0, .18);

    filter: brightness(1.05);
}

.top-buttons button:active {
    transform:
        translateY(0)
        scale(.97);
}


/* =========================================================
   HOOFDGEDEELTE
========================================================= */

main {
    width: 100%;

    padding:
        0 20px 30px;

    position: relative;
    z-index: 1;
}


/* =========================================================
   KALENDER KAART
========================================================= */

.calendar-card {
    width: 100%;
    max-width: 1500px;

    min-height: 650px;

    margin: 0 auto;

    padding: 22px;

    background:
        rgba(255, 255, 255, .91);

    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);

    border:
        1px solid rgba(255, 255, 255, .7);

    border-radius: 30px;

    box-shadow:
        0 25px 70px rgba(0, 0, 0, .22);

    animation:
        calendarAppear .9s ease both;
}


/* =========================================================
   FULLCALENDAR
========================================================= */

#calendar {
    width: 100%;
    min-height: 600px;
}


/* FullCalendar hoofdcontainer */

.fc {
    width: 100%;

    min-height: 600px;

    padding: 12px;

    background:
        rgba(255, 255, 255, .96);

    border-radius: 22px;

    color: #202124;
}


/* Toolbar */

.fc .fc-toolbar {
    gap: 12px;

    margin-bottom: 20px;
}

.fc .fc-toolbar-title {
    color: #008b8b !important;

    font-size: 26px;

    font-weight: 800;
}


/* FullCalendar buttons */

.fc .fc-button {
    border: none !important;

    border-radius: 11px !important;

    padding: 8px 13px !important;

    background:
        linear-gradient(
            135deg,
            #00bfa5,
            #008f87
        ) !important;

    color: white !important;

    font-weight: 700 !important;

    box-shadow:
        0 5px 12px rgba(0, 140, 130, .16);

    transition:
        transform .2s ease,
        box-shadow .2s ease,
        filter .2s ease !important;
}

.fc .fc-button:hover {
    transform:
        translateY(-2px);

    filter: brightness(1.05);

    box-shadow:
        0 9px 18px rgba(0, 0, 0, .16);
}

.fc .fc-button:active,
.fc .fc-button:focus {
    box-shadow:
        none !important;
}


/* Vandaag knop */

.fc .fc-button-primary:not(:disabled).fc-button-active,
.fc .fc-button-primary:not(:disabled):active {
    background:
        #007f78 !important;
}


/* Weekdagen */

.fc .fc-col-header-cell {
    background:
        rgba(0, 168, 150, .06);

    border-color:
        rgba(0, 0, 0, .07);
}

.fc .fc-col-header-cell-cushion {
    padding: 10px 4px;

    color: #007f7f;

    font-size: 13px;

    font-weight: 800;

    text-decoration: none;
}


/* Kalender cellen */

.fc .fc-daygrid-day {
    background:
        rgba(255, 255, 255, .75);

    border-color:
        rgba(0, 0, 0, .07);

    transition:
        background .2s ease;
}

.fc .fc-daygrid-day:hover {
    background:
        rgba(0, 168, 150, .07);
}


/* Datumnummers */

.fc .fc-daygrid-day-number {
    padding: 8px;

    color: #444;

    font-weight: 700;

    text-decoration: none;
}


/* Vandaag */

.fc .fc-day-today {
    background:
        rgba(0, 168, 150, .10) !important;
}


/* Events */

.fc .fc-event {
    border: none !important;

    border-radius: 8px !important;

    padding: 3px 6px !important;

    cursor: pointer;

    box-shadow:
        0 3px 8px rgba(0, 0, 0, .13);

    transition:
        transform .18s ease,
        filter .18s ease,
        box-shadow .18s ease;
}

.fc .fc-event:hover {
    transform:
        translateY(-1px)
        scale(1.01);

    filter: brightness(1.04);

    box-shadow:
        0 5px 13px rgba(0, 0, 0, .18);
}

.fc .fc-event-title,
.fc .fc-event-time {
    font-weight: 700;
}


/* Meer events */

.fc .fc-more-link {
    color: #008f87;

    font-weight: 700;

    text-decoration: none;
}


/* Scrollbars */

.fc-scroller::-webkit-scrollbar,
.modal-content::-webkit-scrollbar {
    width: 7px;
}

.fc-scroller::-webkit-scrollbar-thumb,
.modal-content::-webkit-scrollbar-thumb {
    background:
        rgba(0, 168, 150, .35);

    border-radius: 20px;
}


/* =========================================================
   NIEUWE AFSPRAAK FLOATING BUTTON
========================================================= */

.floatingButton {
    position: fixed;

    right: 30px;
    bottom: 30px;

    z-index: 100;

    width: 66px;
    height: 66px;

    border: none;
    border-radius: 50%;

    background:
        linear-gradient(
            135deg,
            #00c9a7,
            #008f87
        );

    color: white;

    font-size: 35px;
    line-height: 1;

    cursor: pointer;

    box-shadow:
        0 15px 35px rgba(0, 120, 110, .35);

    transition:
        transform .25s ease,
        box-shadow .25s ease;
}

.floatingButton:hover {
    transform:
        translateY(-5px)
        scale(1.07);

    box-shadow:
        0 20px 42px rgba(0, 0, 0, .25);
}

.floatingButton:active {
    transform:
        scale(.94);
}


/* =========================================================
   MODALS
========================================================= */

.modal {
    display: none;

    position: fixed;
    inset: 0;

    z-index: 9999;

    justify-content: center;
    align-items: center;

    padding: 20px;

    background:
        rgba(0, 0, 0, .58);

    backdrop-filter: blur(9px);
    -webkit-backdrop-filter: blur(9px);

    opacity: 0;

    transition:
        opacity .25s ease;
}

.modal.open {
    display: flex;

    opacity: 1;
}


/* Modal inhoud */

.modal-content {
    position: relative;

    width: 100%;
    max-width: 500px;

    max-height: 90vh;

    overflow-y: auto;

    padding:
        32px 30px 26px;

    border-radius: 28px;

    background:
        rgba(255, 255, 255, .98);

    border:
        1px solid rgba(255, 255, 255, .7);

    box-shadow:
        0 35px 90px rgba(0, 0, 0, .45);

    transform:
        translateY(25px)
        scale(.94);

    transition:
        transform .3s cubic-bezier(.2, .9, .3, 1.15);
}

.modal.open .modal-content {
    transform:
        translateY(0)
        scale(1);
}


/* Sluitknop */

.modal-close {
    position: absolute;

    top: 14px;
    right: 16px;

    width: 38px;
    height: 38px;

    border: none;
    border-radius: 50%;

    background:
        rgba(0, 0, 0, .06);

    color: #555;

    font-size: 24px;

    cursor: pointer;

    transition:
        transform .2s ease,
        background .2s ease,
        color .2s ease;
}

.modal-close:hover {
    background:
        rgba(231, 76, 60, .15);

    color: #e74c3c;

    transform:
        rotate(90deg);
}


/* =========================================================
   FORM MODAL
========================================================= */

.form-content h2 {
    color: #008b8b;

    font-size: 27px;

    margin-bottom: 22px;

    padding-right: 35px;
}

.form-body .form-group {
    margin-bottom: 16px;

    text-align: left;
}

.form-body label {
    display: block;

    margin-bottom: 7px;

    color: #444;

    font-size: 13px;

    font-weight: 700;
}


/* Form inputs */

.form-body input[type="text"],
.form-body input[type="date"],
.form-body input[type="time"],
.form-body textarea,
.form-body select {
    width: 100%;

    border:
        2px solid rgba(0, 0, 0, .08);

    border-radius: 14px;

    padding:
        12px 14px;

    background:
        #fff;

    color: #222;

    font-size: 15px;

    font-family: inherit;

    transition:
        border-color .2s ease,
        box-shadow .2s ease,
        transform .2s ease;
}

.form-body textarea {
    min-height: 90px;

    resize: vertical;
}

.form-body input:focus,
.form-body textarea:focus,
.form-body select:focus {
    outline: none;

    border-color:
        #00a896;

    box-shadow:
        0 0 0 4px
        rgba(0, 168, 150, .13);
}


/* Datum/tijd */

.form-row {
    display: flex;

    gap: 12px;
}

.form-row .form-group {
    flex: 1;
}


/* Checkbox */

.checkbox-line {
    display: flex !important;

    align-items: center;

    gap: 9px;

    margin:
        5px 0 10px;

    color: #333 !important;

    font-weight: 600 !important;

    cursor: pointer;
}

.checkbox-line input {
    width: 17px !important;
    height: 17px;

    accent-color:
        #00a896;
}


/* =========================================================
   VIEW MODAL
========================================================= */

.view-badge {
    display: inline-block;

    padding:
        7px 14px;

    margin-bottom: 12px;

    border-radius: 999px;

    color: white;

    font-size: 13px;

    font-weight: 700;
}

.view-content h2 {
    color: #1d3557;

    font-size: 28px;

    line-height: 1.2;

    margin-bottom: 18px;

    padding-right: 35px;

    word-break: break-word;
}

.view-meta {
    display: flex;

    flex-direction: column;

    gap: 10px;

    margin-bottom: 18px;
}

.view-row {
    display: flex;

    align-items: center;

    gap: 10px;

    padding:
        11px 14px;

    border-radius: 13px;

    background:
        rgba(0, 168, 150, .08);

    color: #333;

    font-size: 15px;
}

.view-icon {
    font-size: 18px;
}

.view-desc {
    margin-bottom: 22px;

    padding:
        15px 16px;

    border-radius: 14px;

    background:
        rgba(0, 0, 0, .04);
}

.view-desc h3 {
    margin-bottom: 7px;

    color: #777;

    font-size: 12px;

    letter-spacing: .6px;

    text-transform: uppercase;
}

.view-desc p {
    color: #333;

    line-height: 1.55;

    white-space: pre-wrap;
}


/* =========================================================
   MODAL BUTTONS
========================================================= */

.modal-buttons {
    display: flex;

    flex-wrap: wrap;

    gap: 10px;

    margin-top: 8px;
}

.btn {
    flex:
        1 1 auto;

    min-width: 120px;

    padding:
        13px 16px;

    border: none;

    border-radius: 14px;

    color: white;

    font-size: 15px;

    font-weight: 700;

    cursor: pointer;

    transition:
        transform .2s ease,
        box-shadow .2s ease,
        filter .2s ease;
}

.btn:hover {
    transform:
        translateY(-2px);

    box-shadow:
        0 10px 22px rgba(0, 0, 0, .20);

    filter: brightness(1.05);
}

.btn:active {
    transform:
        translateY(0)
        scale(.98);
}

.btn-save {
    background:
        linear-gradient(
            135deg,
            #00c9a7,
            #008f87
        );
}

.btn-edit {
    background:
        linear-gradient(
            135deg,
            #4aa3ff,
            #2563eb
        );
}

.btn-delete {
    background:
        linear-gradient(
            135deg,
            #ff6b6b,
            #d62828
        );
}

.btn-done {
    background:
        linear-gradient(
            135deg,
            #2ecc71,
            #27ae60
        );
}

.btn-cancel {
    background:
        #e2e6ea;

    color:
        #444;
}

.btn-cancel:hover {
    background:
        #d3d8dd;

    filter: none;
}


/* =========================================================
   DARK MODE
========================================================= */

body.dark {
    color: #f1f5f9;

    background:
        linear-gradient(
            135deg,
            rgba(0, 35, 45, .82),
            rgba(25, 25, 25, .88)
        ),
        url("main_background.jpg");

    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}


/* Header */

body.dark .topbar {
    background:
        rgba(24, 28, 31, .90);

    border-color:
        rgba(255, 255, 255, .08);

    box-shadow:
        0 20px 55px rgba(0, 0, 0, .35);
}

body.dark .logo-area h1 {
    color: #00d4c0;
}

body.dark .logo-area span {
    color: #cbd5e1;
}


/* Search */

body.dark .top-buttons input {
    background:
        rgba(45, 50, 54, .95);

    border-color:
        rgba(255, 255, 255, .08);

    color: white;
}

body.dark .top-buttons input::placeholder {
    color: #aab4bd;
}


/* Calendar card */

body.dark .calendar-card {
    background:
        rgba(22, 25, 28, .93);

    border-color:
        rgba(255, 255, 255, .07);

    box-shadow:
        0 25px 70px rgba(0, 0, 0, .45);
}


/* FullCalendar */

body.dark .fc {
    background:
        #1d2125;

    color: #f1f5f9;
}

body.dark .fc-theme-standard td,
body.dark .fc-theme-standard th {
    border-color:
        rgba(255, 255, 255, .09);
}

body.dark .fc .fc-daygrid-day {
    background:
        #1d2125;
}

body.dark .fc .fc-daygrid-day:hover {
    background:
        rgba(0, 168, 150, .09);
}

body.dark .fc .fc-col-header-cell {
    background:
        rgba(0, 168, 150, .08);
}

body.dark .fc .fc-col-header-cell-cushion,
body.dark .fc .fc-daygrid-day-number {
    color: #f1f5f9;
}

body.dark .fc .fc-toolbar-title {
    color:
        #00d4c0 !important;
}

body.dark .fc .fc-day-today {
    background:
        rgba(0, 168, 150, .13) !important;
}


/* Modals */

body.dark .modal-content {
    background:
        rgba(28, 32, 35, .98);

    color: #f1f1f1;

    border-colo

/* =========================================================
   AGENDA LAYOUT, ZIJLBALK, CATEGORIEËN & TOOLS
========================================================= */

.agenda-layout {
    display: grid;
    grid-template-columns: 290px 1fr;
    gap: 20px;
    max-width: 1560px;
    margin: 0 auto;
    align-items: start;
}

.agenda-layout .calendar-card {
    max-width: none;
    margin: 0;
}

.sidebar-card {
    background: rgba(255, 255, 255, .91);
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
    border: 1px solid rgba(255, 255, 255, .7);
    border-radius: 26px;
    padding: 20px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, .16);
    display: flex;
    flex-direction: column;
    gap: 22px;
}

.sidebar-section h2 {
    font-size: 16px;
    font-weight: 800;
    color: #007f7f;
    margin-bottom: 6px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.section-header h2 {
    margin-bottom: 0;
}

.section-hint {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 10px;
}

.small-action-btn {
    border: none;
    border-radius: 10px;
    padding: 5px 10px;
    background: linear-gradient(135deg, #00c9a7, #008f87);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
}

.full-width {
    width: 100%;
}

.category-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.category-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    border-radius: 12px;
    padding: 4px 6px;
    background: rgba(0, 168, 150, .05);
    transition: background .2s ease;
}

.category-item.active {
    background: rgba(0, 168, 150, .18);
    outline: 2px solid #00a896;
}

.category-filter-btn {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: transparent;
    color: #1f2937;
    font-size: 13px;
    font-weight: 700;
    text-align: left;
    padding: 6px 4px;
    cursor: pointer;
}

.cat-dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    flex-shrink: 0;
}

.category-delete-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 6px;
    border-radius: 8px;
    transition: background .2s ease, transform .15s ease;
}

.category-delete-btn:hover {
    background: rgba(239, 68, 68, .16);
    transform: scale(1.1);
}

.stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 8px;
}

.stat-box {
    background: rgba(0, 168, 150, .09);
    border-radius: 14px;
    padding: 12px;
    text-align: center;
}

.stat-number {
    display: block;
    font-size: 22px;
    font-weight: 800;
    color: #008b8b;
}

.stat-label {
    font-size: 12px;
    color: #475569;
    font-weight: 600;
}

.tool-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
}

.tool-btn {
    width: 100%;
    border: 1px solid rgba(0, 0, 0, .08);
    border-radius: 12px;
    padding: 9px 12px;
    background: rgba(255, 255, 255, .92);
    color: #1f2937;
    font-size: 13px;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
    transition: transform .15s ease, background .2s ease;
}

.tool-btn:hover {
    background: rgba(0, 168, 150, .12);
    transform: translateX(2px);
}

input[type="color"] {
    width: 100%;
    height: 44px;
    border: 2px solid rgba(0, 0, 0, .08);
    border-radius: 12px;
    padding: 2px;
    background: #fff;
    cursor: pointer;
}

body.dark .sidebar-card,
body.dark-mode .sidebar-card {
    background: rgba(24, 28, 31, .92);
    border-color: rgba(255, 255, 255, .08);
    color: #f1f5f9;
}

body.dark .sidebar-section h2,
body.dark-mode .sidebar-section h2,
body.dark .stat-number,
body.dark-mode .stat-number {
    color: #00d4c0;
}

body.dark .category-item,
body.dark-mode .category-item {
    background: rgba(255, 255, 255, .05);
}

body.dark .category-filter-btn,
body.dark-mode .category-filter-btn,
body.dark .tool-btn,
body.dark-mode .tool-btn {
    color: #f1f5f9;
}

body.dark .tool-btn,
body.dark-mode .tool-btn {
    background: rgba(45, 50, 54, .9);
    border-color: rgba(255, 255, 255, .08);
}

body.dark .stat-label,
body.dark-mode .stat-label,
body.dark .section-hint,
body.dark-mode .section-hint {
    color: #94a3b8;
}

@media (max-width: 960px) {
    .agenda-layout {
        grid-template-columns: 1fr;
    }
    .top-buttons {
        flex-wrap: wrap;
    }
}

@media print {
    .topbar,
    .sidebar-card,
    .floatingButton,
    .modal {
        display: none !important;
    }
    .agenda-layout {
        grid-template-columns: 1fr;
    }
}
