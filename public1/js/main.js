import * as store from "./store.js";
import * as wss from "./wss.js";
import * as webRTCHandler from "./webRTCHandler.js";
import * as constants from './constants.js';
//import * as elements from "./elements.js";

//initialization of socketIO connection
const socket = io('/'); //connection from the client side with our socket
console.log("printing socket");
console.log(socket);


//connection code
wss.registerSocketEvents(socket);

webRTCHandler.getLocalPreview();

//register event listner for personal code copy button
const personalCodeCopyButton = document.getElementById('personal_code_copy_button');
personalCodeCopyButton.addEventListener("click", () => {
    
    const personalCode = store.getState().socketId;
    
    //The Clipboard interface's writeText() property writes the specified text string to the system clipboard.
    //copy the personal code
    navigator.clipboard;
    navigator.clipboard.writeText(personalCode);
});


/////register event listner for connection buttons

const personalCodeVideoButton = document.getElementById('personal_code_video_button');
//----------------------sending offer to server... berfore that checking if caller wants to reject the call---------------
personalCodeVideoButton.addEventListener("click", () => {
    console.log('video button clicked');

    const calleePersonalCode = document.getElementById('personal_code_input').value;
    const callType = constants.callType.VIDEO_PERSONAL_CODE;
    //calleePersonalCode is code of the person to whom we want to call

    webRTCHandler.sendPreOffer(callType ,calleePersonalCode);
});
  
// elements.getIncomingCallDialog(
//     "VIDEO",
//     () => {},
//     () => {}
// );