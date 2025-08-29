import Config

config :pgndiv, ecto_repos: [Pgndiv.Repo]

config :pgndiv, Pgndiv.Repo,
  database: "qi",
  username: "postgres",
  password: "postgres",
  hostname: "localhost"
