import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface GenerateAiImageResult {
  graphicAssetId: string;
  imageUrl: string;
}

@Injectable({
  providedIn: "root",
})
export class AiImageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/DesignStudio/generate-image`;

  generateAiImage(prompt: string): Observable<GenerateAiImageResult> {
    return this.http.post<GenerateAiImageResult>(this.apiUrl, { prompt });
  }
}
