import ioClient from 'socket.io-client';

//const endpoint = 'http://192.168.0.110:5173/';
//const endpoint = 'http://localhost:5173/';
const endpoint = 'https://api.abadinet.my.id/';


const socket = ioClient(endpoint);

export const io = socket;
