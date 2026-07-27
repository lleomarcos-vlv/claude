/// Central catalogue of REST paths, all relative to `${Env.apiV1}`
/// (i.e. `${API_BASE_URL}/api/v1`). Keeping them here avoids stringly-typed
/// URLs scattered across controllers.
class Endpoints {
  const Endpoints._();

  // ── Auth ───────────────────────────────────────────────────────────────
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refresh = '/auth/refresh';
  static const String me = '/me';

  // ── Client jobs ────────────────────────────────────────────────────────
  static const String jobs = '/jobs';
  static String job(String id) => '/jobs/$id';
  static String jobMedia(String id) => '/jobs/$id/media';
  static String analyze(String id) => '/jobs/$id/analyze';
  static String publish(String id) => '/jobs/$id/publish';
  static String jobOffers(String id) => '/jobs/$id/offers';
  static String chooseOffer(String offerId) => '/offers/$offerId/choose';
  static String approve(String id) => '/jobs/$id/approve';
  static String review(String id) => '/jobs/$id/review';

  // ── Gardener ───────────────────────────────────────────────────────────
  static const String marketplaceFeed = '/marketplace/feed';
  static String checkin(String id) => '/jobs/$id/checkin';
  static String start(String id) => '/jobs/$id/start';
  static String checkout(String id) => '/jobs/$id/checkout';

  // ── Chat ───────────────────────────────────────────────────────────────
  static String messages(String id) => '/jobs/$id/messages';

  // ── Payments ───────────────────────────────────────────────────────────
  static String paymentIntent(String id) => '/jobs/$id/payment/intent';
}
