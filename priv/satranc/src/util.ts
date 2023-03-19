import { Api } from 'chessground/api';
import { Color, Key } from 'chessground/types';
import {ChessInstance, Square, SQUARES} from 'chess.js';

export function toDests(chess: ChessInstance): Map<Key, Key[]> {
  const dests = new Map();
  SQUARES.forEach(s => {
    const ms = chess.moves({square: s, verbose: true});
    if (ms.length) dests.set(s, ms.map(m => m.to));
  });
  return dests;
}

export function toColor(chess: ChessInstance): Color {
  return (chess.turn() === 'w') ? 'white' : 'black';
}

export function playOtherSide(cg: Api, chess: ChessInstance) {

  
  //websocket button
  const webSocket = new WebSocket("ws://localhost:8080/websocket");

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
  
  return (orig, dest) => {
    chess.move({from: orig, to: dest});
    cg.set({
      turnColor: toColor(chess),
      movable: {
        color: toColor(chess),
        dests: toDests(chess)
      }
    });
    //console.log(chess.fen());
    //console.log(chess.moves());
    //webSocket.send(JSON.stringify(chess.fen()));
    
    webSocket.send(JSON.stringify(`${orig}${dest}`));
  };
}