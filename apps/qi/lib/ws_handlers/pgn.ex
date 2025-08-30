defmodule Qi.WS.Pgn do
  require Ecto.Repo

  def init(_args) do
    {:ok, %{}}
  end

  def handle_in({message, [opcode: :text]}, state) do
    {:ok, %{"action" => action, "data" => data}} = JSON.decode(message)

    case action do
      "pgn_one" ->
        pgn = Qi.Pgn |> Qi.Repo.get(data)

        {:reply, :ok,
         {:text, JSON.encode!(%{"action" => action, "data" => Qi.Pgn.to_detail(pgn)})}, state}

      "pgn_all" ->
        pgns = Qi.Pgn |> Qi.Repo.all() |> Enum.map(&Qi.Pgn.to_summary/1)
        {:reply, :ok, {:text, JSON.encode!(%{"action" => action, "data" => pgns})}, state}

      "on_close" ->
        {:reply, :ok, {:text, "get on_close"}, state}

      "ping" ->
        {:reply, :ok, {:text, JSON.encode!(%{"action" => "pong", "data" => []})}, state}

      "analyze_batch" ->
        game_id = data
        pgn = Qi.Pgn |> Qi.Repo.get(game_id)
        # Analyse starten
        Qi.Analyzer.analyze_batch(game_id, pgn.moves, self())

        # Sofortige Antwort, damit Frontend auf "loading" umschalten kann
        {:reply,
         {:text, JSON.encode!(%{"action" => "analyze_batch_started", "game_id" => game_id})},
         state}
    end
  end

  def handle_info({:analysis_ready, game_id, evaluations}, state) do
    # Ergebnis zurückschicken
    {:reply,
     {:text,
      JSON.encode!(%{
        "action" => "analyze_batch_done",
        "game_id" => game_id,
        "data" => evaluations
      })}, state}
  end

  def get_all do
    Qi.Pgn |> Qi.Repo.all()
  end

  def get_one(id) do
    Qi.Repo.get(Qi.Pgn, id)
  end
end
