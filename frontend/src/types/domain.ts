/**
 * Domain model types mirroring docs/DOMAIN_MODEL.md.
 * The API returns entities already resolved to the requested locale for public
 * endpoints (translation fields flattened), and with an explicit `translations`
 * array for admin endpoints (so every locale can be edited at once).
 */

export type Locale = 'ru' | 'tg' | 'en'

export const LOCALES: Locale[] = ['ru', 'tg', 'en']
export const DEFAULT_LOCALE: Locale = 'ru'

export type Currency = 'USD' | 'EUR' | 'TJS'

export type AdminRole = 'SuperAdmin' | 'Editor'

export type TravelRequestStatus = 'New' | 'Contacted' | 'Qualified' | 'Won' | 'Lost'

export interface CountryTranslation {
  locale: Locale
  name: string
}

export interface Country {
  id: string
  isoCode: string
  sortOrder: number
  name: string
  translations?: CountryTranslation[]
}

// Mirrors AdminCountryDto exactly (backend/Application/Features/Countries/Dtos/CountryDtos.cs) —
// the shape both GET /admin/countries (list) and GET /admin/countries/{id} actually return.
// No top-level `name`: only `translations[]`.
export interface AdminCountryItem {
  id: string
  isoCode: string
  sortOrder: number
  translations: CountryTranslation[]
}

export interface CityTranslation {
  locale: Locale
  name: string
}

export interface City {
  id: string
  countryId: string
  sortOrder: number
  name: string
  translations?: CityTranslation[]
}

// Mirrors AdminCityDto exactly (backend/Application/Features/Cities/Dtos/CityDtos.cs) — the shape
// both GET /admin/cities (list) and GET /admin/cities/{id} actually return. No top-level `name`.
export interface AdminCityItem {
  id: string
  countryId: string
  sortOrder: number
  translations: CityTranslation[]
}

export interface DestinationTranslation {
  locale: Locale
  title: string
  summary: string
  description: string
  highlights: string[]
  metaTitle?: string
  metaDescription?: string
}

export interface Destination {
  id: string
  cityId: string
  slug: string
  heroImageUrl: string
  galleryUrls: string[]
  isFeatured: boolean
  isPublished: boolean
  sortOrder: number
  createdAtUtc: string
  updatedAtUtc: string
  title: string
  summary: string
  description: string
  highlights: string[]
  translations?: DestinationTranslation[]
}

// Mirrors AdminDestinationListItemDto exactly (backend/Application/Features/Destinations/Dtos/DestinationDtos.cs)
// — the shape GET /admin/destinations (list) actually returns. No title/summary/highlights: only CityName.
export interface AdminDestinationListItem {
  id: string
  slug: string
  cityName: string
  isPublished: boolean
  isFeatured: boolean
  createdAtUtc: string
}

// Mirrors UpsertDestinationInput exactly (same file) — the shape GET /admin/destinations/{id}
// actually returns. No top-level title/summary/description/highlights: only `translations[]`.
export interface AdminDestinationDetail {
  cityId: string
  slug: string
  heroImageUrl: string | null
  galleryUrls: string[]
  isPublished: boolean
  isFeatured: boolean
  sortOrder: number
  translations: DestinationTranslation[]
}

export interface ServiceTranslation {
  locale: Locale
  name: string
  description: string
}

export interface Service {
  id: string
  icon: string
  isPublished: boolean
  sortOrder: number
  name: string
  description: string
  translations?: ServiceTranslation[]
}

// Mirrors AdminServiceDto exactly (backend/Application/Features/Services/Dtos/ServiceDtos.cs) —
// the shape both GET /admin/services (list) and GET /admin/services/{id} actually return.
// No top-level name/description: only `translations[]`.
export interface AdminServiceItem {
  id: string
  icon: string
  isPublished: boolean
  sortOrder: number
  translations: ServiceTranslation[]
}

export interface OfferTranslation {
  locale: Locale
  title: string
  summary: string
  description: string
  metaTitle?: string
  metaDescription?: string
}

export interface Offer {
  id: string
  destinationId: string | null
  slug: string
  priceFrom: number
  currency: Currency
  durationDays: number | null
  /** Present on public list responses only (OfferListItemDto); absent on detail/admin responses. */
  heroImageUrl?: string | null
  /** Present on public detail responses only (OfferDetailDto); absent on public list responses. */
  galleryUrls?: string[]
  validUntilUtc: string | null
  isFeatured: boolean
  isPublished: boolean
  sortOrder: number
  serviceIds: string[]
  title: string
  summary: string
  description: string
  destination?: Pick<Destination, 'id' | 'slug' | 'title'> | null
  translations?: OfferTranslation[]
}

// Mirrors AdminOfferListItemDto exactly (backend/Application/Features/Offers/Dtos/OfferDtos.cs) —
// the shape GET /admin/offers (list) actually returns. No title/summary: only price/currency/dates.
export interface AdminOfferListItem {
  id: string
  slug: string
  priceFrom: number
  currency: Currency
  isPublished: boolean
  isFeatured: boolean
  createdAtUtc: string
}

// Mirrors UpsertOfferInput exactly (same file) — the shape GET /admin/offers/{id} actually
// returns. No top-level title/summary/description: only `translations[]`.
export interface AdminOfferDetail {
  destinationId: string | null
  slug: string
  priceFrom: number
  currency: Currency
  durationDays: number | null
  galleryUrls: string[]
  validUntilUtc: string | null
  isPublished: boolean
  isFeatured: boolean
  sortOrder: number
  serviceIds: string[]
  translations: OfferTranslation[]
}

export interface TestimonialTranslation {
  locale: Locale
  quote: string
}

export interface Testimonial {
  id: string
  authorName: string
  authorCountry: string
  avatarUrl: string | null
  rating: number
  isPublished: boolean
  sortOrder: number
  quote: string
  translations?: TestimonialTranslation[]
}

// Mirrors AdminTestimonialDto exactly (backend/Application/Features/Content/Dtos/ContentDtos.cs)
// — the shape both GET /admin/testimonials (list) and GET /admin/testimonials/{id} actually
// return. AuthorName/AuthorCountry/Rating are non-translated so they ARE top-level; `quote` is
// translated so it is NOT — only `translations[]` carries it.
export interface AdminTestimonialItem {
  id: string
  authorName: string
  authorCountry: string
  avatarUrl: string | null
  rating: number
  isPublished: boolean
  sortOrder: number
  translations: TestimonialTranslation[]
}

export interface FaqItemTranslation {
  locale: Locale
  question: string
  answer: string
}

export interface FaqItem {
  id: string
  category: string
  sortOrder: number
  isPublished: boolean
  question: string
  answer: string
  translations?: FaqItemTranslation[]
}

// Mirrors AdminFaqItemDto exactly (backend/Application/Features/Content/Dtos/ContentDtos.cs) —
// the shape both GET /admin/faq (list) and GET /admin/faq/{id} actually return. No top-level
// question/answer: only `translations[]`.
export interface AdminFaqItem {
  id: string
  category: string
  sortOrder: number
  isPublished: boolean
  translations: FaqItemTranslation[]
}

export interface SiteContentTranslation {
  locale: Locale
  title: string
  body: string
  extraJson?: string | null
}

export interface SiteContent {
  id: string
  key: string
  title: string
  body: string
  extraJson?: string | null
  translations?: SiteContentTranslation[]
}

// Mirrors AdminSiteContentDto exactly (backend/Application/Features/Content/Dtos/ContentDtos.cs)
// — the shape both GET /admin/site-content (list) and GET /admin/site-content/{id} actually
// return. No top-level title/body: only `translations[]`.
export interface AdminSiteContentItem {
  id: string
  key: string
  translations: SiteContentTranslation[]
}

export interface SourceUtm {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

export interface TravelRequest {
  id: string
  createdAtUtc: string
  status: TravelRequestStatus
  lastName: string
  firstName: string
  middleName: string | null
  phone: string
  preferredLocale: Locale
  destinationId: string | null
  destinationSnapshotTitle: string | null
  offerId: string | null
  offerSnapshotTitle: string | null
  passengersAdults: number
  passengersChildren: number
  /** One entry per child (length === passengersChildren), 0-17. */
  childrenAges: number[]
  message: string | null
  /** ISO date (YYYY-MM-DD, .NET DateOnly) — no time/timezone component. */
  departureDate: string
  returnDate: string | null
  /** Server-generated filenames — never a public URL; fetch via the authenticated admin
   * passport-photo endpoint (see admin/travelRequestsApi.adminPassportPhotoUrl). */
  passportPhotoPaths: string[]
  consentAcceptedAtUtc: string
  passportDataConsentAcceptedAtUtc: string
  sourceUtm: SourceUtm | null
  sourceIp: string | null
  sourceLocale: Locale
  assignedAdminUserId: string | null
  assignedAdminDisplayName: string | null
  dealValue: number | null
  dealCurrency: Currency | null
  nextFollowUpAtUtc: string | null
}

export interface TravelRequestNote {
  id: string
  travelRequestId: string
  text: string
  createdAtUtc: string
  authorAdminUserId: string
  authorDisplayName: string
}

export interface AdminStaff {
  id: string
  displayName: string
  email: string
  role: AdminRole
  isActive: boolean
  createdAtUtc: string
}

/** Minimal shape for "assign to" dropdowns — active staff only. */
export interface AssignableAdmin {
  id: string
  displayName: string
}

// Mirrors backend AdminUserDto exactly (Application/Features/Auth/Dtos/AuthDtos.cs) — every
// endpoint that returns an AdminUser (login/me/bootstrap) maps through that same DTO, which only
// carries these four fields. `isActive`/`createdAtUtc` used to be declared here despite the API
// never sending them — a strict-TS-but-still-a-lie interface (see docs/PROGRESS.md).
export interface AdminUser {
  id: string
  email: string
  displayName: string
  role: AdminRole
}

export type FlightStatus = 'Scheduled' | 'Departed' | 'Cancelled'
export type FlightPassengerSource = 'Manual' | 'Crm'

export interface Flight {
  id: string
  flightNumber: string
  originCity: string
  destinationCity: string
  departureAtUtc: string
  status: FlightStatus
  passengerCount: number
  createdAtUtc: string
}

export interface FlightDetail {
  id: string
  flightNumber: string
  originCity: string
  destinationCity: string
  departureAtUtc: string
  status: FlightStatus
  createdByAdminUserId: string | null
  createdByAdminDisplayName: string | null
  createdAtUtc: string
}

export interface FlightPassenger {
  id: string
  flightId: string
  source: FlightPassengerSource
  travelRequestId: string | null
  fullName: string
  phone: string
  addedByAdminUserId: string | null
  addedByAdminDisplayName: string | null
  addedAtUtc: string
}

export interface PassengerRegistryItem {
  id: string
  flightId: string
  flightNumber: string
  flightDepartureAtUtc: string
  source: FlightPassengerSource
  travelRequestId: string | null
  fullName: string
  phone: string
  addedByAdminUserId: string | null
  addedByAdminDisplayName: string | null
  addedAtUtc: string
}

export interface AuditLog {
  id: string
  entityType: string
  entityId: string
  action: string
  adminUserId: string | null
  /** Looked up server-side from AdminUsers by adminUserId; null only when adminUserId itself is
   * null (a system-initiated entry) or genuinely orphaned (no matching admin row). */
  adminDisplayName: string | null
  /** Backend serializes `AuditLogDto.TimestampUtc` — matching the field name here (was
   * mistakenly `timestamp`, which never matched any real response field, so every render of an
   * audit entry's time showed "Invalid Date"). */
  timestampUtc: string
  detailsJson: string | null
}
