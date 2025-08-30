import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./pgn-analyze";
import type { PGN } from "./pgn-model";

@customElement("pgn-view")
export class PgnView extends LitElement {
  private ws: WebSocket | null = null;

  @state()
  evals: { x: number; y: number }[] = [];
  @state()
  pgn: PGN | null = null;

  @state()
  game_id: string | null = null;

  connectedCallback() {
    super.connectedCallback();

    const id = location.pathname.split("/").pop();
    this.ws = new WebSocket("ws://localhost:8000/_pgn");

    this.ws.onopen = () => {
      if (id) {
        this.game_id = id
        this.ws!.send(JSON.stringify({ action: "pgn_one", data: id }));
      }
    };

    this.ws.onmessage = (msg) => {
      const { action, data } = JSON.parse(msg.data);
      if (action === "pgn_one") {
        console.log("PGN vom Server:", data.moves);

        const sanMoves = data.moves.split(",").map((m) => m.trim());
        const black = data.black;
        const white = data.white;
        const result = data.result;
        this.pgn = { ...this.pgn, sanMoves, black, white, result }; // moves ergänzen
      }
    };

    this.ws.onclose = () => {
      console.log("PGN view socket closed");
    };
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.ws?.close();
  }

  render() {

    console.log("pgn",this.pgn)
    if (!this.pgn) {
      return html`<p>Lade Spiel...</p>`;
    }
    return html`
      <h2>Spiel: ${this.pgn.id} ${this.pgn.white} - ${this.pgn.black} </h2>
       <h2>Result: ${this.pgn.result}</h2>   
      <!-- mit Mock -->

      <!-- mit WebSocket -->
      <pgn-analyze .ws=${this.ws} .game_id=${this.game_id} .sanMoves= ${this.pgn.sanMoves} ></pgn-analyze>
    `;
  }
}
