import { Injectable } from '@angular/core';
import { Api } from 'chessground/api';
import { ChessInstance, Square, SQUARES, Chess } from 'chess.js';
import { Chessground } from 'chessground';
import { Color, Key, MoveMetadata } from 'chessground/types';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';


@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  private ws!: WebSocketSubject<any> ;

  
  init(el: HTMLElement, orientation: Color) {

    this.ws = webSocket(`ws://localhost:8080/websocket?color=${orientation}`);

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
      movable: { events: { after: this.playOtherSide(cg, chess) } }
    });
    
  }
  
  close() {
    console.log("connection should be closed");
    
    this.ws.complete();
  }

  playOtherSide(cg: Api, chess: ChessInstance) {

    this.ws.subscribe({
  
      next: (msg) => {
        console.log("message from server",msg);
        
        const move: string = msg['message'];
        if ((move.length) == 4) {
          const from = move.slice(0, 2) as Square;
          const to = move.slice(2, 4) as Square;
          chess.move({ from, to });
          cg.move(from, to);
          cg.set({
            turnColor: toColor(chess),
            movable: {
              color: toColor(chess),
              dests: toDests(chess)
            }
          });
        }}});
  
    return (orig: Key, dest: Key, metadata: MoveMetadata) => {
      chess.move({ from: orig as Square, to: dest as Square});
      cg.set({
        turnColor: toColor(chess),
        movable: {
          color: toColor(chess),
          dests: toDests(chess)
        }
      });
      this.ws.next(`${orig}${dest}`);
    };
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

