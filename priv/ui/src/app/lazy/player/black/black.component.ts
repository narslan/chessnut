import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { PlayerService } from '../player.service';


@Component({
  selector: 'app-black',
  templateUrl: './black.component.html',
  styleUrls: ['./black.component.css']
})
export class BlackComponent implements AfterViewInit {

  @ViewChild('myCG') myCG!: ElementRef;
  constructor(private playerService: PlayerService) {}


  ngAfterViewInit() {

    let el = this.myCG.nativeElement as HTMLElement;

    this.playerService.init(el, 'black')

  }
}



