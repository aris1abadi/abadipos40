import ioClient from 'socket.io-client';

//const endpoint = 'http://192.168.0.110:5173/';
const endpoint = 'http://localhost:5173/';
//const endpoint = 'http://abadinet.my.id:5173/';


const socket = ioClient(endpoint);

export const io = socket;