import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { toDests, playOtherSide } from './util'


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


const wsButton = document.getElementById('ws-btn');

wsButton?.addEventListener('click', function handleClick(event) {

  console.log(event);

  const webSocket = new WebSocket("ws://localhost:8080/websocket");

  cg.set({
    movable: { events: { after: playOtherSide(cg, chess, webSocket!) } }
  });

  return webSocket;

});







