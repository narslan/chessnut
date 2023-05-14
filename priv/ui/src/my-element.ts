// Must use ?inline because ?inline prevents vite from inserting the styles in
// a <style> the <head>
import styles from './my-element.scss?inline';
import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { Chess } from 'chess.js';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import 'chessboard-element';
/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('my-element')
export class MyElement extends LitElement {

  @query('chess-board')
  _chessBoard: any;
  @query('#status')
  _status: any;
  @query('#pgn')
  _pgn: any;
  @query('#fen')
  _fen: any;

  private ws!: WebSocketSubject<any>;

  // This is safe to use if the sass styles are compiled statically and without
  // user input.
  static styles = unsafeCSS(styles);


  /**
   * The number of times the button has been clicked.
   */
  @property({ type: Number })
  count = 0
  @property({ type: Chess })
  game = new Chess()

  render() {
    
    //TODO: This below seems so stupid. Sue me for it.
    const pathname = location.pathname.slice(1)  
    let orientation = ""
    let otherOrientation = ""  
    if (pathname === "") {
      orientation = "white"
      otherOrientation = "Black"
    } else if (pathname === "white")  {
      orientation = "white"
      otherOrientation = "Black"
    } else {
      orientation = "black"
      otherOrientation = "White"
    }


    return html`
      <div style="display:flex ">
      <div>
      <chess-board
      @drag-start="${this._onDragStart}"
      @drop="${this._onDrop}"
       @snap-end="${this._onSnapEnd}"
      style="width: 640px"
      position="start"
      orientation="${orientation}"
      draggable-pieces>
      </chess-board>
      <div id="fen"></div>
      <button @click="${() => window.location.replace(`http://localhost:5173/${otherOrientation.toLowerCase()}`)}">Play ${otherOrientation}</button>
    </div>
      <div style="display:flex; flex-direction: column; flex-wrap: wrap; width: 200px;  ">
        <div id="status"></div>
        
        <div id="pgn" style="text-align: left;"></div>
      </div>
       </div>
    `
  }


  async connectedCallback() {
    super.connectedCallback()
    await this.updateComplete;

    this.ws = webSocket(`ws://localhost:8080/websocket?color=${this._chessBoard.orientation}`);

    this.ws.subscribe({

      next: (msg) => {

        const move: string = msg['message'];
        if ((move.length) == 4 || (move.length) == 5) {
          const from = move.slice(0, 2);
          const to = move.slice(2, 4);

          try {
            this.game.move({
              from: from,
              to: to,
              promotion: 'q' // NOTE: always promote to a queen 
            });
            
            this.updateStatus();


          } catch (error) {
            console.log("error from server", error);
          }

        }
      },

      complete: () => {

        this.updateStatus();
      }
    });

  }

  private _onDragStart(e: CustomEvent) {
    const { piece } = e.detail;

    if (this.game.isGameOver()) {
      e.preventDefault();
      return;
    }
    // only pick up pieces for the side to move
    if ((this.game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (this.game.turn() === 'b' && piece.search(/^w/) !== -1)) {
      e.preventDefault();
      return;
    }
   
  }


  private _onDrop(e: CustomEvent) {
    const { source, target, setAction } = e.detail;

    try {
      this.game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen 
      });
      this.ws.next(`${source}${target}`);
      this.updateStatus();
    } catch (error) {
      setAction('snapback');
    }

  }


  private _onSnapEnd() {

    this._chessBoard.setPosition(this.game.fen());

  }

  private updateStatus() {
    let status = '';

    let moveColor = 'White';
    if (this.game.turn() === 'b') {
      moveColor = 'Black';
    }

    if (this.game.isCheckmate()) {
      // checkmate?
      status = `Game over, ${moveColor} is in checkmate.`;
    } else if (this.game.isDraw()) {
      // draw?
      status = 'Game over, drawn position';
    } else {
      // game still on
      status = `${moveColor} to move`;

      // check?
      if (this.game.isCheck()) {
        status += `, ${moveColor} is in check`;
      }
    }
    this._chessBoard.setPosition(this.game.fen());
    this._status.innerHTML = status;
    this._fen.innerHTML = this.game.fen();
    this._pgn.innerHTML = this.game.pgn();
  }

  firstUpdated() {
    this.updateStatus();
  }
}





declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement
  }
}
