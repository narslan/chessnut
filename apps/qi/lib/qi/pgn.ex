defmodule Qi.Pgn do
  use Ecto.Schema

  schema "pgns" do
    field(:event, :string)
    field(:site, :string)
    field(:date, :string)
    field(:round, :string)
    field(:white, :string)
    field(:black, :string)
    field(:moves, :string)
    field(:result, :string)
  end

  # ---- Hilfsfunktionen ----
  # Ohne Züge (Übersichtsliste)
  def to_summary(%__MODULE__{} = pgn) do
    %{
      id: pgn.id,
      event: pgn.event,
      site: pgn.site,
      date: pgn.date,
      round: pgn.round,
      white: pgn.white,
      black: pgn.black,
      result: pgn.result
    }
  end

  # Mit Zügen (Detailansicht)
  def to_detail(%__MODULE__{} = pgn) do
    %{
      id: pgn.id,
      event: pgn.event,
      site: pgn.site,
      date: pgn.date,
      round: pgn.round,
      white: pgn.white,
      black: pgn.black,
      result: pgn.result,
      moves: pgn.moves
    }
  end
end
