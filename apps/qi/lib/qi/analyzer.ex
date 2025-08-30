defmodule Qi.Analyzer do
  use GenServer

  ## API

  def start_link(_args) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def analyze_batch(game_id, moves, ws_pid) do
    GenServer.cast(__MODULE__, {:analyze_batch, game_id, moves, ws_pid})
  end

  ## Callbacks

  def init(state) do
    {:ok, state}
  end

  def handle_cast({:analyze_batch, game_id, moves, ws_pid}, state) do
    Task.start(fn ->
      # hier direkt deine Analyse-Funktion aufrufen
      evaluations = Pgndiv.analyze(moves)

      # Ergebnis zurück an den WS-Handler
      send(ws_pid, {:analysis_ready, game_id, evaluations})
    end)

    {:noreply, state}
  end
end
