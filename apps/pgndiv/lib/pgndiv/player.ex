defmodule Pgndiv.Player do
  use Ecto.Schema

  schema "players" do
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
