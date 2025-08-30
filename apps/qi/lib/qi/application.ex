defmodule Qi.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      Qi.Repo,
      {Bandit, plug: Qi.Router, port: 8000},
      Qi.Analyzer
    ]

    opts = [strategy: :one_for_one, name: Qi.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
