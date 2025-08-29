defmodule Qi.WS.Pgn do
  require Ecto.Repo

  def init(_args) do
    {:ok, pid} = Qi.Analyzer.start_link(engine_path: "stockfish")
    {:ok, %{"analyzer_pid" => pid}}
  end

  # def handle_in({"ping", [opcode: :text]}, state) do
  #   {:reply, :ok, {:text, "pong"}, state}
  # end

  # def handle_in({message, [opcode: :text]}, state) when message == "ping" do
  #   # decoded_message = JSON.decode!(message)

  #   {:reply, :ok, {:text, ""}, state}
  # end

  def handle_in({message, [opcode: :text]}, %{"analyzer_pid" => analyzer_pid} = state) do
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
        pgn = Qi.Pgn |> Qi.Repo.get(data)
        evaluations = Pgndiv.analyze(pgn.moves)

        {:reply, :ok,
         {:text, JSON.encode!(%{"action" => "analyze_batch", "data" => evaluations})}, state}
    end
  end

  def get_all do
    Qi.Pgn |> Qi.Repo.all()
  end

  def get_one(id) do
    Qi.Repo.get(Qi.Pgn, id)
  end
end
