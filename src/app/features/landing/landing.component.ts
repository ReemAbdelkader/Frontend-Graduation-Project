import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  heroImage,
  logoImage,
  garmentImages,
} from '../../core/data/wearly-data';
import { AppNavComponent } from '../../shared/components/app-nav/app-nav.component';

interface Feature {
  title: string;
  body: string;
  icon: 'wand' | 'palette' | 'shopping' | 'users' | 'chart' | 'sparkles';
}

interface Testimonial {
  name: string;
  role: string;
  body: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, AppNavComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  readonly heroImg = heroImage;
  readonly logo = logoImage;
  readonly templateGeometric = garmentImages.templateGeometric;
  readonly hoodieCream = garmentImages.hoodieCream;
  readonly sneakers = garmentImages.sneakers;

  readonly features: Feature[] = [
    {
      title: 'AI Designer Studio',
      body: 'Type a vision. Watch it appear on a 3D mannequin in seconds. Refine, recolor, and finalize without ever opening Photoshop.',
      icon: 'wand',
    },
    {
      title: 'Curated Templates',
      body: 'Hundreds of editorial-grade prints — botanical, geometric, monochrome — ready to customize for your next drop.',
      icon: 'palette',
    },
    {
      title: 'Made & Shipped',
      body: 'Premium garments printed on demand and shipped worldwide in three days. No minimums. No inventory.',
      icon: 'shopping',
    },
    {
      title: 'A Real Community',
      body: 'Publish your designs to the Atelier feed, get rated, and let other creators remix your work.',
      icon: 'users',
    },
    {
      title: 'Creator Analytics',
      body: 'AI-generated reports on what\'s selling, who\'s buying, and what to make next — written in plain English.',
      icon: 'chart',
    },
    {
      title: 'Your Style Profile',
      body: 'Atelier learns your taste from day one and only shows you things you\'d actually wear.',
      icon: 'sparkles',
    },
  ];

  readonly testimonials: Testimonial[] = [
    {
      name: 'Maya Okafor',
      role: 'Independent designer · Lagos',
      body: 'I launched a 6-piece capsule from my couch. Atelier handled production, payments and shipping — I just designed.',
    },
    {
      name: 'Theo Wren',
      role: 'Stylist · Berlin',
      body: 'The AI gets my taste. Every recommendation feels like it came from my best-dressed friend.',
    },
    {
      name: 'Aiko Tanaka',
      role: 'Creator · Tokyo',
      body: 'Atelier\'s community is the first place online I\'ve felt seen as a designer, not just a customer.',
    },
  ];

  getInitials(name: string): string {
    return name.split(' ').map((n: string) => n[0]).join('');
  }
}
