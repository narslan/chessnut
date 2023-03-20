import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './static/pagenotfound/pagenotfound.component';

const routes: Routes = [
  {
    path: 'player',
    loadChildren: () => import('./lazy/player/player.module').then(m => m.PlayerModule)
  },
  { path: '',   redirectTo: '/player/white', pathMatch: 'full' }, 
  { path: '**', component: PageNotFoundComponent }, 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
