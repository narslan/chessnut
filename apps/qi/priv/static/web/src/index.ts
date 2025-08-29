import { Route, Router } from '@vaadin/router';
import './main-layout';

const routes: Route[] = [
  {
    path: '/',
    component: 'main-layout',
    children: [
      { path: '', redirect: '/home' },

      {
        path: 'home',
        component: 'home-element',
        action: async () => {
          await import('./views/home');
        },
      },

      {
        path: 'pgn',
        component: 'pgn-element', // Liste + WS
        action: async () => {
          await import('./views/pgn-element');
        },
      },

      {
        path: 'pgn/:id',
        component: 'pgn-view',    // Detail-Ansicht
        action: async () => {
          await import('./views/pgn-view');
        },
      },
    ],
  },
];
const outlet = document.getElementById('outlet');
export const router = new Router(outlet!);
router.setRoutes(routes);