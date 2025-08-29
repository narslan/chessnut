defmodule Qi.Router.AssetResources do
  use Plug.Builder

  plug(
    Plug.Static,
    at: "/",
    from: {:livesml, "./priv/static/web/assets"}
  )

  plug(:not_found)

  def not_found(conn, _) do
    send_resp(conn, 404, "assets not found")
  end
end
