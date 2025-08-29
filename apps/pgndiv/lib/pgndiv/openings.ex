defmodule Pgndiv.Openings do
  use Ecto.Schema
  # @primary_key false

  schema "openings" do
    field(:eco, :string)
    field(:pgn, :string)
    field(:name, :string)
    field(:fen, :string)
  end
end
