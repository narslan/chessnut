import { Chessground } from 'chessground';
import { Chess, Square } from 'chess.js';
import { toDests, playOtherSide, toColor } from './util'


const chess = new Chess();
const el: HTMLElement = document.getElementById('chessground-examples')!;
const cg = Chessground(el, {
  orientation: 'white',
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

  webSocket.onmessage = (evt) => {
    const msg: string = evt['data'];
    if ((msg.length) == 4) {
      const from = msg.slice(0, 2) as Square;
      const to = msg.slice(2, 4) as Square;
      chess.move({ from, to });
      cg.move(from, to);
      cg.set({
        turnColor: toColor(chess),
        movable: {
          color: toColor(chess),
          dests: toDests(chess)
        }
      });

    }

  };
  return webSocket;

});
