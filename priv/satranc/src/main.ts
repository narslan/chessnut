import { h, init, VNode, classModule, attributesModule, eventListenersModule } from 'snabbdom';
import { Api } from 'chessground/api';
import page from 'page';
import { Unit, list } from './units/unit';

export function run(element: Element) {
  const patch = init([classModule, attributesModule, eventListenersModule]);

  let unit: Unit, cg: Api, vnode: VNode, webSocket: WebSocket;

  function redraw() {
    vnode = patch(vnode || element, render());
  }

  function runUnit(vnode: VNode) {
    const el = vnode.elm as HTMLElement;
    el.className = 'cg-wrap';

    webSocket = new WebSocket(`ws://localhost:8080/websocket?color=${unit.orientation}`);
    cg = unit.run(el, webSocket);

  }

  function render() {
    return h('div#chessground-examples', [
      h(
        'menu',
        list.map((ex, id) => {
          return h(
            'a',
            {
              class: {
                active: unit.name === ex.name,
              },
              on: {
                click: () => {
                  page(`/${id}`);
                 }
              },
            },
            ex.name
          );
        })
      ),
      h('section.blue.merida', [
        h('div.cg-wrap', {
          hook: {
            insert: runUnit,
            postpatch: runUnit,
          },
        }),
        h('p', unit.name),
      ]),
      h('control', [
        h(
          'button',
          {
            on: {
              click() {
                cg.toggleOrientation();
              },
            },
          },
          'Toggle orientation'
        ),
      ]),
    ]);
  }

  page({ click: false, popstate: false, dispatch: true, hashbang: true });
  page('/:id', ctx => {
    unit = list[parseInt(ctx.params.id) || 0];
    redraw();
  });
  page(location.hash.slice(2) || '/0');
}