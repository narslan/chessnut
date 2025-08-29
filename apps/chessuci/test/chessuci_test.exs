defmodule ChessUCITest do
  use ExUnit.Case

  @tag :skip
  test "find best move initial position" do
    engine = ChessUCI.start()

    {bestmove, _, _} =
      ChessUCI.bestmove(
        %ChessUCIState{
          engine: engine,
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        },
        depth: 10
      )

    ChessUCI.stop(engine)
    assert bestmove == "e2e4"
  end

  @tag :skip
  test "test if multipv returns the equal number of result as multipv" do
    engine = ChessUCI.start()

    bestmoves =
      ChessUCI.bestmoves(
        %ChessUCIState{
          engine: engine,
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          multipv: 4
        },
        depth: 10
      )

    ChessUCI.stop(engine)
    assert length(bestmoves) == 4
  end

  # TODO: mate positions will be considered
  @tag :skip
  test "test if multipv returns the equal number of result as multipv if the position is mate" do
    engine = ChessUCI.start()

    bestmoves =
      ChessUCI.bestmoves(
        %ChessUCIState{
          engine: engine,
          fen: "rnbQ3r/7p/pp4p1/1B2Qp2/4k2P/5N2/PPP2PP1/RNBQK2R b KQ - 0 15",
          multipv: 4
        },
        depth: 20
      )

    IO.inspect(bestmoves, label: "bestmoves")
    ChessUCI.stop(engine)
    assert length(bestmoves) < 4
  end

  test "test debug position" do
    engine = ChessUCI.start("halogen")

    bestmoves =
      ChessUCI.bestmoves(
        %ChessUCIState{
          engine: engine,
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          multipv: 1
        },
        depth: 20
      )

    IO.inspect(bestmoves)
    ChessUCI.stop(engine)
    assert is_list(bestmoves) == true
  end

  @tag :skip
  test "test mate position should not err out" do
    engine = ChessUCI.start("halogen")

    bestmoves =
      ChessUCI.bestmoves(
        %ChessUCIState{
          engine: engine,
          fen: "rnbqk1nr/pp1p1Qpp/2p5/2b1p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4",
          multipv: 4
        },
        depth: 20
      )

    IO.inspect(bestmoves, label: "bestmoves")
    ChessUCI.stop(engine)
    assert length(bestmoves) == 0
  end
end
