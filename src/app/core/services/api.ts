import { Injectable, inject } from '@angular/core';
import { APP_ENV } from '../config/app-config';

@Injectable({ providedIn: 'root' })
export class ApiService {
	private readonly env = inject(APP_ENV);

	public get baseUrl(): string {
		return this.env.apiBaseUrl;
	}

	public buildUrl(path: string): string {
		const normalizedPath = path.startsWith('/') ? path : `/${path}`;
		return `${this.baseUrl}${normalizedPath}`;
	}
}
