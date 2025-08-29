// Must use ?inline because ?inline prevents vite from inserting the styles in
// a <style> the <head>
import { Chess } from "chess.js";
import { LitElement, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import "chessboard-element";
/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement("analyze-element")
export class AnalyzeElement extends LitElement {
  @query("chess-board")
  _chessBoard: any;
  @query("#status")
  _status: any;
  @query("#pgn")
  _pgn: any;
  @query("#fen")
  _fen: any;
  @query("#engine_data")
  _engineData: any;
  @property({ type: String })
  orientation = "white";

  @property({ type: Number })
  count = 0;
  @property({ type: String })
  engine_id = "";
  @state()
  game = new Chess();
  @state()
  ws = new WebSocket(`ws://localhost:8000/_ucimultipv`);

  refreshInterval: number;

  static styles = css``;

  render() {
    return html`
      <div
        id="analyze-container"
        style="display: flex; justify-content: center;"
      >
        <div id="chessboard">
          <chess-board
            @drag-start="${this._onDragStart}"
            @drop="${this._onDrop}"
            @snap-end="${this._onSnapEnd}"
            style="width: 600px"
            position="start"
            orientation="${this.orientation}"
            draggable-pieces
          >
          </chess-board>
          <div id="fen"></div>
          <p>
            <button @click="${this._dispatchChangeOrientation}">
              Change Sides
            </button>
          </p>
        </div>
        <div
          style="
            display: flex;
            flex-direction: column;
            flex-wrap: wrap;
            width: 200px;
        "
        >
          <div id="status"></div>
          <div id="pgn" style="text-align: left"></div>
          <div style="font-size: 14px;">
            <div id="engine_data" style="text-align: left"></div>
          </div>
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

    this.ws.onmessage = (msg: MessageEvent) => {
      const { action, data } = msg.data.startsWith("{")
        ? (JSON.parse(msg.data) as {
            action: string;
            data: string;
          })
        : { action: "", data: "" };
      console.log("Message Event", msg);

      if (action === "onConnect") {
        //this.engine_id = data;
        //TODO: Get engine info.
      } else if (action === "onMove") {
        const moves = data;
        this._engineData.innerHTML = JSON.stringify(moves, null, "\t");
      }
    };
  }

  async disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.refreshInterval);
    this.ws.close();
  }

  private _onDragStart(e: CustomEvent) {
    const { piece } = e.detail;

    if (this.game.isGameOver()) {
      e.preventDefault();
      return;
    }
    // only pick up pieces for the side to move
    if (
      (this.game.turn() === "w" && piece.search(/^b/) !== -1) ||
      (this.game.turn() === "b" && piece.search(/^w/) !== -1)
    ) {
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
        promotion: "q", // NOTE: always promote to a queen
      });
      const fen = { action: "onMove", data: this.game.fen() };
      this.ws.send(JSON.stringify(fen));
      this.updateStatus();
    } catch (error) {
      setAction("snapback");
    }
  }

  private _onSnapEnd() {
    this._chessBoard.setPosition(this.game.fen());
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

  async firstUpdated() {
    this.updateStatus();
    await new Promise((r) => setTimeout(r, 0));
    this.refreshInterval = setInterval(() => {
      this.ws.send("ping");
    }, 2000);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "analyze-element": AnalyzeElement;
  }
}
