import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { PGN } from "./pgn-model";

@customElement("pgn-element")
export class PgnElement extends LitElement {
  private ws: WebSocket | null = null;

  @state()
  pgns: PGN[] = [];

  connectedCallback() {
    super.connectedCallback();
    this.ws = new WebSocket("ws://localhost:8000/_pgn");

    this.ws.onopen = () => {
      this.ws!.send(JSON.stringify({ action: "pgn_all", data: [] }));
    };

    this.ws.onmessage = (msg) => {
      const { action, data } = JSON.parse(msg.data);
      if (action === "pgn_all") {
        this.pgns = data as PGN[];
      }
    };

    this.ws.onclose = () => {
      console.log("PGN list socket closed");
    };
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.ws?.close();
  }

  render() {
    return html`
      <h2>Spieleliste</h2>
      <ul>
        ${this.pgns.map(
          (p) =>
            html`<li>
              <a href="/pgn/${p.id}" @click=${this.navigate}> <b> ${p.id} ${p.white} ${p.black} ${p.result} </b> </a> 
            </li>`
        )}
      </ul>
    `;
  }

  private navigate(e: Event) {
    e.preventDefault();
    const href = (e.currentTarget as HTMLAnchorElement).getAttribute("href");
    if (href) {
      window.history.pushState({}, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }
}