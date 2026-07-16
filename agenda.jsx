import {
 signOut
} from "firebase/auth";


import {
 auth
} from "./firebase";


export default function Agenda(){


function logout(){

 signOut(auth);

}


return (

<div>


<h1>
  Mijn Familie Agenda
</h1>


<p>
  Je bent ingelogd.
</p>


<button onClick={logout}>
  Uitloggen
</button>


</div>

);


}
