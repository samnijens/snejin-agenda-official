// =====================================================
// SNEJIN AGENDA
// agenda.js
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
    doc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";



// =====================================================
// LOGIN CONTROLE
// =====================================================


onAuthStateChanged(auth, (user) => {


    if (!user) {

        window.location.href = "index.html";

    }


});




// =====================================================
// ELEMENTEN
// =====================================================


const calendarElement = document.getElementById("calendar");

const themeButton = document.getElementById("themeButton");

const logoutButton = document.getElementById("logoutButton");

const searchInput = document.getElementById("search");

const addEventButton = document.getElementById("addEventButton");





// =====================================================
// DONKER / LICHT MODUS
// =====================================================



function updateThemeButton(){


    if(document.body.classList.contains("dark")){


        // donkere modus actief
        // knop wordt zon


        themeButton.textContent = "☀️";


        themeButton.title =
        "Schakel naar lichte modus";


    } else {


        // lichte modus actief
        // knop wordt maan


        themeButton.textContent = "🌙";


        themeButton.title =
        "Schakel naar donkere modus";


    }


}




const savedTheme =
localStorage.getItem("theme");



if(savedTheme === "dark"){

    document.body.classList.add("dark");

}


updateThemeButton();





themeButton.addEventListener(
"click",
()=>{


    document.body.classList.toggle("dark");



    if(
        document.body.classList.contains("dark")
    ){


        localStorage.setItem(
            "theme",
            "dark"
        );


    }else{


        localStorage.setItem(
            "theme",
            "light"
        );


    }


    updateThemeButton();


});





// =====================================================
// UITLOGGEN
// =====================================================


logoutButton.addEventListener(
"click",
async ()=>{


    await signOut(auth);


    window.location.href =
    "index.html";


});




// =====================================================
// FULLCALENDAR
// =====================================================



let calendar;



document.addEventListener(
"DOMContentLoaded",
()=>{


calendar =
new FullCalendar.Calendar(
calendarElement,
{


    initialView:
    "dayGridMonth",


    locale:
    "nl",


    firstDay:
    1,


    selectable:true,


    editable:true,


    height:"auto",



    headerToolbar:{


        left:
        "prev,next today",


        center:
        "title",


        right:
        "dayGridMonth,timeGridWeek,timeGridDay,listYear"


    },


    buttonText:{


        today:
        "Vandaag",


        month:
        "Maand",


        week:
        "Week",


        day:
        "Dag",


        list:
        "Agenda"


    },



    events:[]



});



calendar.render();



});




// =====================================================
// ZOEKEN
// =====================================================


searchInput.addEventListener(
"input",
()=>{


    const value =
    searchInput.value.toLowerCase();



    document
    .querySelectorAll(".fc-event")
    .forEach(event=>{


        if(
            event.textContent
            .toLowerCase()
            .includes(value)
        ){


            event.style.display =
            "";


        }else{


            event.style.display =
            "none";


        }


    });



});





// =====================================================
// NIEUWE AFSPRAAK KNOP
// =====================================================



addEventButton.addEventListener(
"click",
()=>{


    alert(
    "Afspraak toevoegen komt in de volgende stap."
    );


});
