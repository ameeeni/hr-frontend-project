// core/services/chat.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {  ChatResponse } from '../models/chatResponse.model'
import {  ChatRequest } from '../models/chatRequest.model'

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrls.chat;

  ask(message: string): Observable<ChatResponse> {
    const payload: ChatRequest = { message };
    return this.http.post<ChatResponse>(this.baseUrl, payload);
  }
}
