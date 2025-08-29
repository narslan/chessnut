defmodule Pgndiv.Repo.Migrations.AddOpeningsTable do
  use Ecto.Migration

  def change do

    create table(:openings) do
      add :eco, :string
      add :pgn, :string
      add :name, :string
     add :fen, :string
   end
 end

end
