defmodule Mix.Tasks.CreateOpenings do
  @moduledoc "Fill up the database with ECO(Encyclopedia of Chess Openings) values"
  @shortdoc "ECO values"

  use Mix.Task

  @impl Mix.Task
  def run(_args) do
    Mix.Task.run("app.start", [])

    project_dir = File.cwd!()

    eco_path = "priv/repo/migrations/eco.json"
    eco_file = "#{project_dir}/#{eco_path}"

    File.read!(eco_file)
    |> JSON.decode!()
    |> Enum.each(fn j ->
      opening = %Pgndiv.Openings{
        eco: j["eco"],
        pgn: j["pgn"],
        name: j["name"],
        fen: j["fen"]
      }

      Pgndiv.Repo.insert!(opening)
    end)

    # IO.inspect(eco_json, label: "eco ")
  end
end
