import * as wss from './wss.js';
import * as store from './store.js';
import * as constants from './constants.js';
import * as ui from './ui.js';
  


let connectedUserDetails;

let peerConnection;



const defaultConstraints = {
    audio: true,
    video: true
};

const configuration = {
    iceServers: [
        {
          urls: 'stun:stun.l.google.com:13902',
        }
      ]
};
export const getLocalPreview = () => {
    navigator.mediaDevices.getUserMedia(defaultConstraints)
    .then((stream) => {
        ui.updateLocalVideo(stream);
        store.setLocalStream(stream);
    }).catch((err) => {
        console.log('error occured when trying to access camera');
        console.log(err);
    });
};

const createPeerConnection = () => {
    peerConnection = new RTCPeerConnection(configuration);   

    peerConnection.onicecandidate = (event) => {
        console.log('getting ice candidate from stun server');
        if (event.candidate) {
            // send our ice candidates to other peer
            wss.sendDataUsingWebRTCSignallling({
                connectedUserSocketId: connectedUserDetails.socketId,
                type: constants.webRTCSignalling.ICE_CANDIDATE,
                candidate: event.candidate,
            });

        }
    };

    peerConnection.onconnectionstatechange = (event) => {
        if(peerConnection.connectionState === 'connected') {
            console.log('successfully connected with other peer');
        }
    }

    //receivinng tracks
    const remoteStream = new MediaStream();
    store.setRemoteStream(remoteStream);
    ui.updateRemoteVideo(remoteStream);

    peerConnection.ontrack = (event) => {
        remoteStream.addTrack(event.track);
    }

    //add our stream to peer connection

    if(connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE){
        const localStream = store.getState().localStream;

        for(const track of localStream.getTracks()){
            peerConnection.addTrack(track, localStream);
        }
    }
};



//ask if the person wants to talk or not 
//calleePersonalCode is person to be called
export const sendPreOffer  = (callType ,calleePersonalCode) => {
    // console.log('pre offer function executed')
    // console.log();
    // console.log(callType + ': ' + calleePersonalCode);
    connectedUserDetails = {
        callType,
        socketId: calleePersonalCode
    }

    if (callType === constants.callType.VIDEO_PERSONAL_CODE ){
        const data = {
            callType,
            calleePersonalCode,
        };
        ui.showCallingDialog(callingDialogRejectCallHandler);
        wss.sendPreOffer(data);
    }
};

export const handlePreOffer = (data) => {
    console.log('pre offer came in another client');
    console.log(data);

    const {callType, callerSocketId} = data;

    connectedUserDetails = {
        socketId: callerSocketId,
        callType,
    };

    if(callType === constants.callType.VIDEO_PERSONAL_CODE){
        ui.showIncomingCallDialog(callType, acceptCallHandler, rejectCallHandler);
    }

};


const acceptCallHandler = () => {
    console.log('call accepted');
    createPeerConnection();
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
    ui.showCallElements(connectedUserDetails.callType);
};

const rejectCallHandler = () => {
    console.log('call rejected');
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
}

const callingDialogRejectCallHandler = () => {
    console.log('rejecting the call');
    ///////////////////////
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
    
}

const sendPreOfferAnswer = (preOfferAnswer) => {
    const data = {
        callerSocketId: connectedUserDetails.socketId,
        preOfferAnswer: preOfferAnswer
    }
    ui.removeAllDialogs();
    wss.sendPreOfferAnswer(data);
}


export const handlePreOfferAnswer = (data) => {
    const {preOfferAnswer} = data;
    ui.removeAllDialogs();

    // console.log('pre offer answer came');
    // console.log(data);

    if(preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND){
        //show dailog that calle has not been found
        ui.showInfoDialog(preOfferAnswer);
    }

    if(preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAILABLE){
        //show dailog that calle his not able to connect
        ui.showInfoDialog(preOfferAnswer);
    }

    if(preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED){
        //show dailog that calle rejected the call
        ui.showInfoDialog(preOfferAnswer);
    }

    if(preOfferAnswer === constants.preOfferAnswer.CALL_ACCEPTED) {
        //show dailog that calle accepted
        ui.showCallElements(connectedUserDetails.callType);
        createPeerConnection();
        sendWebRTCOffer();
    }
};

const sendWebRTCOffer = async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    wss.sendDataUsingWebRTCSignallling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type: constants.webRTCSignalling.OFFER,
        offer: offer,
    });
};

export const handleWebRTCOffer = async (data) => {
    await peerConnection.setRemoteDescription(data.offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    wss.sendDataUsingWebRTCSignallling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type:constants.webRTCSignalling.ANSWER,
        answer: answer,
    });
};

export const handleWebRTCAnswer  = async (data) => {
    console.log("handling webRtc Answer");
    await peerConnection.setRemoteDescription(data.answer);
};

export const handleWebRTCCandidate = async (data) => {
    console.log('handling incoming webRTC candidate');
    try{
        await peerConnection.addIceCandidate(data.candidate);
    } catch (err) {
        console.error(
            "error occured when trying to add received ice candidate",
            err
        );
    }
};