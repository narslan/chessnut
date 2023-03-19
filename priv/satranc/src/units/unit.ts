import { Api } from 'chessground/api';

import * as playengine from './playengine';


export interface Unit {
  name: string;
  run: (el: HTMLElement) => Api;
}

export const list: Unit[] = [
  playengine.whitefirst,
  playengine.blackfirst,

];
