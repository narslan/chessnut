defmodule ChessUCIState do
  @moduledoc false

  defstruct(
    engine: nil,
    fen: nil,
    moves: [],
    bestmove: nil,
    ponder: nil,
    ponder_mode: true,
    multipv: 1
  )
end
