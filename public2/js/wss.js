//web socket server
import * as store from './store.js';
import * as ui from './ui.js';
import * as webRTCHandler from './webRTCHandler.js';
import * as constants from './constants.js';

let socketIO = null;

export const registerSocketEvents = (socket) => {

    socketIO = socket;

   // is called directly before the connection has been opened   (callbacks)
    socket.on('connect', () => {
        console.log('client sucessfully connected to socket.io server');
        console.log(socket.id);
        store.setSocketId(socket.id); //store the values in the store
        ui.updatePersonalCode(socket.id); //updating the frontend html
    });
    //-----------------receiver/callee connection code-----------------
     socket.on('pre-offer',(data) => {
         console.log('receiver client sucessfully connected to socket.io ');
         //console.log( data);
         webRTCHandler.handlePreOffer(data);
     });

     socket.on('pre-offer-answer', (data) => {
         webRTCHandler.handlePreOfferAnswer(data);
     })

     socket.on('webRTC-signalling', (data) => {
        switch (data.type) {
            case constants.webRTCSignalling.OFFER:
                webRTCHandler.handleWebRTCOffer(data);
                break;
            default:
                return;
        }
    });
};
//-------------------sending offer to to server-------------------------
export const sendPreOffer = (data) => {
    console.log('offer sent to server from caller');
    socketIO.emit('pre-offer', data);
}

export const sendPreOfferAnswer = (data) => {
    socketIO.emit('pre-offer-answer', data);
};

export const sendDataUsingWebRTCSignallling = (data) => {
    socketIO.emit('webRTC-signalling', data);
}
 