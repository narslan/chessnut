chessnut
=====
`chessnut` is a very simple Angular web interface to play against chess engines.
 At its core, [binbo](https://github.com/DOBRO/binbo) runs and interacts with chess engines.
 The transmission of moves are handled [cowboy](https://https://github.com/ninenines/cowboy) .
 The Web UI embodies the components out of [lichess-org/chessground-examples](https://github.com/lichess-org/chessground-examples). 

This is a learning tool. Mainly, to practice some `erlang` programming language. 

#### TODOS: 
1. A better web interface. 
2. There are many things to implement out of `binbo`, the possibilities are many. 
Tournaments between engines, a game analyzer. 
3. `chessground` doesn't know anything about en passant rule and pawn promotion. 
I haven't add any lines to handle them. Therefore, those cases, when occur, render the game unplayable.

## Installation
### Build ui
```sh
cd priv/ui
npm install 
npm run build
```

### Run backend 

```sh
export CHESS_ENGINE="/path/to/chess/engine"  # set the path of chess engine
rebar3 get-deps
rebar3 shell    
```    


