import Config

config :qi, ecto_repos: [Qi.Repo]

config :qi, Qi.Repo,
  database: "qi",
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  pool_size: 10

config :pgndiv, Pgndiv.Repo,
  database: "qi",
  username: "postgres",
  password: "postgres",
  hostname: "localhost"
