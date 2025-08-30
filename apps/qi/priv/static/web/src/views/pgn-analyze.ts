import { Chess } from "chess.js";
import "chessboard-element";
import { LitElement, css, html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import uPlot from "uplot";
import uPlotCss from "uplot/dist/uPlot.min.css?inline"; // wichtig: bundler muss ?inline unterstützen

@customElement("pgn-analyze")
export class PgnAnalyze extends LitElement {
  @property({ attribute: false }) ws!: WebSocket;
  @property({ attribute: false }) game_id!: string;
  @property({ type: Boolean }) mockMode = false; // 🆕 Flag für Mock
  @property({ type: Array }) sanMoves: string[] = [];

  @state() game = new Chess();
  @state() currentMoveIndex = 0;
  @state() evaluation = 0;
  @state() bestmove = "";
  @state() loading = false;

  @state() trendValues: number[] = []; // Start mit einem Dummy-Wert
  @state() allTrendValues: number[] = []; // gesamte Engine-Scores für alle Züge
  private chart: uPlot | null = null;

  static styles = [
    css`
      ${unsafeCSS(uPlotCss)}
    `,
    css`
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: bold;
        z-index: 10;
      }
      .container {
        display: grid;
        grid-template-columns: 500px 1fr;
        grid-template-rows: auto auto 1fr;
        gap: 20px;
        padding: 10px;
        height: 100%;
      }

      .board {
        grid-row: 1 / span 3;
      }

      .sidebar {
        grid-column: 2;
      }

      .controls {
        margin: 10px 0;
      }

      .move-list {
        grid-column: 2;
        grid-row: 2;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #ccc;
        padding: 5px;
        font-family: monospace;
      }

      .chart-wrapper {
        width: 100%;
        max-width: 600px; /* Maximalbreite */
        margin: 10px auto; /* zentriert */
        padding: 10px; /* Abstand für Titel/Achsen */
        border: 1px solid #ccc;
        border-radius: 8px;
        background: #fafafa;
        box-sizing: border-box;
      }

     
    `,
  ];

  render() {
    // const percent = (scaled + 1) * 50;

    return html`
      <div class="container">
        ${this.loading
          ? html`<div class="loading-overlay">⏳ Analysing ...</div>`
          : null}

        <chess-board
          class="board"
          style="width: 500px"
          position="${this.game.fen()}"
        ></chess-board>
        <div class="sidebar">
          <!-- Chart -->

          <div>Move ${this.currentMoveIndex} / ${this.sanMoves.length}</div>
          <div class="controls">
            <button
              @click=${this.prevMove}
              ?disabled=${this.currentMoveIndex === 0 || this.loading}
            >
              ◀ Zurück
            </button>
            <button
              @click=${this.nextMove}
              ?disabled=${this.currentMoveIndex === this.sanMoves.length ||
              this.loading}
            >
              Vor ▶
            </button>
          </div>
          <div>Evaluation: ${this.evaluation} cp</div>
          <div>Bestmove: <b>${this.bestmove}</b></div>
          <div class="chart-wrapper">
            <div id="trendChart" ></div>
          </div>

          <div>Evaluation: ${this.evaluation.toFixed(2)} cp</div>
          <div>Bestmove: <b>${this.bestmove}</b></div>

          <!-- Debug: Werte anzeigen -->
          <div class="move-list">
            ${Array.from(
              { length: Math.ceil(this.sanMoves.length / 2) },
              (_, i) => html`
                <div class="move-pair">
                  <span class="move-number">${i + 1}.</span>
                  <span
                    class="move-item white ${2 * i === this.currentMoveIndex - 1
                      ? "current"
                      : ""}"
                    @click=${() => this.goToMove(2 * i + 1)}
                  >
                    ${this.sanMoves[2 * i]}
                  </span>
                  ${this.sanMoves[2 * i + 1]
                    ? html`
                        <span
                          class="move-item black ${2 * i + 1 ===
                          this.currentMoveIndex - 1
                            ? "current"
                            : ""}"
                          @click=${() => this.goToMove(2 * i + 2)}
                        >
                          ${this.sanMoves[2 * i + 1]}
                        </span>
                      `
                    : ""}
                </div>
              `,
            )}
          </div>
        </div>
      </div>
    `;
  }

  private goToMove(index: number) {
    this.game.reset();
    for (let i = 0; i < index; i++) {
      this.game.move(this.sanMoves[i]);
    }
    this.currentMoveIndex = index;

    const fen = this.game.fen();
    const board = this.renderRoot.querySelector("chess-board") as any;
    board?.setPosition(fen);

    // Historische Bewertung verwenden, falls vorhanden
    if (this.allTrendValues[index] !== undefined) {
      const score = this.allTrendValues[index];
      this.trendValues = this.allTrendValues.slice(0, index + 1);
      this.evaluation = score;
      this.loading = false;
    }
  }

  private nextMove = () => {
    if (this.currentMoveIndex < this.sanMoves.length) {
      this.goToMove(this.currentMoveIndex + 1);
    }
  };

  private prevMove = () => {
    if (this.currentMoveIndex > 0) {
      this.goToMove(this.currentMoveIndex - 1);
    }
  };

  firstUpdated() {
    if (this.mockMode) {
      this.startMockData();
    } else if (this.ws) {
      this.setupWs();
    }
  }

  updated() {
     if (this.chart && this.trendValues.length > 0) {
    const xs = this.trendValues.map((_, i) => i + 1);
    const ys = this.trendValues;
    this.chart.setData([xs, ys]);
  }
  }

  private setupWs() {
    this.ws.send(
      JSON.stringify({
        action: "analyze_batch",
        data: this.game_id,
      }),
    );
    this.loading = true;

    this.ws.onmessage = (msg) => {
      const parsed = JSON.parse(msg.data);
      if (parsed.action === "analyze_ready") {

        const results = parsed.data;
        console.log(results, "results")

        // x-Werte = Zug-Index (0,1,2,...)
        const xValues = results.map((_, i) => i + 1);

        // y-Werte = normalisierte Scores
        const yValues = results.map((r) => {
         
            return r[0] / 100; 
          }
        );
    console.log(xValues, "xValues");
    console.log(yValues, "yValues");
        this.allTrendValues = yValues;

        // uPlot updaten
        if (this.chart) {
          this.chart.setData([xValues, yValues]);
        } else {
          // Falls Chart noch nicht existiert → jetzt erzeugen
          const chartDiv = this.renderRoot.querySelector(
            "#trendChart",
          ) as HTMLElement;
          const opts: uPlot.Options = {
            width: 600,
            height: 300,
            title: "Engine Evaluation",
            scales: {
              x: { time: false },
              y: { min: -10, max: 10 },
            },
            series: [{}, { label: "Score", stroke: "green", width: 2 }],
          };
          this.chart = new uPlot(opts, [xValues, yValues], chartDiv);
        }
        this.loading = false;
      } else if (parsed.action === "analyze_batch_started") {
        //Ladeanzeige starten
        this.loading = true;
      }
    };
  }

  private startMockData() {
    console.log("⚠ Mock-Daten aktiv");

    let ply = 0;
    setInterval(() => {
      const cp = Math.floor(Math.random() * 600 - 300);
      const score = cp / 100.0;
      this.allTrendValues[ply] = score;
      if (this.currentMoveIndex === ply) {
        this.trendValues = this.allTrendValues.slice(0, ply + 1);
      }
      ply++;
    }, 1000);
  }
}
