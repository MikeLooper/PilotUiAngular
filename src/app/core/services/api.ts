import { Injectable, inject } from '@angular/core';
import { DataSourceService } from './data-source';

@Injectable({ providedIn: 'root' })
export class ApiService {
	private readonly dataSourceService = inject(DataSourceService);

	public get baseUrl(): string {
		return this.dataSourceService.activeBaseUrl();
	}

	public buildUrl(path: string): string {
		const normalizedPath = path.startsWith('/') ? path : `/${path}`;
		return `${this.baseUrl}${normalizedPath}`;
	}
}
