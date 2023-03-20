import { Api } from 'chessground/api';
import { Color } from 'chessground/types';

import * as playengine from './playengine';


export interface Unit {
  name: string;
  run: (el: HTMLElement, ws: WebSocket) => Api;
  orientation: Color
}

export const list: Unit[] = [
  playengine.whitefirst,
  playengine.blackfirst,

];
