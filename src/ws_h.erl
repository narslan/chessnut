-module(ws_h).

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
	binbo:new_game(Pid),	
	Pid.

websocket_init(_State) ->
	Pid = start_binbo(),
	State0 = #state{pid = Pid, state = connected, room = "new room"},
	erlang:start_timer(1000, self(), <<"Hello">>),
	{[], State0}.

websocket_handle({text, Msg}, State) ->
	#state{pid = Pid,  room = Room}=State,
	Pid0 = pid_to_list(Pid),
	Pid1 = list_to_binary(Pid0),
	Room0 = list_to_binary(Room),
	{[{text, << Pid1/binary, Room0/binary, Msg/binary >>}], State};

websocket_handle(_Data, State) ->
	{[], State}.

websocket_info({timeout, _Ref, Msg}, State) ->
    {[{text, Msg}], State};
websocket_info(_Info, State) ->
    {[], State}.
