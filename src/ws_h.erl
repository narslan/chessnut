-module(ws_h).
-import(lists, [filter/2, map/2, reverse/1]).
-export([init/2]).
-export([websocket_init/1]).
-export([websocket_handle/2]).
-export([websocket_info/2]).
-export([terminate/3]).

-record(state, {
         pid = undefined :: undefined | pid(),
         state = undefined :: undefined | connected | running,
         color = undefined :: undefined | binary()
}).

init(Req, _State) ->
    Opts = #{compress => true},
	#{qs := QueryString} = Req, %% capture the color of the player from request.
	State0 = #state{color = QueryString},
    {cowboy_websocket, Req, State0, Opts}.

start_binbo() ->
	{ok, Pid} = binbo:new_server(),
	EnginePath = os:getenv("CHESS_ENGINE"),
	binbo:new_uci_game(Pid, #{engine_path => EnginePath}),
	binbo:side_to_move(Pid),	
	Pid.

websocket_init(State) ->
	#state{color = Color} = State,   
	Pid = start_binbo(),
	State0 = State#state{pid = Pid},
	case Color of 
		<<"color=black">> -> 
			{_, _, EngineMove} = binbo:uci_play(Pid, #{}),
			erlang:start_timer(1000, self(),  << "{\"message\":\"", EngineMove/binary, "\"}">> );
		<<"color=white">> -> erlang:start_timer(1000, self(), "{\"message\": \"greetings from chessnut\"}")
	end,
	{[], State0}.

%% trim move string "a2a4"  to be able provide as an input for binbo.
trim_quotes(Bin) -> list_to_binary(skip_quote(binary_to_list(Bin))).
skip_quote([$\"|T]) -> skip_quote(T);
skip_quote([T|$\"]) -> skip_quote(T);
skip_quote(X) -> X.

websocket_handle({text, Msg}, State) ->
	#state{pid = Pid }=State,
	{_, _, EngineMove} = binbo:uci_play(Pid, #{}, trim_quotes(Msg)),
	{[{text,   << "{\"message\":\"", EngineMove/binary, "\"}">>}], State};

websocket_handle(_Data, State) ->
	{[], State}.

websocket_info({timeout, _Ref, Msg}, State) ->
    {[{text, Msg}], State};
websocket_info(_Info, State) ->
    {[], State}.

terminate(Reason, Req, #state{pid=Pid}) ->
	Pid ! {terminate, Reason, Req},
	ok.