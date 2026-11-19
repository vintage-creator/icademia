import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "./privacy";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — iCademia" }] }),
  component: Terms,
});

function Terms() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Terms of service"
      summary="These terms govern access to iCademia by partner schools, administrators, staff, students, parents and visitors."
      sections={[
        [
          "1. Agreement and eligibility",
          "By registering a school, accepting an invitation, checking a result, ordering an access card or otherwise using iCademia, you agree to these terms. A person registering a school confirms that they are at least 18 years old and authorised to bind or act for that institution. If you do not agree, do not use the service.",
        ],
        [
          "2. The iCademia service",
          "iCademia provides school-workspace, academic-record, result-formatting, marked-script, access-card, referral, communication, integration, support and related administrative tools. Features may differ by school, role, subscription, deployment stage or configuration. iCademia is infrastructure supporting a school’s operations and does not replace the school’s educational, safeguarding or statutory responsibilities.",
        ],
        [
          "3. School accounts and authorised users",
          "A partner school must provide accurate information, maintain a current authorised administrator and promptly remove access for staff who change roles or leave. Credentials are personal and must not be shared. The school is responsible for actions performed through its authorised accounts unless it promptly reports suspected compromise.",
        ],
        [
          "4. Academic authority and accuracy",
          "The school remains responsible for curricula, assessments, score accuracy, grading scales, attendance, positions, remarks, promotion, admission, discipline, corrections and result approval. iCademia may calculate or format information from supplied data, but the school must review it before publication. A technical calculation does not transfer academic responsibility to iCademia.",
        ],
        [
          "5. Student and parent access",
          "Students and parents may access only records the relevant school has approved and made available. A valid access-card PIN and requested identity information may be required. Users must not share PINs publicly, attempt to discover another student’s details, bypass access controls or misrepresent their identity.",
        ],
        [
          "6. Access cards",
          "An annual access card costs ₦1,500 per enrolled student and is valid for 365 days after activation unless a different written school arrangement applies. A replacement for a lost or compromised card costs ₦2,500. Each card is school-scoped and intended for one assigned student. A serial identifies and traces the physical card; the private PIN unlocks authorised digital services.",
        ],
        [
          "7. Orders, payment and fulfilment",
          "To pay by transfer, schools must request the current account details on WhatsApp at 07065737817 and send their transfer receipt to the same number. An order is marked paid only after iCademia confirms receipt. Physical-card fulfilment is normally estimated at 5–12 working days after confirmation, but this is an estimate rather than a guaranteed delivery date. Fraud checks, address issues and events outside reasonable control may cause delay.",
        ],
        [
          "8. Pricing, refunds and replacements",
          "Displayed prices are in Nigerian naira unless stated otherwise. Confirmed digital PIN generation or customised physical production may make an order non-refundable except where required by law or where iCademia fails to supply the purchased service. Duplicate charges, failed fulfilment and payment disputes should be reported promptly with the order reference. Replacement charges apply where loss or compromise is not caused by iCademia.",
        ],
        [
          "9. Referrals",
          "A partner school receives a unique referral identifier. Subject to verification and programme rules, a successful referral may earn ₦200 multiplied by the enrolled-student count approved for the referred school. Registration alone does not guarantee a reward. iCademia may verify enrolment, onboarding and payment status, reject self-referrals or manipulation, correct calculation errors and withhold disputed or unlawful payments.",
        ],
        [
          "10. Artificial intelligence",
          "AI features generate suggestions from available information and may make mistakes, omit context or produce unsuitable language. Outputs are not final academic, legal, medical, safeguarding, admission, disciplinary or employment decisions. An authorised user must review and edit an output before relying on or communicating it. Users must not use AI features to cheat, impersonate another person, expose confidential information or evade school policy.",
        ],
        [
          "11. Uploaded content and school instructions",
          "The school retains responsibility for records, logos, answer scripts and other content it uploads. The school grants iCademia the limited permission needed to host, reproduce, process, format and deliver that content for the service. The school confirms it has the necessary authority and that content is lawful, accurate and does not infringe another person’s rights.",
        ],
        [
          "12. Acceptable use",
          "Users must not gain unauthorised access; probe or disrupt security; introduce malware; scrape or bulk-extract records; reverse engineer protected components; falsify payments or referrals; alter another person’s record; upload unlawful or abusive material; use the platform for harassment or examination misconduct; or use automated means beyond an approved integration. We may investigate and restrict suspected misuse.",
        ],
        [
          "13. Third-party services and integrations",
          "The service may rely on hosting, storage, email, AI and school-website providers. Their availability and separate terms may affect a feature. Links to external competitions or organisers are provided for information; participation is governed by the organiser’s rules. iCademia does not endorse or guarantee an external opportunity merely by listing it.",
        ],
        [
          "14. Availability, maintenance and changes",
          "We aim to provide a reliable service but do not promise uninterrupted or error-free operation. Planned maintenance, emergencies, connectivity failures and provider incidents may interrupt access. We may improve, replace or discontinue a feature, giving reasonable notice where a change materially affects an active school service.",
        ],
        [
          "15. Suspension and termination",
          "iCademia may suspend access to protect users, investigate misuse, comply with law, address unpaid amounts or prevent harm. A school may request termination subject to outstanding orders, payment and lawful record-retention requirements. On termination, reasonable export assistance may be provided according to the applicable plan or written agreement.",
        ],
        [
          "16. Disclaimers and limitation",
          "To the extent permitted by law, iCademia is provided on an as-available basis and does not guarantee a particular educational, financial or adoption outcome. Nothing in these terms excludes liability that cannot lawfully be excluded. Any contractual limitation in a separate signed school agreement will apply alongside these terms.",
        ],
        [
          "17. Indemnity",
          "To the extent permitted by law, a school is responsible for claims arising from unlawful content it supplies, unauthorised instructions, breach of these terms or failure to obtain authority for submitted records. This does not apply to the extent a claim was caused by iCademia’s own breach, negligence or unlawful conduct.",
        ],
        [
          "18. Governing law and disputes",
          "These terms are governed by the laws of the Federal Republic of Nigeria. Before commencing formal proceedings, the parties should attempt in good faith to resolve a dispute through the support channel and authorised school representatives. Mandatory consumer, privacy and other statutory rights remain unaffected.",
        ],
        [
          "19. Notices and changes",
          "Operational and legal notices may be delivered through the platform, administrator email or published contact channels. We may update these terms to reflect service or legal changes. Material changes will be communicated reasonably before taking effect where practicable. Continued use after the effective date constitutes acceptance, subject to rights that cannot be waived.",
        ],
        [
          "20. Contact",
          "Questions or legal notices may be sent to hello@icademia.app or raised by calling 0813 804 5718. For transfer account details, transfer receipts and payment disputes, message iCademia on WhatsApp at 07065737817. Include the school name and relevant order or support reference, but never send a password or complete access-card PIN.",
        ],
      ]}
    />
  );
}
