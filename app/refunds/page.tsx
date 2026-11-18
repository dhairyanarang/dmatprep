import { RotateCcw } from 'lucide-react'

import { LegalDocumentPage, legalRobots } from '@/components/legal/legal-document'
import { REFUNDS } from '@/content/legal/documents'

export const metadata = { title: 'Refunds', ...legalRobots() }

export default function RefundsPage() {
  return <LegalDocumentPage document={REFUNDS} icon={RotateCcw} />
}
