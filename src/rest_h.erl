%% doc rest handler.
-module(rest_h).

-export([init/2]).
-export([content_types_provided/2]).
-export([init_web_socket/2]).
init(Req, Opts) ->
    {cowboy_rest, Req, Opts}.

content_types_provided(Req, State) ->
    {[
      {<<"application/json">>, init_web_socket}
     ], Req, State}.
init_web_socket(Req, State) ->
    Body = <<"{\"rest\": \"Hello World\" }">>,
    {Body, Req, State}.
