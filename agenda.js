import { auth, db } from "./firebase.js";


import {

onAuthStateChanged,

signOut

}

from

"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


import {

collection,

getDocs,

addDoc,

deleteDoc,

doc

}

from

"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";




onAuthStateChanged(auth,(user)=>{


if(!user){

window.location.href="index.html";

return;

}


startCalendar();


});





async function startCalendar(){


const calendarEl =
document.getElementById("calendar");



let events=[];



const snapshot =
await getDocs(
collection(db,"events")
);



snapshot.forEach((item)=>{


events.push({

id:item.id,

title:item.data().title,

start:item.data().start

});


});





const calendar =
new FullCalendar.Calendar(calendarEl,{


initialView:"dayGridMonth",


locale:"nl",


firstDay:1,


headerToolbar:{


left:"prev,next today",

center:"title",

right:
"dayGridMonth,timeGridWeek,timeGridDay,listWeek"


},


events:events,



dateClick:async(info)=>{


const title =
prompt("Nieuwe afspraak:");



if(title){


await addDoc(
collection(db,"events"),
{

title:title,

start:info.dateStr

}

);


location.reload();


}


},



eventClick:async(info)=>{


if(confirm("Afspraak verwijderen?")){


await deleteDoc(

doc(
db,
"events",
info.event.id

)

);


location.reload();


}


}



});


calendar.render();


}





document
.getElementById("logoutButton")
.onclick=()=>{


signOut(auth);


window.location.href="index.html";


};
