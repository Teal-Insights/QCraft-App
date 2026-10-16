/** Dataset-specific reference identities. Unknown vintages have no reference. */
import references from './data/reference-sources.json';

export type ReferenceDataset = 'demography' | 'macrofiscal' | 'productivity' | 'rigidity';

export interface ReferenceSource {
  recordVintage: string;
  source: string;
}

const REGISTRY: Record<string, Partial<Record<ReferenceDataset, ReferenceSource>>> = references;

export const referenceSource = (vintage: string, dataset: ReferenceDataset) =>
  REGISTRY[vintage]?.[dataset];

export const referenceRecord = (vintage: string, dataset: ReferenceDataset) =>
  referenceSource(vintage, dataset)?.recordVintage;

export const referenceLabel = (vintage: string, dataset: ReferenceDataset): string =>
  referenceSource(vintage, dataset)?.source ?? 'No bundled reference for this data vintage.';
