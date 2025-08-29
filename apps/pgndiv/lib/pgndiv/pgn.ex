defmodule Pgndiv.Pgn do
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
end
