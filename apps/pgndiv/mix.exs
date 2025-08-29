defmodule Pgndiv.MixProject do
  use Mix.Project

  def project do
    [
      app: :pgndiv,
      version: "0.1.0",
      elixir: "~> 1.18.4",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      escript: [main_module: Pgndiv.CLI]
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger],
      mod: {Pgndiv.Application, []}
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:chess_parser, github: "kokolegorille/chess_parser"},
      {:chessfold, github: "narslan/chessfold"},
      {:ecto_sql, "~> 3.13.2"},
      {:postgrex, ">= 0.0.0"},
      {:chessuci, in_umbrella: true}
    ]
  end
end
