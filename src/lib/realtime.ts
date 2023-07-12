import ioClient from 'socket.io-client';

const endpoint = 'http://192.168.100.119:3000/';
//const endpoint = 'http://localhost:3000/';
//const endpoint = 'https://api.abadinet.my.id/';

const socket = ioClient(endpoint);

export const io = socket;
