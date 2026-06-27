import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface GenerateAiImageResult {
  graphicAssetId: string;
  imageUrl: string;
}

export interface GraphicAssetDto {
  id: string;
  imageUrl: string;
  title?: string;
  name?: string;
}

@Injectable({
  providedIn: "root",
})
export class AiImageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/DesignStudio`;

  generateAiImage(prompt: string): Observable<GenerateAiImageResult> {
    return this.http.post<GenerateAiImageResult>(`${this.apiUrl}/generate-image`, { prompt });
  }

  getUserGraphicAssets(): Observable<GraphicAssetDto[]> {
    return this.http.get<GraphicAssetDto[]>(`${this.apiUrl}/graphic-assets`);
  }

  getAdminGraphicAssets(): Observable<GraphicAssetDto[]> {
    return this.http.get<GraphicAssetDto[]>(`${this.apiUrl}/graphic-assets/admin`);
  }
}
