import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
	public info(message: string, details?: unknown): void {
		console.info(message, details);
	}

	public warn(message: string, details?: unknown): void {
		console.warn(message, details);
	}

	public error(message: string, details?: unknown): void {
		console.error(message, details);
	}
}
