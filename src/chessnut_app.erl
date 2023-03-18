%%%-------------------------------------------------------------------
%% @doc chessnut public API
%% @end
%%%-------------------------------------------------------------------

-module(chessnut_app).

-behaviour(application).

-export([start/2, stop/1]).

start(_Type, _Args) ->
	Dispatch = cowboy_router:compile([
		{'_', [
			{"/", cowboy_static, {priv_file, chessnut, "satranc/index.html"}},
			{"/websocket", ws_h, []},
			{"/assets/[...]", cowboy_static, {priv_dir, chessnut, "satranc/assets"}},
		    {"/dist/[...]", cowboy_static, {priv_dir, chessnut, "satranc/dist"}},
		    {"/rest", rest_h, []}
		]}
	]),
	{ok, _} = cowboy:start_clear(http, [{port, 8080}], #{
		env => #{dispatch => Dispatch},
		logger => ?MODULE
	}),
	chessnut_sup:start_link().

stop(_State) ->
    ok = cowboy:stop_listener(http).

%% internal functions
