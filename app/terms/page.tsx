import { FileText } from 'lucide-react'

import { LegalDocumentPage, legalRobots } from '@/components/legal/legal-document'
import { TERMS } from '@/content/legal/documents'

export const metadata = { title: 'Terms of Use', ...legalRobots() }

export default function TermsPage() {
  return <LegalDocumentPage document={TERMS} icon={FileText} />
}
