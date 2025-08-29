defmodule Qi.Repo do
  use Ecto.Repo,
    otp_app: :qi,
    adapter: Ecto.Adapters.Postgres
end
