import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faGear, faHashtag, faHeadphones, faMicrophone, faVolumeHigh, faBell, faThumbtack, faUsers, faGift, faFaceSmile, faSignal, faPhoneSlash, faMicrophoneSlash, faPlus, faPen, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faGear,
      faHashtag,
      faHeadphones,
      faMicrophone,
      faVolumeHigh,
      faBell,
      faThumbtack,
      faUsers,
      faGift,
      faFaceSmile,
      faSignal,
      faPhoneSlash,
      faMicrophoneSlash,
      faPlus,
      faPen,
      faRightFromBracket
    );
  }
}
