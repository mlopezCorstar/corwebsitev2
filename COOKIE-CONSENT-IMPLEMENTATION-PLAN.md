# Cookie Consent Implementation Instructions

## Objective

Add a minimally invasive, accessible cookie-consent experience to the Corstar website. The primary interface must be a compact banner fixed to the bottom edge of the viewport, not a blocking modal or browser pop-up.

The implementation must:

- Be understandable to a visitor with little technical knowledge.
- Provide equally easy ways to accept or reject optional technology.
- Allow the visitor to continue browsing without making a choice.
- Prevent optional third-party content from loading before permission is given.
- Remember the visitor's choice and allow it to be changed later.
- Work consistently on every renderable HTML page, including pages in nested directories.
- Add accurate Privacy Policy, Cookie Policy, and Terms of Use pages.
- Preserve existing site copy, layout, navigation, forms, and unrelated worktree changes.

This document is an implementation brief, not approved legal advice. Draft policy content from verified facts, then require business-owner and legal review before production deployment.

## Current Site Inventory

Verify this inventory again in a clean browser before implementing. The current source contains:

- A Microsoft Bookings iframe on `consultation.html`.
- Contact forms submitted to Web3Forms on:
  - `index.html`
  - `about.html`
  - `faq.html`
  - `contact.html`
- Google Fonts loaded from `fonts.googleapis.com` and `fonts.gstatic.com`.
- A BeyondTrust external link for Remote Support.
- Google Maps directions links.
- No analytics scripts, advertising pixels, retargeting scripts, or marketing cookies found in the current source scan.
- Repeated page-local footer HTML that is also normalized by `assets/js/main.js`.

Treat BeyondTrust and Google Maps as ordinary external links unless live testing proves that they contact those providers before a visitor clicks them.

Do not add empty consent categories for tools that do not exist. In particular, do not display Analytics or Marketing categories unless those technologies are actually added. Design the code so new categories can be supported later, with a consent-version change and renewed consent.

## Required User Experience

### First-Visit Banner

Display a compact banner fixed to the bottom of the viewport on the visitor's first page view.

Use this initial copy unless the owner supplies replacement wording:

> **Cookie choices**  
> We use necessary technology to operate this website and remember your choices. With your permission, we also load third-party features such as appointment scheduling. Read our Cookie Policy.

The words `Cookie Policy` must link to `cookie-policy.html` using the correct relative path for the current page.

Provide these controls:

1. `Accept Optional`
2. `Reject Optional`
3. `Choose Settings`

Requirements:

- `Accept Optional` and `Reject Optional` must have equal visual prominence.
- Both decisions must require only one click.
- Do not preselect optional consent.
- Do not use misleading colors, hidden rejection controls, countdowns, or consent-by-scrolling.
- Do not block navigation or ordinary page content while the banner is visible.
- Do not make the entire page inert.
- Dismiss the banner after an accept or reject decision.
- On mobile, stack the controls into full-width, finger-friendly buttons.
- The banner should occupy only the space required by its content.

### Preference Panel

`Choose Settings` should open an accessible dialog or bottom sheet with these categories:

#### Necessary

- Always active.
- Cannot be disabled.
- Covers the preference record and technology strictly required for the site to operate.

#### Appointment Scheduling

- Off by default.
- Controls loading of the Microsoft Bookings iframe.
- Explain that the scheduler is provided by Microsoft and may use cookies or similar technology.

Provide:

- `Save Choices`
- `Accept Optional`
- `Reject Optional`

The preference panel must:

- Move focus to a meaningful heading or first control when opened.
- Keep keyboard focus within the modal panel while it is open.
- Close with `Escape`.
- Return focus to the element that opened it.
- Use native buttons and form controls.
- Expose a clear accessible name and description.

The compact first-visit banner itself should remain non-modal and should not trap focus.

### Remembering Consent

Store a versioned first-party preference record, for example:

```json
{
  "version": 1,
  "appointmentScheduling": false,
  "updatedAt": "ISO-8601 timestamp"
}
```

Recommended behavior:

- Use a clearly named key such as `corstar_consent_v1`.
- Store only the preference and timestamp; do not create a visitor identifier.
- Treat the preference storage as necessary.
- Re-prompt after approximately six months.
- Re-prompt when the consent model or policy materially changes.
- Increasing the consent version must not silently convert an old rejection into acceptance.
- Handle unavailable or corrupted browser storage without breaking the site.

Document whether the implementation uses a cookie, `localStorage`, or another storage mechanism in the Cookie Policy. Cookies and similar storage must be described accurately rather than collectively mislabeled.

### Persistent Settings Access

Add a `Cookie Settings` button or link to the bottom footer row on every page. It must reopen the preference panel at any time.

When a visitor changes Appointment Scheduling from allowed to rejected:

- Stop future scheduler loads immediately.
- If a Bookings iframe is already loaded, replace it with the local placeholder when technically practical.
- Do not claim that already transmitted third-party data has been deleted.

## Third-Party Loading Rules

### Microsoft Bookings

Replace the immediate iframe source in `consultation.html` with a consent-aware placeholder. Do not leave the Microsoft URL in an active `src` attribute before permission.

The placeholder should say:

> **Schedule a consultation**  
> The appointment scheduler is provided by Microsoft and may use cookies. You can load it when you're ready.

Provide:

- `Load Appointment Scheduler`
- `Review Cookie Settings`

Behavior:

- If Appointment Scheduling was previously accepted, load the iframe automatically when the consultation page is visited.
- If it was rejected or no choice exists, show the placeholder.
- Clicking `Load Appointment Scheduler` is an explicit request to load that third-party tool.
- If the visitor previously rejected optional technology, allow a one-time scheduler load for the current page without silently changing the stored site-wide preference.
- If the visitor has not made a stored choice, the implementation may either treat the explicit load action as Appointment Scheduling consent or perform a one-time load. Choose one behavior, document it in the Cookie Policy, and keep the interface wording consistent with that behavior.
- Preserve a direct scheduling fallback link if the iframe cannot load.

Use a `data-src` value or a JavaScript-controlled URL constant so the browser cannot request the iframe before the consent decision.

### Web3Forms

Web3Forms must remain inactive until a visitor submits a form. Rejecting optional cookies must not prevent a visitor from using a contact form.

Add this notice beneath the submit button on every Web3Forms form:

> We use the information you provide to respond to your request. Read our Privacy Policy.

Link `Privacy Policy` to the correct root or nested path.

Do not add a marketing-consent checkbox unless Corstar confirms that form submissions are also used for marketing. If marketing use is confirmed, it needs a separate, optional, unchecked control and accurate policy language.

### Google Fonts

Prefer self-hosting the existing font files, subject to their licenses, so ordinary page views do not contact Google. Preserve the current visual typography and include appropriate font fallbacks.

If fonts remain remotely hosted:

- Record the resulting network requests in the data inventory.
- Describe the provider and processing accurately in the Privacy Policy.
- Do not claim that Google Fonts uses cookies unless clean-browser testing confirms it.

### Future Optional Technology

Any future analytics, advertising, embedded media, chat widget, or similar tool must:

- Be inventoried before installation.
- Have its own accurate consent category when needed.
- Be loaded dynamically only after the applicable consent.
- Trigger a consent-version review.
- Be added to the Privacy Policy and Cookie Policy.

Never hard-code a new optional third-party script into the page before the consent controller runs.

## Implementation Architecture

### Preferred Files

Create:

- `assets/js/consent.js`
- `privacy-policy.html`
- `cookie-policy.html`
- `terms-of-use.html`

Modify as needed:

- `assets/css/components.css`
- `assets/js/main.js`
- `consultation.html`
- `index.html`
- `about.html`
- `faq.html`
- `contact.html`
- Every other renderable HTML page that needs the shared consent script or static footer fallback

### JavaScript Responsibilities

Keep cookie-consent behavior in `assets/js/consent.js`. It should own:

- Preference parsing, validation, expiry, and versioning.
- Rendering or activating the first-visit banner.
- Opening and closing the preference panel.
- Saving accept, reject, and customized decisions.
- Publishing a small, documented event or callback when preferences change.
- Loading and unloading consent-controlled content.
- Path-safe links from root and nested pages.
- Graceful failure when storage is disabled.

`assets/js/main.js` currently normalizes footer content. Update its footer logic so the legal links and `Cookie Settings` control are not removed or overwritten.

Load `consent.js` on every renderable page. If optional integrations are ever introduced globally, ensure their loading is controlled by `consent.js`; do not rely only on script order to block them.

Do not add consent UI to an HTML redirect page if it immediately redirects and never renders meaningful content.

### HTML Fallback

Because footer markup exists in individual HTML files, include static legal links in the page footer where practical, then let `main.js` normalize them. This provides working legal navigation even if JavaScript fails.

At minimum, the static footer must expose:

- `Privacy Policy`
- `Cookie Policy`
- `Terms of Use`

`Cookie Settings` requires JavaScript and may be hidden or omitted when the consent controller is unavailable.

### Styling

Add reusable component classes to `assets/css/components.css`. Do not use large page-specific inline style blocks.

Account for:

- Existing Corstar colors, typography, shadows, and spacing.
- A high-contrast banner boundary.
- Visible keyboard focus.
- Minimum practical touch targets of approximately 44 by 44 CSS pixels.
- Narrow screens down to 320 CSS pixels.
- Browser zoom up to 200%.
- Long policy-link text without horizontal scrolling.
- Safe-area padding on mobile devices.
- `prefers-reduced-motion`.
- A sufficiently high `z-index` without covering the site navigation.

Avoid excessive animation. A short fade or slide is acceptable if disabled under reduced-motion preferences.

## Required Policy Pages

Use the site's established header, footer, typography, metadata, and responsive layout. Each page must have a descriptive `<title>`, meta description, canonical URL consistent with the site's current deployment convention, one `<h1>`, and an effective date.

Do not copy generic policy text that describes data practices Corstar does not perform.

### Privacy Policy

Create `privacy-policy.html` with sections covering:

1. Who Corstar is and how to contact it.
2. Information visitors submit through contact forms.
3. Information visitors submit through Microsoft Bookings.
4. Technical information such as hosting and security logs.
5. How each information category is used.
6. Service providers and disclosures, including verified roles for Web3Forms, Microsoft, the hosting provider, and Google if remote fonts remain.
7. Whether information is used for marketing.
8. Retention periods or defensible retention criteria.
9. Security practices described without making absolute guarantees.
10. Privacy rights and how to submit access, correction, deletion, or other requests.
11. State-specific rights when applicable.
12. International transfers when applicable.
13. Children's privacy.
14. Policy changes and effective date.

Add a prominent Privacy Policy link near every form, not only in the global footer.

### Cookie Policy

Create `cookie-policy.html` with:

1. A plain-language explanation of cookies and similar browser storage.
2. The difference between necessary and optional technology.
3. An exact inventory table with:
   - Name or storage key
   - Provider
   - Purpose
   - Category
   - Duration
   - First-party or third-party status
4. A section for Microsoft Bookings and its activation behavior.
5. Instructions for accepting, rejecting, withdrawing, and changing choices.
6. A working `Cookie Settings` control.
7. Links to relevant third-party privacy information.
8. Effective date and update process.

Do not invent cookie names. Populate the table from clean-browser testing.

### Terms of Use

Create `terms-of-use.html` with concise sections covering:

1. Acceptance and permitted use of the informational website.
2. Ownership of Corstar content and branding.
3. Prohibited misuse.
4. Third-party services and external links.
5. Informational-content and availability disclaimers.
6. Reasonable warranty and liability provisions.
7. Governing law and venue confirmed by Corstar or counsel.
8. Changes, effective date, and contact information.

### Conditional Privacy-Choices Page

Do not create a separate `your-privacy-choices.html` or `do-not-sell-or-share.html` page merely as boilerplate.

Create one only if the verified data inventory and legal review determine that Corstar:

- Sells personal information.
- Shares it for cross-context behavioral advertising.
- Uses targeted advertising.
- Must provide a dedicated statutory opt-out mechanism.

If none of those conditions applies, put privacy-request instructions in the Privacy Policy and clearly state only the practices the business has verified.

## Facts Requiring Owner Confirmation

Before finalizing policy language, confirm:

- The correct privacy-request email address.
- The website hosting provider and log-retention period.
- Web3Forms account configuration and retention.
- Microsoft Bookings retention and account administration.
- Whether contact submissions are added to a CRM.
- Whether submissions are used for email marketing.
- Whether information is sold, shared, or used for targeted advertising.
- The intended geographic audience and whether EU/UK visitors are actively served.
- Actual retention periods for leads, messages, and scheduling records.
- Applicable state-specific privacy notices.
- The governing law and venue for the Terms of Use.
- Whether the site is intended for children under 13.

If a fact cannot be verified, do not publish a fabricated answer or visible placeholder. Escalate it for owner or counsel confirmation.

## Accessibility Requirements

Meet at least these behaviors:

- All controls are reachable and operable by keyboard.
- Focus indicators are always visible.
- The preference dialog has a clear accessible name.
- Opening and closing the dialog manages focus correctly.
- The banner is understandable in screen-reader reading order.
- Status changes are announced without excessive interruption.
- Color is not the only indicator of a selected setting.
- Toggle labels communicate both the category and state.
- Text remains readable at 200% zoom.
- The interface works with reduced motion.
- Consent is not required to access ordinary content.

## Validation Procedure

### Static Checks

Run:

```powershell
node --check assets/js/consent.js
node --check assets/js/main.js
git diff --check
```

Serve the repository locally:

```powershell
python -m http.server 8000
```

Run a full local HTML `href` scan and confirm that there are no missing local targets. Inspect the diff carefully because site-wide footer changes can touch many files.

### Browser Test Matrix

Test in a clean browser profile with storage and network panels open.

#### Fresh Visit

- Banner is visible.
- Ordinary navigation and reading remain available.
- No request is sent to the Microsoft Bookings iframe.
- No optional storage exists.
- Necessary preference storage is created only when required by the chosen design.

#### Reject Optional

- Rejection requires one click.
- Banner closes.
- Rejection persists across root and nested pages.
- Bookings remains blocked.
- Contact forms continue to work.
- No console errors appear.

#### Accept Optional

- Acceptance requires one click.
- Choice persists across pages.
- Visiting `consultation.html` loads Bookings.
- The cookie/storage inventory matches the Cookie Policy.

#### Choose Settings

- Panel opens with correct focus.
- Appointment Scheduling defaults to off when no choice exists.
- Saving the off state blocks Bookings.
- Saving the on state allows Bookings.
- `Escape` closes the panel and restores focus.

#### Change or Withdraw

- Footer `Cookie Settings` control works from root and nested pages.
- Changing an allowed category to rejected prevents future loads.
- The existing iframe is removed or replaced where practical.
- Rejection remains stored after navigation and reload.

#### One-Time Scheduler Load

- The notice appears before the iframe.
- The explicit load button works.
- The stored site-wide rejection is not silently changed if the implementation promises a one-time load.
- A direct scheduling fallback remains available if the iframe fails.

#### Expiry and Versioning

- Expired preferences cause the banner to reappear.
- Corrupted storage does not break the page.
- A consent-version increase requests a new decision.
- An old rejection never becomes acceptance.

#### Responsive and Accessibility

- Test at 320, 375, 768, 1024, and 1440 CSS pixels.
- Test keyboard-only navigation.
- Test 200% zoom.
- Test reduced motion.
- Inspect a representative root page, service page, industry page, resource page, consultation page, and policy page.

### Network Verification

Before calling the work complete, verify network behavior rather than relying only on source inspection:

- Clear cookies, local storage, and cache.
- Load representative pages before making a choice.
- Confirm no optional third-party request occurs.
- Exercise accept, reject, settings, form submission, and scheduler loading.
- Record the final cookie and storage table.
- Update the policy pages if observed behavior differs.

## Completion Criteria

The implementation is complete only when:

- Every renderable page has a consistent bottom consent experience.
- Accepting and rejecting optional technology are equally easy.
- No optional tool loads before a valid choice or explicit one-time request.
- Microsoft Bookings is correctly gated.
- Forms remain usable after rejection and have nearby Privacy Policy links.
- Preferences persist, expire, version, and can be withdrawn.
- Footer legal links work from root and nested pages.
- Privacy Policy, Cookie Policy, and Terms of Use pages are complete and factual.
- The Cookie Policy inventory matches live browser evidence.
- JavaScript syntax, whitespace, and link checks pass.
- Representative desktop, mobile, keyboard, and screen-reader behavior has been inspected.
- Existing unrelated worktree changes remain intact.
- Business-owner and legal review items are clearly identified before deployment.

## Authoritative Guidance

Use these sources as implementation and review references:

- [European Commission: Consent in data protection](https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en)
- [European Commission: Protecting your data and privacy](https://commission.europa.eu/digital-life/protecting-your-data-and-privacy_en)
- [European Commission: Cookies policy](https://commission.europa.eu/cookies-policy_en)
- [FTC: Consumer Privacy](https://www.ftc.gov/business-guidance/privacy-security/consumer-privacy)

Prefer current official guidance and verified vendor documentation. Have qualified counsel review final legal text for Corstar's actual business practices and applicable jurisdictions.
