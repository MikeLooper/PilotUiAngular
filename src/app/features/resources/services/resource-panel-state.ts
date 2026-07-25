export interface ResourcePanelState {
  readonly listResult: unknown[];
  readonly itemResult: unknown | null;
  readonly mutationResult: unknown | null;
  readonly error: string | null;
  readonly loading: boolean;
}

export const initialResourcePanelState: ResourcePanelState = {
  listResult: [],
  itemResult: null,
  mutationResult: null,
  error: null,
  loading: false,
};
