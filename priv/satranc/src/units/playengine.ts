import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { toDests, playOtherSide } from '../util'
import { Unit } from './unit';

export const whitefirst: Unit = {
  name: 'Play against engine with black pieces',
  run(el) {
    const chess = new Chess();
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

    cg.set({
      movable: { events: { after: playOtherSide(cg, chess, 'white') } }
    });
    return cg;
  }
};


export const blackfirst: Unit = {
  name: 'Play against engine with black pieces',
  run(el) {
    const chess = new Chess();
    const cg = Chessground(el, {
      orientation: 'black',
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
      movable: { events: { after: playOtherSide(cg, chess, 'black') } }
    });
    return cg;
  }
};
