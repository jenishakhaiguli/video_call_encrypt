let state = {
    //we dont know the intial state
    socketId: null,
    localStream: null,
    remoteStream: null,

};

export const setSocketId = (socketId) => {
    state = {
        //previous state copied
        ...state,
        socketId: socketId,
    };
    console.log(state);
};

export const setLocalStream = (stream) => {
    state = {
        //previous state copied
        ...state,
        localStream: stream
    };
    //console.log(state);
};

export const setRemoteStream = (stream) => {
    state = {
        //previous state copied
        ...state,
        remoteStream: stream,
    };
    //console.log(state);
};

export const getState = () => {
    return state;
}