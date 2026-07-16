import { auth } from "./firebase.js";


import {

    onAuthStateChanged,

    signOut

} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";





onAuthStateChanged(auth, (user) => {


    if (!user) {


        window.location.href = "index.html";


    }


});





const logoutButton =
document.getElementById("logoutButton");



logoutButton.addEventListener("click", async () => {


    await signOut(auth);


    window.location.href = "index.html";


});
