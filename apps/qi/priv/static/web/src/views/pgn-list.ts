import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { pgnContext, PgnContext } from "./pgn-context";

@customElement("pgn-list")
export class PgnList extends LitElement {
  @consume({ context: pgnContext })
  pgnApi?: PgnContext;

  render() {
    console.log("Rendering list with", this.pgnApi?.pgns);

    return html`
      <ul>
        ${this.pgnApi?.pgns.map(
          (pgn) => html`
            <li>
              <a href="/pgn/${pgn.id}">${pgn.white} - ${pgn.black}</a>
            </li>
          `
        ) ?? html`<li>Keine Spiele</li>`}
      </ul>
    `;
  }

  static styles = css``;
}