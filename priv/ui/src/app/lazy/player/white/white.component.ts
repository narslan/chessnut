import { AfterViewInit, Component, ElementRef,  ViewChild } from '@angular/core';
import { PlayerService } from '../player.service';


@Component({
  selector: 'app-white',
  templateUrl: './white.component.html',
  styleUrls: ['./white.component.css']
})
export class WhiteComponent implements AfterViewInit{
  @ViewChild('myCG') myCG!: ElementRef;

  constructor(private playerService: PlayerService) {}

  ngAfterViewInit() {

    let el = this.myCG.nativeElement as HTMLElement;

    this.playerService.init(el, 'white')

  }

}
