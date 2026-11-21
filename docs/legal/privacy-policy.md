# Privacy Policy — DRAFT

> **DRAFT. NOT LEGAL ADVICE. NOT FOR PUBLICATION.**
> Review by a qualified Indian legal practitioner required before publication.
> Placeholders in `{{BRACES}}` must be supplied, never guessed.

Last updated: {{DATE}}

## How this relates to the live page

`app/privacy/page.tsx` is live now, is accurate, and is the plain-language
version a candidate actually reads before signing in. **It should stay.**

This draft is the formal version the Digital Personal Data Protection Act, 2023
and a payment aggregator's merchant review both expect. The two must agree. The
gaps this draft fills are listed in the last section.

---

## 1. Who is responsible for your data

{{LEGAL_NAME}}, at {{ADDRESS}}, is the Data Fiduciary for the personal data
described here. Contact: {{CONTACT_EMAIL}}.

## 2. What we collect

### If you do not sign in

**Nothing reaches us.** Your answers, the questions you have seen, your hint use
and any session in progress are written to your own browser's local storage.
They are not transmitted. Clearing your browser data deletes them permanently,
and we cannot recover them because we never had them.

### If you sign in with Google

| Data | Why |
|---|---|
| Name, email address, profile picture | To identify your account |
| Each practice attempt — question, answer, whether it was right, time taken | So your progress follows you between devices |
| Sessions sat, and which questions you have been shown | So the question pools do not repeat material |
| Study-plan milestones | So your plan persists |

That is the complete list. We never receive your Google password and request
nothing beyond basic profile information.

### If you make a payment

<!-- REVIEWER: inert until payments are activated. -->

| Data | Why |
|---|---|
| Payment reference, amount, date, status | To grant access and handle refunds |
| Billing name, and the email you bought with | Required for the receipt and for tax records |

**We never see or store your card number, CVV, UPI PIN or bank credentials.**
Those go directly to the payment aggregator and never pass through our systems.

### Usage analytics

We use Microsoft Clarity to see how the site is actually used — clicks, scroll
behaviour, and which screens people visit. Your name, email and account details
are never sent to it, and the one place your email appears on screen is masked
from its recordings.

**It does record the pages as you saw them**, so a recording of a practice
session can show the question in front of you and the option you chose. Blocking
third-party scripts in your browser stops it loading entirely.

## 3. The legal basis

We process your data on the basis of **your consent**, given when you choose to
sign in, and for payments on the basis of **performing the contract** you enter
when you buy.

You can withdraw consent at any time by asking us to delete your account
(§ 6). Withdrawal does not undo processing already carried out, and we may keep
payment records where the law requires it.

## 4. Who else touches it

| Processor | What they handle | Where |
|---|---|---|
| Supabase | Account and practice records | {{SUPABASE_REGION}} |
| Vercel | Hosting and request logs | Global edge network |
| Google | Sign-in only | Global |
| Microsoft Clarity | Usage analytics | Global |
| {{AGGREGATOR}} | Payments | India |

**We do not sell your data, and we do not use it to train any model.**

<!-- REVIEWER: confirm the Supabase project region. If it is outside India, the
     DPDP Act's cross-border provisions apply and must be disclosed here with
     the transfer basis. This is a fact to check in the dashboard, not to
     assume. -->

## 5. How long we keep it

| Data | Retention |
|---|---|
| Account and practice records | Until you ask for deletion |
| Payment records | {{TAX_RETENTION}} — a statutory period, not our choice |
| Clarity recordings | Per Microsoft Clarity's own retention, which we do not control |
| Request logs | Per Vercel's own retention |

<!-- REVIEWER: {{TAX_RETENTION}} must come from the applicable Income Tax and
     GST record-keeping rules. It is not for us to pick. -->

## 6. Your rights

Under the DPDP Act, 2023 you may:

- **ask what we hold** about you, and who we have shared it with;
- **correct** anything inaccurate or incomplete;
- **have it erased**, except where we must keep it by law;
- **withdraw consent**, which means deleting your account; and
- **nominate** someone to exercise these rights if you cannot.

Write to {{CONTACT_EMAIL}} from your account's address. We respond within
**30 days**. There is no charge.

Signing out clears this browser's copy of your progress; the cloud copy is
untouched and returns when you sign back in. Deletion is a separate request and
is permanent.

## 7. Security

Your practice records are readable only by your own account, enforced at the
database with row-level security rather than only in the application. Traffic is
encrypted in transit. Sign-in is handled by Google, so we never hold a password
of yours to lose.

No system is perfectly secure. If a breach affects your data we will notify you
and the Data Protection Board as the DPDP Act requires.

## 8. Children

dMAT Prep is for candidates preparing for a postgraduate admissions test and is
not directed at children under 18. We do not knowingly collect a child's data.

<!-- REVIEWER: the DPDP Act requires verifiable parental consent for users under
     18 and prohibits tracking or behavioural advertising directed at them.
     Clarity is behavioural analytics. Please advise whether an age gate is
     required, given the realistic age of this audience. -->

## 9. Grievances

{{GRIEVANCE_OFFICER}}, at {{CONTACT_EMAIL}}. Acknowledged within 48 hours,
resolved within 30 days. If you are not satisfied you may complain to the Data
Protection Board of India.

## 10. Changes

We will notify material changes in the app. The date above is always current.

---

## Changes needed to the live page

The live page is honest but incomplete against the DPDP Act. Before payments go
live it needs:

1. **A named Data Fiduciary and a postal address.** It currently names neither.
2. **A retention period** for each category. It currently states none.
3. **The processor list and hosting region.** Supabase, Vercel, Google and
   Clarity are all processors; none is named as such and no region is given.
4. **The rights list**, including correction and nomination. It currently offers
   deletion by email only.
5. **A payment-data section**, once payments exist.
6. **A support address that is not a personal mailbox.** It currently publishes
   `dhairyanarang077@gmail.com`. That is fine for a beta run by one person and a
   poor idea on a page that also carries a merchant grievance obligation.

None of these is urgent while the app takes no money. All of them are blocking
once it does.
