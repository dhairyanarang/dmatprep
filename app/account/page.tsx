import { AccountView } from '@/components/account/account-view'
import { PageShell } from '@/components/layout/page-shell'

export const metadata = { title: 'Account' }

/**
 * Static, like every other route. Everything on it is client state — who is
 * signed in, what has been answered, what the account may open — so the page
 * itself is a shell and nothing here needs a server at request time.
 */
export default function AccountPage() {
  return (
    <PageShell
      title="Account"
      description="Who you are, what is stored, and what this account can open."
    >
      <AccountView />
    </PageShell>
  )
}
