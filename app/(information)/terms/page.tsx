import { FileText } from 'lucide-react'

import { LegalDocumentPage, legalRobots } from '@/components/legal/legal-document'
import { TERMS } from '@/content/legal/documents'
import { canonical } from '@/lib/seo'

export const metadata = {
  title: 'Terms of Use', ...legalRobots(TERMS),
  description:
    'The terms that apply to using dMAT Prep, an independent study tool unaffiliated with g.a.s.t. or APS India.',
  alternates: { canonical: canonical('/terms') },
}
export default function TermsPage() {
  return <LegalDocumentPage document={TERMS} icon={FileText} />
}
