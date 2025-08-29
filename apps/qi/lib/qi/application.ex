defmodule Qi.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      Qi.Repo,
      {Bandit, plug: Qi.Router, port: 8000}
      # Starts a worker by calling: Qi.Worker.start_link(arg)
      # {Qi.Worker, arg}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Qi.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
