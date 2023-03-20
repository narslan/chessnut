chessnut
=====
`chessnut` is a very simple and stupid chess web interface to play against chess engines.
 At its core, [binbo](https://github.com/DOBRO/binbo)  runs and interacts with chess engines.
 Moves are transmitted over Websockets using `cowboy`.
 The Web UI embodies the components out of `lichess-org/chessground-examples` . 

#### TODOS: 
1. A better web interface. Chessground examples doesn't fullfill my requirements. 
2. There are many things to implement out of `binbo`, the possibilities are many. Engine tournaments, a demo with pgn. 

### Warning
The web interface doesn't close Websocket connections if you navigate between pages. accordingly many dangling websocket connection will be come into existence .
The reason for that is, navigation and connection instantination are far seperate from each other. 
There are two things to do:
1. I'll disable single page rendering. 
2. I have to introduce a cleanup in `cowboy`'s `terminate/3`  which eventually invokes `binbo:uci_disconnect`.

### Build ui
```sh
cd priv/satranc
npm install 
npm run build
```

### Run backend 

```sh
export CHESS_ENGINE="/path/to/chess/engine"  # set the path of chess engine
rebar3 get-deps
rebar3 shell    
```    


