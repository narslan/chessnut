defmodule ChessUCI do
  alias Engine
  require Logger

  @multiplier -0.00368208
  def start(engine \\ "stockfish") do
    {:ok, engine} = Engine.start_link(engine)
    engine
  end

  def bestmove(%ChessUCIState{engine: engine, fen: fen}, options \\ []) do
    Engine.uci_new_game(engine)
    Engine.position(engine, fen)
    output = Engine.go(engine, options)

    regex = ~r/bestmove (?<bestmove>\w+)\s*/
    [result_line, analyze_line | _] = output
    cp = String.split(analyze_line, " ") |> Enum.fetch!(9) |> String.to_integer()

    score = Float.round(50 + 50 * (2 / (:math.exp(@multiplier * cp) + 1) - 1), 2)

    case Regex.named_captures(regex, result_line) do
      %{"bestmove" => bestmove} ->
        {bestmove, cp, score}

      nil ->
        {:error, "cannot find best move : #{inspect(output)}"}
    end
  end

  def bestmoves(%ChessUCIState{engine: engine, fen: fen, multipv: multipv}, options \\ []) do
    set_multipv(%ChessUCIState{engine: engine}, multipv)
    Engine.uci_new_game(engine)
    Engine.position(engine, fen)

    depth = Keyword.get(options, :depth) |> Integer.to_string()

    Engine.go(engine, options)
    |> Enum.map(&String.split(&1, " ", trim: true))
    |> Enum.filter(fn l ->
      Enum.member?(l, "pv")
    end)
    |> Enum.map(fn l ->
      pv_index = Enum.find_index(l, &(&1 == "pv"))
      info_analyze = Enum.slice(l, 1..(pv_index - 1))
      moves = Enum.slice(l, (pv_index + 1)..length(l))

      analyze_map =
        Enum.filter(info_analyze, &(&1 != "score" and &1 != "upperbound"))
        |> Enum.chunk_every(2)
        |> Map.new(fn [k, v] -> {k, v} end)

      analyze_map
      |> Map.take(["cp", "depth"])
      |> Map.put("bestmove", hd(moves))
    end)
    |> Enum.filter(fn x -> x["depth"] == depth end)
  end

  def stop(engine) do
    Engine.quit(engine)
    :ok
  end

  def set_multipv(%ChessUCIState{engine: engine}, mpv \\ 1) do
    Engine.set_option(engine, "MultiPV", mpv)
    %ChessUCIState{multipv: mpv}
  end

  def set_wdl(%ChessUCIState{engine: engine}) do
    Engine.set_option(engine, "UCI_ShowWDL", true)
    %ChessUCIState{}
  end
end
