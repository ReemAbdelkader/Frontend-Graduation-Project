import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AiChatComponent } from './shared/components/ai-chat/ai-chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AiChatComponent],
  template: '<router-outlet /><app-ai-chat />',
  styles: [':host { display: block; }'],
})
export class AppComponent {}
