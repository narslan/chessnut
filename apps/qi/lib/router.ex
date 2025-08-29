defmodule Qi.Router do
  use Plug.Router
  use Plug.Debugger
  require Logger

  plug(Plug.Logger)

  plug(:redirect_index)
  plug(:match)

  plug(Plug.Parsers,
    parsers: [:json],
    pass: ["application/json"],
    json_decoder: JSON
  )

  plug(:dispatch)

  get "/_game" do
    conn
    |> WebSockAdapter.upgrade(Qi.UCI.EngineGame, [], timeout: 60_000)
    |> halt()
  end

  get "/_home" do
    conn
    |> WebSockAdapter.upgrade(Qi.EchoServer, [], timeout: 60_000)
    |> halt()
  end

  get "/_pgn" do
    conn
    |> WebSockAdapter.upgrade(Qi.WS.Pgn, [], timeout: 60_000)
    |> halt()
  end

  get "/_ucimultipv" do
    conn
    |> WebSockAdapter.upgrade(Qi.UCI.MultiPV, [], timeout: 60_000)
    |> halt()
  end

  get "/_uci" do
    conn
    |> WebSockAdapter.upgrade(Qi.UCI, [], timeout: 60_000)
    |> halt()
  end

  get "/_analyze" do
    conn
    |> WebSockAdapter.upgrade(Qi.WS.Analyze, [], timeout: 60_000)
    |> halt()
  end

  forward("/dist", to: Qi.Router.StaticResources)
  forward("/assets", to: Qi.Router.AssetResources)

  match _ do
    send_resp(conn, 404, "not found")
  end

  def redirect_index(%Plug.Conn{path_info: path} = conn, _opts) do
    # IO.inspect(path, label: "path")

    case path do
      [] ->
        %{conn | path_info: ["dist", "index.html"]}

      ["assets", file] ->
        %{conn | path_info: ["assets", file]}

      _ ->
        conn
    end
  end
end
