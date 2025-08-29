import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Home element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement("home-element")
export class HomeElement extends LitElement {
  /**
   * The number of times the button has been clicked.
   */
  @property({ type: Number, attribute: false })
  count = 0;

  @property({ type: String, attribute: false })
  engine_id?: string;


  @property({ type: String })
  color = "white";

  render() {
    return html`
     <p>hello home</p>
    `;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.updateComplete;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;

  }

  async disconnectedCallback() {
   
  }

  static styles = [
    css`
      
        `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "home-element": HomeElement;
  }
}
