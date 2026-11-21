# Policy drafts

**These are drafts. None of them has been reviewed by a lawyer, and none should
be published as-is.**

They exist for three reasons:

1. **Payment aggregators require them before onboarding.** PayU and Cashfree
   both check for reachable Terms, Privacy, Refund/Cancellation and Contact
   pages during merchant review. An application without them is rejected, so
   these block E10 rather than following it.
2. **The Consumer Protection (E-Commerce) Rules, 2020** require an Indian seller
   to publish its legal identity, a contact address, and a grievance mechanism.
3. **The Digital Personal Data Protection Act, 2023** governs the personal data
   this app already collects today, payments or not.

## What a reviewer must supply

Deliberately left as placeholders rather than guessed. Every one is a fact about
the seller that cannot be inferred from the codebase, and a legal document
containing an invented one is worse than no document.

| Placeholder | What it needs |
|---|---|
| `{{LEGAL_NAME}}` | The name that will appear on the merchant account — an individual's own name, or a registered entity's |
| `{{ADDRESS}}` | A service address. Required by the E-Commerce Rules and not optional |
| `{{CONTACT_EMAIL}}` | A support address. Should not be a personal mailbox once this is public |
| `{{GRIEVANCE_OFFICER}}` | Name and contact. For a sole proprietor this is normally the proprietor |
| `{{PRICE}}` | ₹599 is a hypothesis, not a decision |
| `{{JURISDICTION}}` | The city whose courts have jurisdiction |

## Status of the live site

`app/privacy/page.tsx` already exists, is accurate for the product as it stands,
and is linked from the footer. It is **not** one of these drafts and should not
be replaced by one. It describes a product that takes no payments; when payments
go live it needs a payment-data section, noted in `privacy-policy.md` §
"Changes needed to the live page".

The other two drafts have **no corresponding route**, deliberately. They are
published at the point payments are activated, not before — a live page headed
DRAFT is a liability, not a disclosure.
