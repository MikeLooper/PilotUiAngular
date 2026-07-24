import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
	BehaviorSubject,
	catchError,
	debounceTime,
	distinctUntilChanged,
	of,
	switchMap,
	tap,
} from 'rxjs';
import { CategoriesApiFacade } from '../../../api/facades/categories-api.facade';
import { ApiClientError } from '../../../core/errors/api-error.model';
import { CategoryListItem } from '../models/category-list-item';

export type SortDirection = 'asc' | 'desc';

interface HomeState {
	readonly items: readonly CategoryListItem[];
	readonly searchTerm: string;
	readonly page: number;
	readonly pageSize: number;
	readonly sortDirection: SortDirection;
	readonly isLoading: boolean;
	readonly errorMessage: string | null;
}

const initialState: HomeState = {
	items: [],
	searchTerm: '',
	page: 1,
	pageSize: 8,
	sortDirection: 'asc',
	isLoading: false,
	errorMessage: null,
};

@Injectable({ providedIn: 'root' })
export class HomeFacade {
	private readonly categoriesApiFacade = inject(CategoriesApiFacade);
	private readonly destroyRef = inject(DestroyRef);

	private readonly state = signal<HomeState>(initialState);
	private readonly searchTermInput$ = new BehaviorSubject<string>('');

	public readonly vm = computed(() => {
		const state = this.state();
		const normalizedSearch = state.searchTerm.trim().toLowerCase();

		const filteredItems = [...state.items]
			.filter((item) => {
				if (!normalizedSearch) {
					return true;
				}

				return (
					item.name.toLowerCase().includes(normalizedSearch) ||
					item.description.toLowerCase().includes(normalizedSearch)
				);
			})
			.sort((a, b) => {
				const comparison = a.name.localeCompare(b.name);
				return state.sortDirection === 'asc' ? comparison : comparison * -1;
			});

		const totalItems = filteredItems.length;
		const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
		const currentPage = Math.min(state.page, totalPages);
		const startIndex = (currentPage - 1) * state.pageSize;
		const pagedItems = filteredItems.slice(startIndex, startIndex + state.pageSize);

		return {
			...state,
			page: currentPage,
			totalItems,
			totalPages,
			pagedItems,
			hasEmptyState: !state.isLoading && !state.errorMessage && totalItems === 0,
		};
	});

	public constructor() {
		this.searchTermInput$
			.pipe(
				debounceTime(300),
				distinctUntilChanged(),
				tap((term) => {
					this.state.update((current) => ({
						...current,
						searchTerm: term,
						page: 1,
						isLoading: true,
						errorMessage: null,
					}));
				}),
				switchMap((term) =>
					this.categoriesApiFacade.getAll(term.length > 0).pipe(
						catchError((error: unknown) => {
							const message =
								error instanceof ApiClientError
									? error.apiError.message
									: 'Failed to load categories.';

							this.state.update((current) => ({
								...current,
								isLoading: false,
								errorMessage: message,
							}));

							return of([] as readonly CategoryListItem[]);
						})
					)
				),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe((items) => {
				this.state.update((current) => ({
					...current,
					items,
					isLoading: false,
				}));
			});

		this.reload();
	}

	public onSearchTermChanged(term: string): void {
		this.searchTermInput$.next(term);
	}

	public reload(): void {
		this.searchTermInput$.next(this.state().searchTerm);
	}

	public toggleSortDirection(): void {
		this.state.update((current) => ({
			...current,
			sortDirection: current.sortDirection === 'asc' ? 'desc' : 'asc',
			page: 1,
		}));
	}

	public goToPage(page: number): void {
		this.state.update((current) => ({
			...current,
			page: Math.max(1, page),
		}));
	}
}
