defmodule Qi.UCI.MultiPV do
  def init(_args) do
    engine = ChessUCI.start("stockfish")
    {:ok, [engine: engine]}
  end

  def handle_in({"ping", [opcode: :text]}, state) do
    {:reply, :ok, {:text, "pong"}, state}
  end

  def handle_in({message, [opcode: :text]}, [engine: engine] = state) do
    decoded_message = JSON.decode!(message)

    res =
      %ChessUCIState{
        engine: engine,
        fen: decoded_message["data"],
        multipv: 1
      }
      |> ChessUCI.bestmoves(depth: 20)

    res = %{action: "onMove", data: res}
    # %{move: bestmove, cp: cp, percentage: percentage}
    {:reply, :ok, {:text, JSON.encode!(res)}, state}
  end
end
