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
    Logger.debug("Analyze gestartet")
    start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    pos = Chessfold.string_to_position(start)
    engine = ChessUCI.start("stockfish")

    fens =
      pgn_moves
      |> String.split(" ", trim: true)
      |> Enum.map(&String.trim_trailing(&1, ","))
      |> Enum.map(&String.trim_trailing(&1, "."))
      |> Enum.scan(pos, fn move, acc ->
        case Chessfold.play(acc, move) do
          {:ok, new_pos} ->
            new_pos

          {:error, reason} ->
            Logger.error("Ungültiger Zug #{move}: #{reason}")
            acc
        end
      end)
      |> Enum.map(&Chessfold.position_to_string/1)

    # Start-FEN vorne anfügen (falls es fehlt)
    fens =
      case fens do
        [^start | _] -> fens
        _ -> [start | fens]
      end

    result =
      Enum.map(fens, fn fen ->
        %{
          fen: fen,
          analysis:
            %ChessUCIState{
              engine: engine,
              fen: fen,
              multipv: 1
            }
            |> ChessUCI.bestmoves(depth: 10)
        }
      end)

    result
    |> Enum.map(fn %{analysis: analysis} ->
      Enum.map(analysis, fn a ->
        cond do
          Map.has_key?(a, "cp") ->
            String.to_integer(a["cp"])

          Map.has_key?(a, "mate") ->
            if String.to_integer(a["mate"]) > 0, do: 9999, else: -9999
        end
      end)
    end)
  end

  def all() do
    Pgndiv.Pgn |> Pgndiv.Repo.all()
  end
end
