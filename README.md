chessnut
=====
`chessnut` is a very simple and stupid chess web interface to play against chess engines.
 At its core, [binbo](https://github.com/DOBRO/binbo)  runs and interacts with chess engines.
 Moves are transmitted over Websockets using `cowboy`.
 The Web UI embodies the components out of `lichess-org/chessground-examples` . 

#### TODOS: 
1. A better web interface. Using plain `typescript` is nice and fast but it is hard to tidying up the code.
2. There are many things to implement, the possibilities are too many. Thanks to `binbo`. Which feature I want to implement next is matches between engines.
3. See the warning.
### Warning
The web interface doesn't close Websocket connections if you navigate between pages, many dangling websocket connection will be created accordingly.
That is stupid. The reason for that is, navigation and connection instantination are far seperate from each other. I'm looking for a workaround.    

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


