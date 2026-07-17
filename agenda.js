// =====================================================
// SNEJIN AGENDA
// agenda.js - basis versie
// =====================================================


import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


// ELEMENTEN

const calendarElement = document.getElementById("calendar");
const themeButton = document.getElementById("themeButton");
const logoutButton = document.getElementById("logoutButton");


// =====================================================
// LOGIN CONTROLE
// =====================================================

onAuthStateChanged(auth, (user)=>{

    if(!user){

        window.location.href = "index.html";

    }

});


// =====================================================
// UITLOGGEN
// =====================================================

if(logoutButton){

    logoutButton.addEventListener("click", async ()=>{

        try{

            await signOut(auth);

            window.location.href="index.html";

        }
        catch(error){

            console.error(
                "Uitloggen mislukt:",
                error
            );

        }

    });

}


// =====================================================
// DONKER / LICHT MODUS
// =====================================================


function updateThemeIcon(){


    if(
        document.body.classList.contains("dark")
    ){

        // Donkere modus actief
        // knop wordt zon

        themeButton.textContent="☀️";


    }
    else{

        // Lichte modus actief
        // knop wordt maan

        themeButton.textContent="🌙";

    }


}



const savedTheme =
localStorage.getItem("theme");


if(savedTheme==="dark"){

    document.body.classList.add("dark");

}


if(themeButton){

    updateThemeIcon();


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

            }
            else{

                localStorage.setItem(
                    "theme",
                    "light"
                );

            }


            updateThemeIcon();


        }
    );

}



// =====================================================
// FULLCALENDAR STARTEN
// =====================================================


if(calendarElement){


    const calendar =
    new FullCalendar.Calendar(
        calendarElement,
        {

            initialView:
            "dayGridMonth",


            locale:
            "nl",


            firstDay:
            1,


            height:
            "auto",


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


        }
    );


    calendar.render();


}
else{


    console.error(
        "Kalender element #calendar bestaat niet."
    );


}
