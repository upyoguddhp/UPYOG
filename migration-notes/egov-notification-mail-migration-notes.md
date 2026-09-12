# egov-notification-mail migration notes

Audit-and-merge: upstream and the fork had **independently diverged** on this service - upstream added email attachment support (`Attachments`/`ByteArrayResource`/`helper.addAttachment(...)`) that the fork never had, while the fork added a real feature upstream never had (per-ULB sender selection). Neither side is a superset of the other, so this was a genuine three-way merge rather than a simple "keep fork's version" or "take upstream's."

## HP customization found and ported
**Solan ULB sends email from its own account** (commit `db091bc8d3`): `ExternalEmailService.sendHTMLEmail()` now picks between the default sender and a dedicated `JavaMailSenderImpl` configured with Solan's own Gmail credentials, based on a new `Email.ulbName` field. Ported onto upstream's current `ExternalEmailService.java` (which already has attachment handling) rather than replacing it wholesale - merged the `getMailSender(ulbName)` dispatch logic and `EmailProperties`'s `solanUsername`/`solanPassword` fields on top of upstream's attachment-aware base, so both features work together.

**Bug found in HP's own original patch, fixed while porting**: the fork's `application.properties` had the Solan credentials keyed as `mail.sender.Solan.username`/`.password` (capital S), but the corresponding Java code used `@Value("${mail.sender.solan.username}")` (lowercase). Spring's `@Value` placeholder resolution against a `.properties` file is case-sensitive (unlike environment-variable relaxed binding), so **this property would never have actually matched** - the Solan-specific sender was very likely silently falling back to null credentials or failing, not actually working as HP intended. Standardized both sides on lowercase `solan` so the feature functions as originally designed.

**Attachment null-safety fix**: upstream's `sendHTMLEmail()` unconditionally calls `email.getAttachments().getContent()` - a `NullPointerException` waiting to happen for any HTML email sent without an attachment (which, per the Kafka listener, is clearly a supported case - `EmailRequest`/`Email` doesn't require one). Added a null-check around the attachment-handling block. Not HP's bug (no HP commit ever touched this), but discovered and fixed during verification since it would otherwise block testing basic HTML emails.

**Bug found in upstream's own default config, fixed**: `kafka.topics.notification.mail.name` defaulted to `ws-national-dashboard` - clearly a copy-paste mistake (an unrelated national-dashboard topic name), confirmed against `egov-user`'s own producer config, which publishes real email notifications to `egov.core.notification.email`. With the wrong default, this service would never receive a single real notification. Fixed to the correct topic name.

## Secrets
The Solan and default sender credentials (real Gmail app passwords) are carried forward from the fork's own git history, consistent with how every other service's already-committed secrets (DB passwords, JWT keys, etc.) have been handled throughout this migration project - not newly introduced or exposed, just kept at parity with what has already been running.

## Verification performed (this session)
Started via `upyogctl start egov-notification-mail` (pure Kafka-consumer service, no HTTP endpoints):
- Compiled clean after the merge.
- Confirmed correct subscription to `egov.core.notification.email` after the topic-name fix (previously subscribed to the wrong topic and would never have received anything).
- Published a real test message (`emailTo: test@example.com`, plain text) via `kafka-console-producer` - consumed successfully with no exception, meaning the SMTP send completed against the real Gmail account without an auth/connection error. Did not repeat this test to avoid sending further real emails from the production account.

**Not yet verified**: the Solan-specific sender path end-to-end (would need a message with `ulbName: "Solan"`), HTML emails with a real attachment. (This service also bundles its own `SmsNotificationListener` alongside the mail listener, both under consumer group `email_group1` but on separate topics - confirmed this is intentional and not a group-id collision with the separate `egov-notification-sms` service, which uses its own distinct group `sms`.)
