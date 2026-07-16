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
addDoc

}
from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";



let calendar;

let selectedDate="";



const colors={

werk:"#ff0000",

vakantie:"#00aa00",

activiteit:"#006400",

verjaardag:"#ff9900",

feestdag:"#ffff00"

};





onAuthStateChanged(auth,(user)=>{


if(!user){

window.location.href="index.html";

return;

}


loadCalendar();


});





async function loadCalendar(){


let events=[];



const snapshot =
await getDocs(
collection(db,"events")
);



snapshot.forEach((doc)=>{


let data=doc.data();



events.push({

id:doc.id,

title:data.title,

start:data.start,

description:data.description,

backgroundColor:
colors[data.type],

allDay:data.allDay


});


});





calendar =
new FullCalendar.Calendar(

document.getElementById("calendar"),

{


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



dateClick(info){


selectedDate=info.dateStr;


document.getElementById("eventDate").value=
selectedDate;


openModal();


}



});


calendar.render();


}





function openModal(){

document.getElementById("eventModal").style.display="flex";

}



document
.getElementById("closeModal")
.onclick=()=>{


document.getElementById("eventModal").style.display="none";


};





document
.getElementById("saveEvent")
.onclick=async()=>{


const title=
document.getElementById("eventTitle").value;


const description=
document.getElementById("eventDescription").value;


const date=
document.getElementById("eventDate").value;


const time=
document.getElementById("eventTime").value;


const allDay=
document.getElementById("allDay").checked;


const type=
document.getElementById("eventType").value;



let start=date;



if(!allDay && time){

start=date+"T"+time;

}



await addDoc(
collection(db,"events"),
{


title,

description,

start,

type,

allDay


});


location.reload();


};





document
.getElementById("logoutButton")
.onclick=()=>{


signOut(auth);

window.location.href="index.html";


};
