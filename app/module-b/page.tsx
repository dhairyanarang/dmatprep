import { PageShell } from '@/components/layout/page-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const metadata = { title: 'Module B — General Academic' }

export default function ModuleBPage() {
  return (
    <PageShell
      description="The subject module sat after the 30-minute break."
    >
      <Alert>
        <AlertTitle>Coming soon</AlertTitle>
        <AlertDescription>
          This hub currently covers Module A (the Core Module) only. What is confirmed
          about Module B: it runs for 90 minutes in total, each question has four answer
          options with exactly one correct, and questions pair an academic input text —
          which may include figures, tables or formulas — with related questions. Topics
          span mathematics, computational sciences, natural sciences, engineering,
          business administration, economics, social sciences and humanities.
        </AlertDescription>
      </Alert>
    </PageShell>
  )
}
