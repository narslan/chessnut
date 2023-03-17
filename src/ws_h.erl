-module(ws_h).

-export([init/2]).
-export([websocket_init/1]).
-export([websocket_handle/2]).
-export([websocket_info/2]).

init(Req, Opts) ->
	{cowboy_websocket, Req, Opts}.

start_binbo() ->
	binbo:start(),
	{ok, Pid} = binbo:new_server(),
	binbo:new_game(Pid),
	Pid.

websocket_init(State) ->
	start_binbo(),	
	erlang:start_timer(1000, self(), <<"Hello">>),
	{[], State}.

websocket_handle({text, Msg}, State) ->
	io:format("state ~s ~n", State),
	{[{text, << "That's what she said! ", Msg/binary >>}], State};
websocket_handle(_Data, State) ->
	{[], State}.

websocket_info({timeout, _Ref, Msg}, State) ->
    {[{text, Msg}], State};
websocket_info(_Info, State) ->
    {[], State}.
