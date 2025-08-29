import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import "@spectrum-web-components/sidenav/sp-sidenav-item.js";
import "@spectrum-web-components/sidenav/sp-sidenav.js";

@customElement('main-layout')
export class MainLayout extends LitElement {
  static styles = css`
    #wrapper {
      display: grid;
      grid-template-columns: minmax(250px, 15%) 1fr;
    }
  `;

  render() {
    return html`
      <header></header>
      <div id="wrapper">
        <div id="sidebar">
          <sp-sidenav variant="multilevel" defaultValue="Home">
            <sp-sidenav-item value="Home" label="Home" href="/home"></sp-sidenav-item>
            <sp-sidenav-item value="PGN" label="PGN" href="/pgn"></sp-sidenav-item>
          </sp-sidenav>
        </div>
        <div id="main-content">
          <slot></slot>  <!-- Hier werden Home / PGN / PGN-View gerendert -->
        </div>
      </div>
      <footer></footer>
    `;
  }
}
