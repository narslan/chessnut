import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhiteComponent } from './white/white.component';
import { BlackComponent } from './black/black.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'white', component: WhiteComponent },
  { path: 'black', component: BlackComponent }
];


@NgModule({
  declarations: [
    WhiteComponent,
    BlackComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ]
})
export class PlayerModule { }
