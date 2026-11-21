import { ProvenanceKey, ProvenanceTag } from '@/components/content/provenance'
import { Section } from '@/components/exam/visuals'
import { SubPage } from '@/components/layout/sub-nav'
import { ChecklistItems } from '@/components/exam/checklist-items'

export const metadata = { title: 'Pre-exam checklist' }

export default function ChecklistPage() {
  return (
    <SubPage
      title="Pre-exam checklist"
      description="Everything to settle before 26 September, with the official requirements kept separate from our practical advice."
    >
      <div className="space-y-8">
        <ProvenanceKey kinds={['official', 'recommendation']} />
        <ChecklistItems />

        <Section title="If you are excluded">
          <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
            <ProvenanceTag kind="official" className="mr-2 align-middle" />
            Exclusion carries no refund, and the Examination Board may deny admission to future
            sittings. A phone ringing is enough.
          </p>
        </Section>
      </div>
    </SubPage>
  )
}
