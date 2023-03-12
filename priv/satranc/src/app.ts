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
