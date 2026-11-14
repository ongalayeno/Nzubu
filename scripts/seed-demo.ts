import 'dotenv/config';
import { migrate, pool } from '../server/db.ts';
import { hashPassword } from '../server/auth.ts';
import {
  INITIAL_LISTINGS,
  INITIAL_BOOKINGS,
  INITIAL_VIEWINGS,
  INITIAL_MISSIONS,
} from '../src/data/mockData.ts';

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'NzubuPilot2026!';

function toSeedUuid(group: string, rawId: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId)) return rawId;
  const digits = rawId.replace(/\D/g, '') || '1';
  return `00000000-0000-4000-${group}-${digits.padStart(12, '0').slice(-12)}`;
}

async function upsertUser(email: string, phone: string, role: 'CLIENT' | 'PARTNER' | 'FIELD_AGENT' | 'OPERATIONS_ADMIN') {
  const passwordHash = hashPassword(DEMO_PASSWORD);
  const res = await pool.query(
    `INSERT INTO users(email, phone, role, password_hash, email_verified_at)
     VALUES($1, $2, $3, $4, now())
     ON CONFLICT(email) DO UPDATE SET role=EXCLUDED.role, password_hash=COALESCE(users.password_hash, EXCLUDED.password_hash), email_verified_at=COALESCE(users.email_verified_at, now())
     RETURNING id`,
    [email.toLowerCase(), phone, role, passwordHash]
  );
  return res.rows[0].id as string;
}

async function main() {
  await migrate();

  const clientId = await upsertUser('client@nzubu.cd', '+243810000001', 'CLIENT');
  const partnerId = await upsertUser('partenaire@nzubu.cd', '+243810000002', 'PARTNER');
  const agentId = await upsertUser('agent@nzubu.cd', '+243810000003', 'FIELD_AGENT');
  const adminId = await upsertUser('admin@nzubu.cd', '+243810000004', 'OPERATIONS_ADMIN');

  for (const item of INITIAL_LISTINGS) {
    const listingUuid = toSeedUuid('b000', item.id);
    const status = item.publicationStatus || 'PUBLISHED';
    const data = {
      description: item.description,
      furnished: item.furnishingStatus === 'FURNISHED',
      furnishingStatus: item.furnishingStatus,
      unitType: item.unitType,
      quartier: item.quartier,
      landmark: item.landmark,
      exactAddressPrivate: item.exactAddressPrivate,
      bedroomsCount: item.bedroomsCount,
      bathroomsCount: item.bathroomsCount,
      maxOccupants: item.maxOccupants,
      surfaceM2: item.surfaceM2,
      floor: item.floor,
      sharedSpaces: item.sharedSpaces,
      utilities: item.utilities,
      media: item.media,
      pricing: item.pricing,
      verification: item.verification,
      partner: item.partner,
      availabilityStatus: item.availabilityStatus,
      cancellationPolicy: item.cancellationPolicy,
      conditions: item.cancellationPolicy?.summary || 'Conditions standards Kinshasa',
      securityDepositMonths: item.pricing.securityDepositMonths ?? 0,
      chargesCdf: 0,
    };

    await pool.query(
      `INSERT INTO listings(id, partner_id, status, title, commune, rental_mode, price_cdf, verified_until, data)
       VALUES($1, $2, $3, $4, $5, $6, $7, $8::date, $9::jsonb)
       ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title, data=EXCLUDED.data, status=EXCLUDED.status, verified_until=EXCLUDED.verified_until`,
      [
        listingUuid,
        partnerId,
        status,
        item.title,
        item.commune,
        item.rentalMode,
        item.pricing.amountCdf,
        item.verification?.verifiedUntil || '2027-12-31',
        JSON.stringify(data),
      ]
    );
  }

  for (const b of INITIAL_BOOKINGS) {
    const id = toSeedUuid('8000', b.id);
    const listingUuid = toSeedUuid('b000', b.listingId);
    const status = b.status === 'CUSTOMER_ACCEPTED' || b.status === 'PAYMENT_PENDING' ? 'HOST_ACCEPTED_TERMS' : b.status;
    await pool.query(
      `INSERT INTO bookings(id, listing_id, client_id, check_in, check_out, status, price_cdf, advance_cdf, hold_expires_at, payment_reference, payment_method, occupants, accepted_terms_at, conditions_snapshot, idempotency_key)
       VALUES($1, $2, $3, $4::date, $5::date, $6, $7, $8, $9::timestamptz, $10, $11, $12, now(), 'Conditions standards Kinshasa', $13)
       ON CONFLICT(id) DO NOTHING`,
      [
        id,
        listingUuid,
        clientId,
        b.checkInDate,
        b.checkOutDate,
        status,
        b.totalPriceCdf,
        b.advanceAmountCdf,
        b.expiresAt || new Date(Date.now() + 30 * 60_000).toISOString(),
        b.paymentReference || null,
        b.paymentMethod || null,
        b.adultsCount || 1,
        `seed-${b.id}`,
      ]
    );
  }

  for (const v of INITIAL_VIEWINGS) {
    const id = toSeedUuid('9000', v.id);
    const listingUuid = toSeedUuid('b000', v.listingId);
    const status = v.status === 'PROPOSED_SLOT' || v.status === 'CONFIRMED' ? 'SCHEDULED' : v.status;
    await pool.query(
      `INSERT INTO viewings(id, listing_id, client_id, slots, status, outcome_note, handled_by)
       VALUES($1, $2, $3, $4::jsonb, $5, $6, $7)
       ON CONFLICT(id) DO NOTHING`,
      [
        id,
        listingUuid,
        clientId,
        JSON.stringify(v.slots),
        status,
        v.meetingPoint || null,
        adminId,
      ]
    );
  }

  for (const m of INITIAL_MISSIONS) {
    const id = toSeedUuid('a000', m.id);
    const listingUuid = toSeedUuid('b000', m.listingId || INITIAL_LISTINGS[0]?.id || 'nz-001');
    await pool.query(
      `INSERT INTO missions(id, listing_id, agent_id, status, outcome, report, snel_meter_number, snel_meter_index, regideso_pressure_bar, outage_tracker, agent_signature, sha256_seal, duration_minutes, submitted_at)
       VALUES($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13, now())
       ON CONFLICT(id) DO NOTHING`,
      [
        id,
        listingUuid,
        agentId,
        m.status,
        m.decisionOutcome || null,
        JSON.stringify({
          checks: m.checklist,
          gps: m.gpsCoordinates || { latitude: -4.325, longitude: 15.322, accuracyMeters: 12 },
          notes: m.notes || '',
          photoIds: [],
          photos: m.photos || [],
        }),
        m.snelMeterNumber || null,
        m.snelMeterIndex || null,
        m.regidesoPressureBar ?? null,
        m.outageTracker ? JSON.stringify(m.outageTracker) : null,
        m.agentSignature ? JSON.stringify(m.agentSignature) : null,
        m.sha256Seal || null,
        m.durationMinutes ?? 28,
      ]
    );
  }

  const sampleAds = [
    {
      id: 'ad-seed-solar-01',
      title: 'Kits Solaires Hybrides 5kVA — Zéro délestage à Kinshasa',
      advertiserName: 'Kinshasa Solar Energy',
      advertiserPhone: '+243815550101',
      category: 'SOLAR_ENERGY',
      format: 'VERTICAL_VIDEO_FEED',
      mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop&q=80',
      tagline: 'Autonomie 24h/24 pour villas & appartements à Gombe et Ngaliema',
      description: 'Installation complète onduleur hybride + batteries lithium garantie 5 ans.',
      ctaText: 'Demander un devis WhatsApp',
      ctaActionType: 'WHATSAPP',
      ctaTarget: '243815550101',
      badgeLabel: 'Partenaire Énergie',
      pricePaidCdf: 150000,
      durationDays: 30,
      featuredListingId: toSeedUuid('b000', 'nz-002'),
    },
    {
      id: 'ad-seed-move-01',
      title: 'Déménagement Sécurisé Gombe • Ngaliema • Limete',
      advertiserName: 'Congo Express Relocation',
      advertiserPhone: '+243824440202',
      category: 'SERVICES_DEMENAGEMENT',
      format: 'CATALOG_BANNER',
      mediaUrl: 'https://images.unsplash.com/photo-1600518464441-91547dea328b?w=800&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1600518464441-91547dea328b?w=800&auto=format&fit=crop&q=80',
      tagline: 'Camions capitonnés, emballage complet & assurance casse incluse',
      description: 'Intervention rapide sous 24h partout à Kinshasa.',
      ctaText: 'Contacter sur WhatsApp',
      ctaActionType: 'WHATSAPP',
      ctaTarget: '243824440202',
      badgeLabel: 'Sponsorisé',
      pricePaidCdf: 100000,
      durationDays: 30,
      featuredListingId: null,
    },
  ];

  for (const ad of sampleAds) {
    await pool.query(
      `INSERT INTO sponsored_ads(id, advertiser_id, featured_listing_id, title, advertiser_name, advertiser_phone, category, format, media_url, thumbnail_url, tagline, description, cta_text, cta_action_type, cta_target, badge_label, price_paid_cdf, payment_provider, duration_days, starts_at, expires_at, status)
       VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'MAISHAPAY', $18, now(), now() + ($18::int * interval '1 day'), 'ACTIVE')
       ON CONFLICT(id) DO NOTHING`,
      [
        ad.id, partnerId, ad.featuredListingId, ad.title, ad.advertiserName, ad.advertiserPhone,
        ad.category, ad.format, ad.mediaUrl, ad.thumbnailUrl, ad.tagline, ad.description,
        ad.ctaText, ad.ctaActionType, ad.ctaTarget, ad.badgeLabel, ad.pricePaidCdf, ad.durationDays,
      ]
    );
  }

  console.info('Seed NZUBU terminé avec succès !');
  console.info('Comptes de démonstration (mot de passe : ' + DEMO_PASSWORD + ') :');
  console.info('  - Client     : client@nzubu.cd');
  console.info('  - Partenaire : partenaire@nzubu.cd');
  console.info('  - Agent      : agent@nzubu.cd');
  console.info('  - Admin      : admin@nzubu.cd');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
