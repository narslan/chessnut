defmodule Qi.Router.StaticResources do
  use Plug.Builder

  plug(
    Plug.Static,
    at: "/",
    from: {:livesml, "./priv/static/web/dist"}
  )

  plug(:not_found)

  def not_found(conn, _) do
    send_resp(conn, 404, "static resource not found")
  end
end
