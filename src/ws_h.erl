-module(ws_h).
-import(lists, [filter/2, map/2, reverse/1]).
-export([init/2]).
-export([websocket_init/1]).
-export([websocket_handle/2]).
-export([websocket_info/2]).

-record(state, {
         pid = undefined :: undefined | pid(),
         state = undefined :: undefined | connected | running,
         room = undefined :: undefined | string()
}).

init(Req, State) ->
    Opts = #{compress => true},
    {cowboy_websocket, Req, State, Opts}.

start_binbo() ->
	binbo:start(),
	{ok, Pid} = binbo:new_server(),
	EnginePath = "/home/nevroz/go/bin/stockfish",
	binbo:new_uci_game(Pid, #{engine_path => EnginePath}),
	binbo:side_to_move(Pid),	
	Pid.

websocket_init(_State) ->
	Pid = start_binbo(),
	State0 = #state{pid = Pid},
	Pid0 = pid_to_list(Pid),
	Pid1 = list_to_binary(Pid0),
	erlang:start_timer(1000, self(), <<Pid1/binary>>),
	{[], State0}.

trim_quotes(Bin) -> list_to_binary(skip_quote(binary_to_list(Bin))).

skip_quote([$\"|T]) -> skip_quote(T);
skip_quote([T|$\"]) -> skip_quote(T);
skip_quote(X) -> X.

websocket_handle({text, Msg}, State) ->
	#state{pid = Pid }=State,
	{_, _, EngineMove} = binbo:uci_play(Pid, #{}, trim_quotes(Msg)),
	{[{text,   EngineMove}], State};

websocket_handle(_Data, State) ->
	{[], State}.

websocket_info({timeout, _Ref, Msg}, State) ->
    {[{text, Msg}], State};
websocket_info(_Info, State) ->
    {[], State}.
