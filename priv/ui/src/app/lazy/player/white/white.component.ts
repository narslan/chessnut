import { AfterViewInit, Component, ElementRef,  OnDestroy,  ViewChild } from '@angular/core';
import { WebSocketSubject } from 'rxjs/webSocket';
import { PlayerService } from '../player.service';


@Component({
  selector: 'app-white',
  templateUrl: './white.component.html',
  styleUrls: ['./white.component.css']
})
export class WhiteComponent implements AfterViewInit, OnDestroy{
  @ViewChild('myCG') myCG!: ElementRef;
  
  
  
  constructor(private playerService: PlayerService) {}

  ngAfterViewInit() {

    let el = this.myCG.nativeElement as HTMLElement;

    this.playerService.init(el, 'white')

  }

  ngOnDestroy() {
      this.playerService.close();
  }
}
