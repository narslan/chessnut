defmodule Pgndiv.Repo do
  use Ecto.Repo,
    otp_app: :pgndiv,
    adapter: Ecto.Adapters.Postgres
end
