import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { SystemApiFacade } from '../../../api/facades/system-api.facade';
import { ApiClientError } from '../../../core/errors/api-error.model';

interface HomeState {
	readonly connectionToApi: string;
	readonly apiVersion: string;
	readonly apiDeployed: string;
	readonly isLoading: boolean;
	readonly errorMessage: string | null;
}

const initialState: HomeState = {
	connectionToApi: 'Loading...',
	apiVersion: 'Loading...',
	apiDeployed: 'Loading...',
	isLoading: false,
	errorMessage: null,
};

@Injectable({ providedIn: 'root' })
export class HomeFacade {
	private readonly systemApiFacade = inject(SystemApiFacade);

	private readonly state = signal<HomeState>(initialState);

	public readonly vm = computed(() => this.state());

	public constructor() {
		this.reload();
	}

	public reload(): void {
		this.state.update((current) => ({
			...current,
			isLoading: true,
			errorMessage: null,
		}));

		forkJoin({
			health: this.systemApiFacade.getHealthcheck(),
			about: this.systemApiFacade.getAbout(true),
		})
			.pipe(
				catchError((error: unknown) => {
					const message =
						error instanceof ApiClientError
							? error.apiError.message
							: 'Failed to load API status.';

					this.state.update((current) => ({
						...current,
						connectionToApi: 'Unavailable',
						apiVersion: 'Unavailable',
						apiDeployed: 'Unavailable',
						isLoading: false,
						errorMessage: message,
					}));

					return of(null);
				})
			)
			.subscribe((result) => {
				if (!result) {
					return;
				}

				this.state.update((current) => ({
					...current,
					connectionToApi: result.health,
					apiVersion: result.about.apiVersion?.trim() || 'Unknown',
					apiDeployed: result.about.deployDate?.trim() || 'Unknown',
					isLoading: false,
				}));
			});
	}
}
