import { PageShell } from '@/components/layout/page-shell'
import {
  ChipGrid,
  DaySchedule,
  Section,
  Stat,
  StatGrid,
  type Segment,
} from '@/components/exam/visuals'
import { SECTION_ICON } from '@/lib/nav'
import { SECTIONS, type SectionId } from '@/lib/sections'

export const metadata = { title: 'Format & structure' }

const SCHEDULE: Segment[] = [
  { label: 'Figure Sequences', minutes: 25, tone: 'figures' },
  { label: 'Mathematical Equations', minutes: 25, tone: 'equations' },
  { label: 'Latin Squares', minutes: 25, tone: 'latin' },
  { label: 'Break', minutes: 30, tone: 'break', note: 'Between the two modules.' },
  {
    label: 'General Academic Module',
    minutes: 90,
    tone: 'subject',
    note: 'Each task pairs an academic input text with related questions.',
  },
]

// The noun each subtest's own instructions use for its 20 items: "20 series of
// matrices", "20 systems of equations", "20 tasks" (GAM PDF pp. 8, 18, 25).
// 75 seconds is 25 min ÷ 20, an average — no per-item limit is published.
const UNIT: Record<SectionId, string> = {
  'figure-sequences': 'series',
  'mathematical-equations': 'systems',
  'latin-squares': 'tasks',
}

export default function ExamFormatPage() {
  return (
    <PageShell
      description="Two modules, four sittings, 195 minutes of scheduled time."
      wide
    >
      <div className="space-y-10">
        <StatGrid>
          <Stat value="195" unit="min" label="Total scheduled time, including the break" />
          <Stat value="2" label="Modules — Core, then Subject" />
          <Stat value="60" label="Core Module items, across three subtests" />
          <Stat value="1" label="Answer selected per question — single-choice throughout" />
        </StatGrid>

        <Section
          title="The exam day, to scale"
          description="The subject module is longer than the entire Core Module and its break combined."
        >
          <DaySchedule segments={SCHEDULE} />
        </Section>

        <Section
          title="Core Module"
          description="Three subtests of general cognitive ability, sat back to back. Each runs 25 minutes for 20 items."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {SECTIONS.map((section) => (
              <div key={section.id} className="border-border bg-card rounded-2xl border p-5">
                <div className="flex items-center gap-2">
                  <SectionIcon sectionId={section.id} />
                  <h3 className="text-sm font-medium">{section.title}</h3>
                </div>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {section.oneLiner}
                </p>
                <p className="text-muted-foreground mt-4 text-xs tabular-nums">
                  25 min · 20 {UNIT[section.id]} · 75 sec average
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Subject Module — General Academic"
          description="Ninety minutes in total. Each task pairs an academic input text with related questions."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat value="90" unit="min" label="For the whole subject module" />
            <Stat value="4" label="Answer options per question" />
            <Stat value="1" label="Correct answer per question" />
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Inputs may include figures, tables or formulas. Topics span:
          </p>
          <ChipGrid
            label="Subject module topics"
            items={[
              'Mathematics',
              'Computational sciences',
              'Natural sciences',
              'Engineering',
              'Business administration',
              'Economics',
              'Social sciences',
              'Humanities',
            ]}
          />
        </Section>

        <Section title="Two things worth knowing">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border-warning/35 bg-warning-tint/50 rounded-2xl border p-4">
              <p className="text-sm font-medium">The official sources disagree on duration</p>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                The preparatory materials say “about three hours with a break of 30 minutes”;
                d-mat.de says “three and a half hours”. The 195 minutes computed from the published
                per-part timings is the figure to plan around.
              </p>
            </div>

            <div className="border-border bg-muted/50 rounded-2xl border p-4">
              <p className="text-sm font-medium">Read the instructions before the day</p>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                g.a.s.t. states the detailed task instructions exist{' '}
                <span className="text-foreground">only</span> in the preparatory materials — in the
                exam you see short reminders. Figure Sequences is the one to know: a single item
                asks for two matrices, so it takes two selections.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </PageShell>
  )
}

function SectionIcon({ sectionId }: { sectionId: SectionId }) {
  const Icon = SECTION_ICON[sectionId]
  return <Icon className="text-brand size-5 shrink-0" aria-hidden />
}
