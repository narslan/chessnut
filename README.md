chessnut
=====
 
### Updated 15-05-2023 
`chessnut` is a web interface for playing against chess engines. It is interacting with
superb [binbo](https://github.com/DOBRO/binbo) beneath the surface.
`chessnut` was previously written in `Angular`, and used [lichess-org/chessground-examples](https://github.com/lichess-org/chessground-examples) as a board. 
But after a little investigation, I decided to switch over other libraries.
`chessnut` doesn't use `Angular` anymore but `lit` and `chess-board` web component.     

This was a learning tool. Mainly, to practice `erlang` programming language. 
It turns out that the idea has more fun in it than predicted.

#### TODOS: 
~~1. A better web interface.~~ Partly done  
2. There are many things to implement out of `binbo`, the possibilities are many. 
Tournaments between engines, a game analyzer.   
3. Custom `pgn` and `fen` as input.  
~~3. `chessground` doesn't know anything about en passant rule and pawn promotion.~~
~~I haven't add anything to handle them. Therefore, those cases, when occur, render the game unplayable.~~  
4. Changing board styling.  
5. Get more `erlang` into play, like saving games in a memory somewhere.

## Installation
### Build the UI
```sh
cd priv/ui
npm install 
npm run dev
```

### Run the backend 

```sh
export CHESS_ENGINE="/path/to/chess/engine"  # set the path of chess engine
rebar3 get-deps
rebar3 shell    
```    

### Go to:
```
http://localhost:5173/
```
Make moves. And enjoy [binbo](https://github.com/DOBRO/binbo).  
![chessnut_screen](https://github.com/narslan/chessnut/assets/612951/66091dc6-aa13-4af3-80c5-2b18f7c1f508)
