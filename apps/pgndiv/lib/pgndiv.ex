defmodule Pgndiv do
  require ChessParser
  require Logger

  def parse(file) do
    {:ok, trees} = ChessParser.load_file(file)

    trees
    |> Enum.map(fn {:tree, tag, elems} ->
      tags = ChessParser.tags_to_game_info(tag)

      moves =
        elems
        |> Enum.filter(&match?({:san, _, _}, &1))
        |> Enum.map(fn {_, _, move} ->
          move
        end)
        |> Enum.join(" ")

      pgn_container = %Pgndiv.Pgn{
        event: tags["Event"],
        site: tags["Site"],
        date: tags["Date"],
        round: tags["Round"],
        white: tags["White"],
        black: tags["Black"],
        result: tags["Result"],
        moves: moves
      }

      # IO.inspect(pgn_container)
      Logger.info("Inserting pgn:")
      Logger.info(pgn_container)
      # Pgndiv.Repo.insert!(pgn_container)
      Logger.info("Inserted pgn:")
    end)
  end

  def analyze(pgn_moves) do
    start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    pos = Chessfold.string_to_position(start)
    engine = ChessUCI.start("stockfish")

    fens =
      pgn_moves
      |> String.split(" ", trim: true)
      |> Enum.scan(pos, fn move, acc ->
        {:ok, acc} = Chessfold.play(acc, move)
        acc
      end)
      |> Enum.map(&Chessfold.position_to_string/1)

    # Start-FEN vorne anfügen (falls es fehlt)
    fens =
      case fens do
        [^start | _] -> fens
        _ -> [start | fens]
      end

    Enum.map(fens, fn fen ->
      %{
        fen: fen,
        analysis:
          %ChessUCIState{
            engine: engine,
            fen: fen,
            multipv: 2
          }
          |> ChessUCI.bestmoves(depth: 20)
      }
    end)
  end

  def all() do
    Pgndiv.Pgn |> Pgndiv.Repo.all()
  end
end
