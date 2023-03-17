import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import {  toDests,  playOtherSide } from './util'


const chess = new Chess();
const el: HTMLElement = document.getElementById('chessground-examples')!;
const cg = Chessground(el, {
  movable: {
    color: 'white',
    free: false,
    dests: toDests(chess),
  },
  draggable: {
    showGhost: true
  }
});
cg.set({
  movable: { events: { after: playOtherSide(cg, chess) } }
});

//rest button
const button = document.getElementById('btn');

button?.addEventListener('click', function handleClick(event) {
  console.log('button clicked');
  console.log(event);
  console.log(event.target);

  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    
  };

  const myRequest = new Request("http://localhost:8080/rest", options);

  fetch(myRequest)
  .then((response) => response.text)
  .then((response) => {
    console.log(response);
    
  });
});


//websocket button
const wsButton = document.getElementById('ws-btn');

wsButton?.addEventListener('click', function handleClick(event) {
  
  console.log(event);
  
  const webSocket = new WebSocket("ws://localhost:8080/websocket");

  webSocket.onmessage = (ev: MessageEvent<string>) => {
    console.log(ev);
  };

  const msg = {
    type: "message",
    text: "text",
    id: 576,
    date: Date.now(),
  };
  webSocket.send(JSON.stringify(msg));
});