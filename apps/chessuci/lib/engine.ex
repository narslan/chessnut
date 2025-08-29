defmodule Engine do
  use GenServer

  require System

  defstruct port: nil,
            options: [],
            header: nil

  @max_time :infinity

  def start_link(engine_path), do: GenServer.start_link(__MODULE__, [engine_path])

  def quit(pid), do: GenServer.cast(pid, :quit)

  def get_header(pid), do: GenServer.call(pid, :get_header)

  def get_options(pid), do: GenServer.call(pid, :get_options)

  def get_info(pid), do: GenServer.call(pid, :get_info)

  def is_ready(pid), do: GenServer.call(pid, :isready)

  def set_option(pid, name), do: GenServer.call(pid, "setoption name #{name}")

  def set_option(pid, name, value),
    do: GenServer.call(pid, "setoption name #{name} value #{value}")

  def uci_new_game(pid), do: GenServer.call(pid, "ucinewgame")

  def position(pid, :startfen), do: GenServer.call(pid, "position startpos")

  def position(pid, fen), do: GenServer.call(pid, "position fen #{fen}")

  def position(pid, fen, moves) when is_list(moves) do
    moves_string = Enum.join(moves, " ")
    position(pid, fen, moves_string)
  end

  def go(pid, options \\ []), do: GenServer.call(pid, {:go, options}, @max_time)

  def stop(pid), do: GenServer.call(pid, "stop")

  ###############################
  # SERVER CALLBACKS
  ###############################

  @impl true
  def init(args) do
    Process.flag(:trap_exit, true)
    {:ok, %Engine{}, {:continue, {:init_state, args}}}
  end

  @impl true
  def handle_continue({:init_state, args}, state) when is_list(args) do
    handle_continue({:init_state, %{exec_name: hd(args)}}, state)
  end

  def handle_continue({:init_state, args}, state) when is_map(args) do
    with exec_name <- Map.get(args, :exec_name),
         true <- File.exists?(System.find_executable(exec_name)),
         port <- Port.open({:spawn, exec_name}, [{:line, 4096}, :binary, :use_stdio]),
         {header, options} <- initialize_uci(port) do
      {:noreply, %{state | port: port, header: header, options: options}}
    else
      _ -> {:stop, "Bad engine initialization"}
    end
  end

  defp send_command(port, command) do
    send(port, {self(), {:command, command <> "\n"}})
  end

  # CALL
  ###############################

  @impl true
  def handle_call(:get_header, _from, %Engine{header: header} = state) do
    {:reply, header, state}
  end

  @impl true
  def handle_call(:get_options, _from, %Engine{options: options} = state) do
    {:reply, options, state}
  end

  @impl true
  def handle_call(:get_info, _from, %Engine{port: port} = state) do
    {:reply, Port.info(port), state}
  end

  @impl true
  def handle_call(:isready, _from, %Engine{port: port} = state) do
    send_command(port, "isready")

    receive do
      {^port, {:data, {:eol, "readyok"}}} ->
        {:reply, :readyok, state}
    after
      10_000 ->
        {:stop, "engine timeout", :timeout, state}
    end
  end

  @impl true
  def handle_call({:go, options}, _from, %Engine{port: port} = state) do
    command = build_go_option_line(options)
    send_command(port, command)

    case go_loop(port, []) do
      :timeout -> {:stop, "engine unresponsive", state}
      data -> {:reply, data, state}
    end
  end

  @impl true
  def handle_call(command, _from, %Engine{port: port} = state) when is_binary(command) do
    send_command(port, command)
    {:reply, :ok, state}
  end

  # CAST
  ###############################

  @impl true
  def handle_cast(command, %Engine{port: port} = state) when is_binary(command) do
    send_command(port, command)
    {:noreply, state}
  end

  @impl true
  def handle_cast(:quit, %Engine{port: port} = state) do
    send_command(port, "quit")
    Port.close(port)
    {:stop, :normal, state}
  end

  defp initialize_uci(port) do
    header =
      receive do
        {^port, {:data, {:eol, data}}} -> data
      after
        1_000 -> :none
      end

    # order is important!
    send_command(port, "uci")
    options = options_loop(port, [])

    {header, options}
  end

  defp options_loop(port, acc) do
    receive do
      {^port, {:data, {:eol, "uciok"}}} ->
        acc

      {^port, {:data, {:eol, option}}} ->
        options_loop(port, [option | acc])
    after
      2_000 ->
        :timeout
    end
  end

  defp go_loop(port, acc) do
    receive do
      {^port, {:data, {:eol, "bestmove " <> _rest = line}}} ->
        [line | acc]

      {^port, {:data, {:eol, data}}} ->
        # date_time = DateTime.utc_now()
        # Logger.debug(fn -> "#{date_time} #{inspect(data)}" end)
        go_loop(port, [data | acc])
    after
      60_000 ->
        :timeout
    end
  end

  defp build_go_option_line(options) do
    possible_options = ~w(
      searchmoves ponder wtime btime winc binc
      movestogo depth nodes mate movetime infinite
    )a

    options
    |> Enum.reduce("go", fn {k, _v} = option, acc ->
      if Enum.member?(possible_options, k) do
        case option do
          {_, :undefined} -> acc
          {:infinite, _value} -> acc <> " infinite"
          {:ponder, value} -> acc <> " ponder #{value}"
          {key, value} when is_list(value) -> acc <> " #{key} #{Enum.join(value, " ")}"
          {key, value} -> acc <> " #{key} #{value}"
        end
      else
        acc
      end
    end)
  end
end
