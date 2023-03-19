chessnut
=====
`chessnut` is a very simple and stupid chess web interface to play against chess engines.
 
 At backend, [binbo](https://github.com/DOBRO/binbo) interacts with chess engines.
 Moves are transmitted over Websockets using `cowboy`.
 The Web UI embodies the components out of lichess-org/chessground-examples . 

### Warning
You can play against an engine. It is fun (or not). 
Playing engine is the only functionality yet.
  
But since the interface doesn't close Websocket connection if you navigate between pages, many dangling websocket connection will be created accordingly.
That is the stupid part. The reason for that is in the Web UI, navigation and connection instantination are seperate.     


### Build ui
```sh
cd priv/satranc
npm install 
npm run build
```
### Build backend

```sh
rebar3 get-deps
rebar3 shell    
```    
