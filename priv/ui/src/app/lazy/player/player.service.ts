import { Injectable } from '@angular/core';
import { Api } from 'chessground/api';
import { ChessInstance, Square, SQUARES, Chess } from 'chess.js';
import { Chessground } from 'chessground';
import { Color, Key, MoveMetadata } from 'chessground/types';


@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  constructor() { }

  init(el: HTMLElement, orientation: Color) {

    const chess = new Chess();
    const cg: Api = Chessground(el, {
      orientation,
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
  }
 
}


function toDests(chess: ChessInstance): Map<Key, Key[]> {
  const dests = new Map();
  SQUARES.forEach(s => {
    const ms = chess.moves({ square: s, verbose: true });
    if (ms.length) dests.set(s, ms.map(m => m.to));
  });
  return dests;
}

function toColor(chess: ChessInstance): Color {
  return (chess.turn() === 'w') ? 'white' : 'black';
}

function playOtherSide(cg: Api, chess: ChessInstance) {

  // ws.onmessage = (evt) => {
  //   const msg: string = evt['data'];
  //   if ((msg.length) == 4) {
  //     const from = msg.slice(0, 2) as Square;
  //     const to = msg.slice(2, 4) as Square;
  //     chess.move({ from, to });
  //     cg.move(from, to);
  //     cg.set({
  //       turnColor: toColor(chess),
  //       movable: {
  //         color: toColor(chess),
  //         dests: toDests(chess)
  //       }
  //     });
  //   }
  // };

  return (orig: Key, dest: Key, metadata: MoveMetadata) => {
    chess.move({ from: orig as Square, to: dest as Square});
    cg.set({
      turnColor: toColor(chess),
      movable: {
        color: toColor(chess),
        dests: toDests(chess)
      }
    });
    //ws.send(JSON.stringify(`${orig}${dest}`));
  };
}