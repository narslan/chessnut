defmodule Qi.MixProject do
  use Mix.Project

  def project do
    [
      app: :qi,
      version: "0.1.0",
      elixir: "~> 1.18",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger],
      mod: {Qi.Application, []}
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:plug, "~> 1.0"},
      {:bandit, "~> 1.0"},
      {:websock_adapter, "~> 0.5"},
      {:merlin, git: "https://git.sr.ht/~narslan/merlin"},
      {:ecto_sql, "~> 3.0"},
      {:postgrex, ">= 0.0.0"},
      {:bcrypt_elixir, "~> 3.0"},
      {:pgndiv, in_umbrella: true},
      {:chessuci, in_umbrella: true}
    ]
  end
end
