defmodule Qi.UCI.EngineGame do
  def init(_args) do
    white = ChessUCI.start("stockfish")
    black = ChessUCI.start("stockfish")
    {:ok, [white: white, black: black]}
  end

  def handle_in({"ping", [opcode: :text]}, state) do
    {:reply, :ok, {:text, "pong"}, state}
  end

  def handle_in({message, [opcode: :text]}, [white: white, black: black] = state) do
    decoded_message = JSON.decode!(message)
    turn = decoded_message["turn"]

    res =
      case turn do
        "b" ->
          {res, _, _} =
            %ChessUCIState{
              engine: black,
              fen: decoded_message["data"],
              multipv: 1
            }
            |> ChessUCI.bestmove(depth: 10)

          res

        "w" ->
          {res, _, _} =
            %ChessUCIState{
              engine: white,
              fen: decoded_message["data"],
              multipv: 1
            }
            |> ChessUCI.bestmove(depth: 10)

          res
      end

    res = %{action: "onMove", data: res}
    # %{move: bestmove, cp: cp, percentage: percentage}
    {:reply, :ok, {:text, JSON.encode!(res)}, state}
  end
end
