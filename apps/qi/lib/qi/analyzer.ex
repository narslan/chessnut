defmodule Qi.Analyzer do
  use GenServer

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(opts) do
    engine_path = Keyword.get(opts, :engine_path, "stockfish")
    engine = ChessUCI.start(engine_path)
    {:ok, %{"engine1" => engine}}
  end

  def analyze_pgn(pgn, depth \\ 20) do
    GenServer.call(__MODULE__, {:analyze_pgn, pgn, depth})
  end

  @impl true
  def handle_call({:analyze_pgn, fens}, _from, state) do
    %ChessUCIState{
      engine: state.engine1,
      fen: hd(fens),
      multipv: 1
    }
    |> ChessUCI.bestmoves(depth: 20)

    {:reply, state}
  end
end
