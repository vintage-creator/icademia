import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — iCademia" }] }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Privacy policy"
      summary="This policy explains how iCademia collects, uses, protects and shares information belonging to schools, staff, students, parents and other authorised users."
      sections={[
        [
          "1. Scope and applicable framework",
          "This policy applies to the iCademia website, school workspaces, result checker, embedded widgets, access-card services, administrator tools and support channels. Our privacy practices are designed around the Nigeria Data Protection Act 2023 and other applicable Nigerian privacy requirements. A school may provide additional notices governing its own use of student and staff information.",
        ],
        [
          "2. Our role and the school’s role",
          "A partner school ordinarily decides why student, staff and academic information is collected and how it is used. For those activities, the school acts as data controller and iCademia processes information to provide the contracted platform. iCademia may act as an independent controller for its own account administration, security, billing, fraud prevention, legal compliance and service communications.",
        ],
        [
          "3. Information we collect",
          "Information may include school identity and branding; administrator and staff names, contact details, roles and account credentials; student names, registration numbers, classes and school identifiers; scores, grades, positions, attendance, remarks, traits and skills; marked answer scripts; subjects, timetables and intervention records; access-card serials, activation and expiry information; referral records; support correspondence; device, browser, IP address, event and security logs; and order, delivery and payment-status information.",
        ],
        [
          "4. Information we do not require",
          "iCademia does not need or intend to store complete debit-card or bank-card credentials. Payment credentials are entered with the relevant payment service provider. We retain only the transaction reference, amount, order status and related reconciliation information required to operate the service and resolve payment issues.",
        ],
        [
          "5. Sources of information",
          "We receive information from partner schools and their authorised users, students or parents using the result checker, payment and fulfilment providers, integrated school websites, and technical events created when the service is used. Schools must ensure information supplied to iCademia is accurate, relevant and lawfully obtained.",
        ],
        [
          "6. Purposes and lawful bases",
          "We process information to create and administer school workspaces; authenticate users; enter, calculate, review, publish and retrieve results; provide marked scripts and student support; issue and manage access cards; fulfil orders; process referrals; operate support; prevent abuse; maintain audit trails; and comply with legal duties. Depending on the activity, processing may rely on contract, legal obligation, legitimate interests, consent, protection of vital interests or another lawful basis available under applicable law.",
        ],
        [
          "7. Children and student information",
          "Most student records relate to children and require heightened care. Partner schools are responsible for the authority and notices needed to submit these records and, where required, for obtaining approval from a parent or guardian. iCademia limits student access to school-scoped records and does not permit a student to retrieve another learner’s information.",
        ],
        [
          "8. Artificial intelligence",
          "Current AI tools may analyse individual result information for a requested study recommendation or de-identified and aggregate school information for administrator briefs. AI output is advisory and may be incomplete or inaccurate. It must be reviewed by an authorised person before use. iCademia does not use AI output alone to make final grading, admission, discipline, employment or other decisions producing significant effects.",
        ],
        [
          "9. Sharing and service providers",
          "We disclose information only where necessary to operate the service, including to hosting, database, storage, email, payment, delivery, monitoring and AI service providers; to a school and its authorised users; to professional advisers; in a business reorganisation subject to safeguards; or where disclosure is required by law. Providers are expected to process information only for authorised purposes and apply appropriate confidentiality and security controls.",
        ],
        [
          "10. International transfers",
          "Some infrastructure or service providers may process information outside Nigeria. Where a cross-border transfer occurs, iCademia will use an applicable transfer mechanism and reasonable contractual, organisational and technical safeguards. Schools should contact us before uploading information subject to additional localisation or sector-specific restrictions.",
        ],
        [
          "11. Retention",
          "We retain information only for as long as needed for the purposes described here, the school’s service instructions, academic-record continuity, security, dispute resolution and legal obligations. Account and academic records may be retained throughout the school relationship and an appropriate archival period. Reset and verification tokens expire automatically; operational logs and support records use shorter schedules where practicable. Information is deleted, anonymised or returned when retention is no longer justified.",
        ],
        [
          "12. Security",
          "Measures include school-scoped access controls, credential hashing, single-use verification and reset tokens, server-side payment verification, controlled asset access, audit records, provider access restrictions and backups. No internet service can guarantee absolute security. Users must protect credentials and access-card PINs and promptly report suspected misuse.",
        ],
        [
          "13. Data incidents",
          "We investigate suspected unauthorised access, loss, alteration or disclosure and take containment and remediation measures. Where applicable law requires notification to a school, affected person or the Nigeria Data Protection Commission, notification will be made within the required process and timeframe. Schools must promptly notify iCademia of incidents involving their users or records.",
        ],
        [
          "14. Your rights",
          "Subject to applicable law, a person may request information about processing; access or obtain a copy of personal data; correct inaccurate data; object to or restrict certain processing; request portability or deletion; withdraw consent where consent is the basis; and request human review of relevant automated processing. Some requests must be directed through the partner school because it controls the academic record. Identity and authority may be verified before a request is completed.",
        ],
        [
          "15. Complaints and contact",
          "Privacy requests may be sent to hello@icademia.app or made by calling 0706 573 7817 or 0813 804 5718. Please identify the relevant school and describe the request without sending an access-card PIN or password. You may also lodge a complaint with the Nigeria Data Protection Commission. We encourage contacting iCademia and the relevant school first so the matter can be investigated promptly.",
        ],
        [
          "16. Changes to this policy",
          "We may update this policy when the service, providers or legal requirements change. Material changes will be communicated through the platform, email or another appropriate channel. The date shown on this page identifies the latest published version.",
        ],
      ]}
    />
  );
}

export function PolicyPage({
  eyebrow,
  title,
  summary,
  sections,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  sections: string[][];
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-[#07111f] px-4 py-16 text-white sm:px-6">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#d6a84b]">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl leading-7 text-white/60">{summary}</p>
            <p className="mt-5 text-xs text-white/35">Last updated: 30 July 2026</p>
          </div>
        </section>
        <div className="mx-auto max-w-4xl space-y-9 px-4 py-14 sm:px-6">
          {sections.map(([heading, body]) => (
            <section key={heading} className="border-b border-border pb-9 last:border-0">
              <h2 className="font-display text-xl font-semibold">{heading}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{body}</p>
            </section>
          ))}
          <p className="rounded-xl border border-border bg-muted/35 p-5 text-sm leading-6 text-muted-foreground">
            This policy explains iCademia’s intended operating practices and is not a substitute for
            legal advice to a partner school about its own obligations.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
