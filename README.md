chessnut
=====
`chessnut` is a very simple `Angular` web interface for playing against chess engines.
 At its core, [binbo](https://github.com/DOBRO/binbo) runs and interacts with the chess engines.
 The transmission of moves between client and backend is handled by [cowboy](https://https://github.com/ninenines/cowboy) over Websockets.
 The Web UI embodies the components from [lichess-org/chessground-examples](https://github.com/lichess-org/chessground-examples). 

This was a learning tool. Mainly, to practice `erlang` programming language. 
It turns out that the idea has more fun in it than predicted.

#### TODOS: 
1. A better web interface. 
2. There are many things to implement out of `binbo`, the possibilities are many. 
Tournaments between engines, a game analyzer. 
3. `chessground` doesn't know anything about en passant rule and pawn promotion. 
I haven't add anything to handle them. Therefore, those cases, when occur, render the game unplayable.

## Installation
### Build the UI
```sh
cd priv/ui
npm install 
npm run build
```

### Run the backend 

```sh
export CHESS_ENGINE="/path/to/chess/engine"  # set the path of chess engine
rebar3 get-deps
rebar3 shell    
```    

### Go to:
```
http://localhost:8080/
```

![chessnut](https://user-images.githubusercontent.com/612951/226485551-3776a344-7a1e-43ed-8e6c-812ebe8e58d2.png)
