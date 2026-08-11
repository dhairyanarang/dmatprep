/**
 * Every official source this hub draws on.
 *
 * Nothing in the reference content may cite anything outside this list. Third
 * party dMAT guides are excluded on purpose: several circulating ones contain
 * wrong item counts and incomplete topic lists.
 */

export type SourceId =
  | 'gam-pdf'
  | 'dmat-home'
  | 'dmat-india'
  | 'dmat-structure'
  | 'dmat-terms'
  | 'dmat-preparation'
  | 'aps-dmat'
  | 'aps-fields'

export type Source = {
  id: SourceId
  title: string
  publisher: 'g.a.s.t.' | 'APS India'
  url: string
  /** Version/as-at date where the document carries one. */
  asAt?: string
  note?: string
}

export const SOURCES: Record<SourceId, Source> = {
  'gam-pdf': {
    id: 'gam-pdf',
    title: 'dMAT — Preparatory Materials for Test Takers, General Academic Module',
    publisher: 'g.a.s.t.',
    url: 'https://www.d-mat.de/wp-content/uploads/2026/08/260804_dMAT_General-Academic-Module_Preparatoy-Materials_EN.pdf',
    asAt: '4 August 2026',
    note: 'The single most detailed official source on the Core Module task types. g.a.s.t. re-dates this file when it is updated, so the URL changes — this is the version everything here was checked against.',
  },
  'dmat-home': {
    id: 'dmat-home',
    title: 'dMAT for graduate students in India',
    publisher: 'g.a.s.t.',
    url: 'https://www.d-mat.de/en/',
  },
  'dmat-india': {
    id: 'dmat-india',
    title: 'dMAT for graduate students in India (APS verification process)',
    publisher: 'g.a.s.t.',
    url: 'https://www.d-mat.de/en/dmat-in-india/',
  },
  'dmat-structure': {
    id: 'dmat-structure',
    title: 'This is how the dMAT is structured',
    publisher: 'g.a.s.t.',
    url: 'https://www.d-mat.de/en/this-is-how-the-dmat-is-structured/',
  },
  'dmat-terms': {
    id: 'dmat-terms',
    title: 'Terms & Conditions',
    publisher: 'g.a.s.t.',
    url: 'https://www.d-mat.de/en/terms-conditions/',
  },
  'dmat-preparation': {
    id: 'dmat-preparation',
    title: 'Preparation for the exam',
    publisher: 'g.a.s.t.',
    url: 'https://www.d-mat.de/en/preparation-for-the-exam/',
  },
  'aps-dmat': {
    id: 'aps-dmat',
    title: 'dMAT — FAQ for Master’s applicants',
    publisher: 'APS India',
    url: 'https://aps-india.de/dmat/',
  },
  'aps-fields': {
    id: 'aps-fields',
    title: 'dMAT India — List of Affected Previous Degree Fields',
    publisher: 'APS India',
    url: 'https://aps-india.de/wp-content/uploads/2026/06/dMAT_India_Affected_Fields_List.pdf',
    asAt: 'Version 1.0, 29 June 2026',
  },
}
