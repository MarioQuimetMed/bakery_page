import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected handleVideoLoaded(video: HTMLVideoElement): void {
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    void video.play();
  }
}
