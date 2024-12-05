let ioInstance;

export function setIoInstance(io) {
    ioInstance = io;
}

export function handleChatConnection(socket) {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
}

