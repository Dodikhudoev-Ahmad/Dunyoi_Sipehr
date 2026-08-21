# Domain Model

## Entities

### AdminUser
- Id (Guid), Email (unique), PasswordHash, DisplayName, Role (enum: SuperAdmin, Editor), IsActive, CreatedAtUtc
- RefreshTokens: 1—many `RefreshToken` (Token hash, ExpiresAtUtc, RevokedAtUtc, ReplacedByToken, CreatedByIp)

### Country
- Id, IsoCode (unique, 2-letter), SortOrder
- Translations: (CountryId, Locale, Name)

### City
- Id, CountryId (FK), SortOrder
- Translations: (CityId, Locale, Name)

### Destination
- Id, CityId (FK), Slug (unique per locale group — global unique), HeroImageUrl, GalleryUrls (string[]), IsFeatured, IsPublished, SortOrder, CreatedAtUtc, UpdatedAtUtc
- Translations: (DestinationId, Locale, Title, Summary, Description, Highlights (string[]), MetaTitle, MetaDescription)

### Service
- Id, Icon, IsPublished, SortOrder
- Translations: (ServiceId, Locale, Name, Description)

### Offer
- Id, DestinationId (FK, nullable), PriceFrom (decimal), Currency (enum: USD/EUR/TJS), DurationDays (int?), GalleryUrls, ValidUntilUtc (nullable), IsFeatured, IsPublished, SortOrder
- OfferServices: many-to-many join to Service
- Translations: (OfferId, Locale, Title, Summary, Description, MetaTitle, MetaDescription)

### Testimonial
- Id, AuthorName, AuthorCountry, AvatarUrl, Rating (1-5), IsPublished, SortOrder
- Translations: (TestimonialId, Locale, Quote)

### FaqItem
- Id, Category, SortOrder, IsPublished
- Translations: (FaqItemId, Locale, Question, Answer)

### SiteContent
- Id, Key (unique, e.g. "hero", "about", "contacts")
- Translations: (SiteContentId, Locale, Title, Body (text), ExtraJson (nullable, structured fields per key))

### TravelRequest
- Id, CreatedAtUtc, Status (enum: New, Contacted, Qualified, Won, Lost)
- Contact: LastName, FirstName, MiddleName (nullable — patronymic, not every name convention has one), Phone, PreferredLocale — no Email; contact is phone-only (+992)
- DestinationId (FK, nullable) + DestinationSnapshotTitle (denormalized at submit time)
- OfferId (FK, nullable) + OfferSnapshotTitle
- PassengersAdults (int), PassengersChildren (int), ChildrenAges (jsonb List<int>, one entry per child, 0-17 — under-12 books child fare)
- DepartureDate (DateOnly, not-null, must be today or later at submit time), ReturnDate (DateOnly, nullable, must be ≥ DepartureDate)
- Message (text, nullable)
- PassportPhotoPaths (jsonb List<string> of server-generated filenames, 1-2 — never a public URL; see DEC-012)
- ConsentAcceptedAtUtc (not-null — required at submit)
- PassportDataConsentAcceptedAtUtc (not-null — separate required consent specifically for passport/ID data, see DEC-012)
- SourceUtm (Json: utm_source/medium/campaign, nullable), SourceIp, SourceLocale
- AssignedAdminUserId (FK, nullable)
- AuditLogs: 1—many `AuditLog`

### AuditLog
- Id, EntityType, EntityId, Action, AdminUserId (FK, nullable = system), Timestamp, DetailsJson

## Relationships
- Country 1—* City 1—* Destination 1—* Offer (nullable FK, an Offer can exist without a Destination — e.g. generic "Visa Support" service package)
- Offer *—* Service
- TravelRequest *—1 Destination (nullable), *—1 Offer (nullable), *—1 AdminUser (assignee, nullable)
- AdminUser 1—* RefreshToken, 1—* AuditLog

## Indexes / Constraints
- Unique: AdminUser.Email, Country.IsoCode, Destination.Slug, (EntityId, Locale) on every translation table, SiteContent.Key
- FK indexes on every FK column (EF Core default) plus explicit index on TravelRequest.Status, TravelRequest.CreatedAtUtc (admin list sorting/filtering), Destination.IsPublished+IsFeatured (public list query).
