defmodule Pgndiv.Repo.Migrations.CreatePgn do
  use Ecto.Migration

  def change do
    create table(:pgns) do
      add :event, :string
      add :site, :string
      add :date, :string
      add :round, :string
      add :white, :string
      add :black, :string
      add :moves, :text
      add :result, :string
   end
  end
  
  # def down do
  #   drop table("pgns")
  #   flush()
  # end
end
