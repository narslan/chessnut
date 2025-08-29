import { Chess } from "chess.js";
import { LitElement, css, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import "chessboard-element";
/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement("engine-match")
export class EngineMatch extends LitElement {
  @query("chess-board")
  _chessBoard: any;
  @query("#status")
  _status: any;
  @query("#pgn")
  _pgn: any;
  @query("#fen")
  _fen: any;
  @property({ type: String })
  orientation = "black";

  @property({ type: Number })
  count = 0;
  @property({ type: String })
  engine_id = "";
  @property({ attribute: false })
  game = new Chess();
  @property({ attribute: false })
  ws = new WebSocket(`ws://localhost:8000/_game`);

  static styles = css`
    #pgn {
      width: 400px;
    }
  `;

  render() {
    return html`
     <div id="chessboard">
      <div>${this.engine_id}</div>
      <div>
        <chess-board
          style="width: 480px"
          position="start"
          orientation="${this.orientation}"
          move-speed="slow"
          draggable-pieces
        >
        </chess-board>
        <div id="fen"></div>

        <p>
          <button @click="${this._dispatchChangeOrientation}">Change Sides</button>
        </p>
      </div>
      <div
        style="display: flex; flex-direction: column; flex-wrap: wrap; width: 200px"
      >
        <div id="status"></div>
        <div id="pgn" style="text-align: left"></div>
      </div>
  </div>
    `;
  }

  _dispatchChangeOrientation() {
    this.orientation = this.orientation === "black" ? "white" : "black";
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.updateComplete;

    this.ws.onmessage = async (msg: MessageEvent) => {
      const { action, data } = msg.data.startsWith("{")
        ? (JSON.parse(msg.data) as {
          action: string;
          data: string;
        })
        : { action: "", data: "" };

      if (action === "onConnect") {
        this.engine_id = data;
      } else if (action === "onMove") {
        if (data.length == 4 || data.length == 5) {
          const from = data.slice(0, 2);
          const to = data.slice(2, 4);

          try {
            this.game.move({
              from: from,
              to: to,
              promotion: "q", // NOTE: always promote to a queen
            });
            this.updateStatus();
            await new Promise((r) => setTimeout(r, 500));
            if (this.game.isGameOver() || this.game.isCheckmate() || this.game.isDraw() || this.game.isThreefoldRepetition() || this.game.isInsufficientMaterial() || this.game.isThreefoldRepetition() || this.game.isStalemate()) {
              console.log("game ended");
            } else {
									
              const req = { action: "onMove", turn: this.game.turn(), data: this.game.fen() };
              this.ws.send(JSON.stringify(req));
            }
          } catch (error) {
            console.log("error from server", error);
          }
        }
      }
    };

    this.ws.onopen = () => {
      const fen = { action: "onOpen", turn: this.game.turn(), data: this.game.fen() };
      this.ws.send(JSON.stringify(fen));
    };
  }

  async disconnectedCallback() {
    super.disconnectedCallback();
    this.ws.close();
  }

  private updateStatus() {
    let status = "";

    let moveColor = "White";
    if (this.game.turn() === "b") {
      moveColor = "Black";
    }

    if (this.game.isCheckmate()) {
      // checkmate?
      status = `Game over, ${moveColor} is in checkmate.`;
    } else if (this.game.isDraw()) {
      // draw?
      status = "Game over, drawn position";
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
    "engine-match": EngineMatch;
  }
}
