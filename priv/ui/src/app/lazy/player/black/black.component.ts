import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { PlayerService } from '../player.service';


@Component({
  selector: 'app-black',
  templateUrl: './black.component.html',
  styleUrls: ['./black.component.css']
})
export class BlackComponent implements AfterViewInit, OnDestroy {

  @ViewChild('myCG') myCG!: ElementRef;
  constructor(private playerService: PlayerService) {}


  ngAfterViewInit() {

    let el = this.myCG.nativeElement as HTMLElement;

    this.playerService.init(el, 'black')

  }

  ngOnDestroy() {
  
    
    this.playerService.close();
  }
}



