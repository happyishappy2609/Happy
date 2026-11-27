import type { GlossaryTerm, LangCode, TMUnit } from '@/types'

type G = [source: string, target: string, lang: LangCode, client: string | null, domain: string, status: GlossaryTerm['status'], definition: string, notes?: string, forbidden?: string[], daysAgo?: number]

const glossaryRows: G[] = [
  ['Account', 'Compte', 'fr', null, 'General UI', 'approved', 'A user profile that holds credentials and settings.', 'Masculine noun: "votre compte".', undefined, 40],
  ['Dashboard', 'Tableau de bord', 'fr', null, 'General UI', 'approved', 'Overview screen summarizing key information.', undefined, undefined, 38],
  ['Sign in', 'Se connecter', 'fr', null, 'General UI', 'approved', 'Action of authenticating into an account.', 'Use the infinitive on buttons and links.', ['Ouvrir une session'], 36],
  ['Checkout', 'Paiement', 'fr', 'c-nova', 'E-commerce', 'approved', 'The final step where a customer pays for the order.', 'Never use "caisse" in the online storefront.', ['Caisse'], 12],
  ['Subscription', 'Abonnement', 'fr', null, 'Billing', 'approved', 'Recurring paid plan.', undefined, undefined, 30],
  ['Security', 'Sécurité', 'fr', null, 'General UI', 'approved', 'Protection of the account and data.', undefined, undefined, 33],
  ['Workspace', 'Espace de travail', 'fr', null, 'General UI', 'approved', 'Shared area where a team collaborates.', undefined, undefined, 29],
  ['Two-factor authentication', 'Authentification à deux facteurs', 'fr', null, 'Security', 'approved', 'Sign-in method that requires a second verification factor.', 'Do not abbreviate in UI. "2FA" acceptable in tooltips only.', ['Vérification en deux étapes'], 18],
  ['Cart', 'Panier', 'fr', 'c-nova', 'E-commerce', 'approved', 'Collection of items a customer intends to buy.', undefined, ['Chariot', 'Caddie'], 14],
  ['Wishlist', 'Liste de souhaits', 'fr', 'c-nova', 'E-commerce', 'approved', 'Saved list of products for later.', undefined, ['Favoris'], 9],
  ['Order', 'Commande', 'fr', 'c-nova', 'E-commerce', 'pending', 'A confirmed purchase.', 'Pending client confirmation for "commande" vs "achat" in emails.', undefined, 1],
  ['Cart', 'Warenkorb', 'de', 'c-nova', 'E-commerce', 'approved', 'Collection of items a customer intends to buy.', undefined, ['Einkaufswagen'], 14],
  ['Dashboard', 'Dashboard', 'de', 'c-aurora', 'Software UI', 'approved', 'Main app screen showing connected devices.', 'Keep in English per Aurora UI convention.', ['Übersicht'], 21],
  ['Account', 'Konto', 'de', null, 'General UI', 'approved', 'A user profile that holds credentials and settings.', undefined, undefined, 40],
  ['Two-factor authentication', 'Zwei-Faktor-Authentifizierung', 'de', null, 'Security', 'approved', 'Sign-in method that requires a second verification factor.', undefined, undefined, 18],
  ['Gift card', 'Tarjeta regalo', 'es', 'c-nova', 'E-commerce', 'approved', 'Prepaid card redeemable in store or online.', undefined, ['Tarjeta de regalo'], 10],
  ['Side effects', 'Efectos secundarios', 'es', 'c-helix', 'Medical', 'approved', 'Unintended effects of a medication.', undefined, ['Efectos laterales'], 26],
  ['Medical record', 'Historia clínica', 'es', 'c-helix', 'Medical', 'approved', 'Documented medical history of a patient.', undefined, ['Registro médico'], 26],
  ['Account', 'Cuenta', 'es', null, 'General UI', 'approved', 'A user profile that holds credentials and settings.', undefined, undefined, 40],
  ['Account', 'アカウント', 'ja', null, 'General UI', 'approved', 'A user profile that holds credentials and settings.', undefined, undefined, 40],
  ['Workspace', 'ワークスペース', 'ja', null, 'General UI', 'approved', 'Shared area where a team collaborates.', undefined, undefined, 29],
  ['Beneficial owner', '実質的支配者', 'ja', 'c-finedge', 'Finance & Compliance', 'approved', 'Natural person who ultimately owns or controls a customer.', 'Regulatory term per Japanese AML guidelines.', ['受益者'], 22],
  ['Two-factor authentication', '2段階認証', 'ja', null, 'Security', 'pending', 'Sign-in method that requires a second verification factor.', 'Reviewer proposed "二要素認証"; awaiting client decision.', undefined, 2],
  ['Arena', '아레나', 'ko', 'c-orbit', 'Gaming lore', 'approved', 'Competitive PvP game mode location.', 'Lore sheet term.', ['경기장'], 16],
  ['Season Pass', '시즌 패스', 'ko', 'c-orbit', 'Gaming', 'pending', 'Paid seasonal reward track.', undefined, undefined, 3],
  ['Blood glucose meter', 'Glucometro', 'it', 'c-helix', 'Medical devices', 'approved', 'Device that measures blood glucose concentration.', undefined, ['Misuratore di zucchero nel sangue'], 24],
  ['Check-in', 'Check-in', 'it', 'c-verde', 'Travel', 'approved', 'Arrival registration at accommodation.', 'Keep English loanword.', undefined, 11],
  ['Loyalty points', 'Pontos de fidelidade', 'pt', 'c-verde', 'Travel', 'pending', 'Points earned through the Verde loyalty program.', undefined, undefined, 4],
  ['Smart Hub', '智能中枢', 'zh', 'c-aurora', 'Consumer electronics', 'approved', 'Aurora home automation controller.', 'Product name — use consistently.', ['智能中心'], 20],
  ['Stardust', '星尘', 'zh', 'c-orbit', 'Gaming lore', 'approved', 'In-game upgrade currency.', undefined, ['星辰之尘'], 16],
  ['Legacy plan', 'Ancienne offre', 'fr', null, 'Billing', 'deprecated', 'Former pricing plan name.', 'Deprecated after pricing update — use "Offre précédente".', undefined, 60],
]

export function buildGlossary(now: number): GlossaryTerm[] {
  const editors = ['u-alex', 'm-claire', 'm-maria', 'm-kenji', 'm-ana', 'm-hana']
  return glossaryRows.map(([source, target, lang, clientId, domain, status, definition, usageNotes, forbidden, daysAgo], i) => ({
    id: `t-${1001 + i}`,
    source,
    target,
    sourceLang: 'en',
    targetLang: lang,
    clientId,
    domain,
    definition,
    usageNotes: usageNotes ?? '',
    status,
    forbidden,
    updatedAt: new Date(now - (daysAgo ?? 10) * 86_400_000 - i * 3_600_000).toISOString(),
    updatedBy: editors[i % editors.length]!,
  }))
}

type T = [source: string, target: string, lang: LangCode, client: string | null, match: number, status: TMUnit['status'], uses: number, daysAgo: number]

const tmRows: T[] = [
  ['Your subscription will renew automatically unless cancelled.', "Votre abonnement sera renouvelé automatiquement sauf si vous l'annulez.", 'fr', 'c-nova', 100, 'approved', 42, 34],
  ['Please save your changes before closing the window.', 'Veuillez enregistrer vos modifications avant de fermer la fenêtre.', 'fr', null, 100, 'approved', 87, 52],
  ['Enable two-factor authentication.', "Activez l'authentification à deux facteurs.", 'fr', null, 100, 'approved', 61, 41],
  ['Get started in seconds.', 'Commencez en quelques secondes.', 'fr', 'c-nova', 95, 'approved', 18, 20],
  ['Orders over €75 qualify for free shipping.', 'Les commandes de plus de 75 € bénéficient de la livraison gratuite.', 'fr', 'c-nova', 92, 'approved', 26, 15],
  ['Returns are accepted within 14 days of delivery.', 'Les retours sont acceptés dans les 14 jours suivant la livraison.', 'fr', 'c-nova', 94, 'approved', 33, 25],
  ['Proceed to checkout', 'Passer au paiement', 'fr', 'c-nova', 100, 'approved', 128, 12],
  ['Add to wishlist', 'Ajouter à la liste de souhaits', 'fr', 'c-nova', 100, 'approved', 96, 9],
  ['You have {count} items in your cart.', 'Vous avez {count} articles dans votre panier.', 'fr', 'c-nova', 100, 'approved', 74, 9],
  ['Your order has been shipped.', 'Votre commande a été expédiée.', 'fr', 'c-nova', 100, 'approved', 112, 30],
  ['Continue shopping', 'Continuer mes achats', 'fr', 'c-nova', 100, 'approved', 140, 30],
  ['Track your order', 'Suivre votre commande', 'fr', 'c-nova', 100, 'approved', 97, 22],
  ['Sign in to your account', 'Se connecter à votre compte', 'fr', null, 100, 'approved', 310, 60],
  ['Your balance is $980.00.', 'Votre solde est de 980,00 $.', 'fr', 'c-finedge', 87, 'needs_review', 6, 5],
  ['Open the Dashboard to view your devices.', 'Öffne das Dashboard, um deine Geräte anzuzeigen.', 'de', 'c-aurora', 100, 'approved', 22, 18],
  ['Tap Pair to connect your headphones.', 'Tippe auf „Koppeln“, um deine Kopfhörer zu verbinden.', 'de', 'c-aurora', 86, 'approved', 14, 16],
  ['Discount does not apply to gift cards.', 'Der Rabatt gilt nicht für Geschenkkarten.', 'de', 'c-nova', 88, 'approved', 9, 40],
  ['Add to cart', 'In den Warenkorb legen', 'de', 'c-nova', 100, 'approved', 410, 55],
  ['Your changes have been saved.', 'Ihre Änderungen wurden gespeichert.', 'de', null, 100, 'approved', 260, 70],
  ['Take one tablet daily with food.', 'Tome un comprimido al día con alimentos.', 'es', 'c-helix', 89, 'approved', 12, 21],
  ['Do not use if you are pregnant.', 'No lo use si está embarazada.', 'es', 'c-helix', 85, 'approved', 8, 33],
  ['Possible side effects include nausea.', 'Los posibles efectos secundarios incluyen náuseas.', 'es', 'c-helix', 91, 'approved', 15, 17],
  ['Machine wash cold. Do not bleach.', 'Lavar a máquina en frío. No usar lejía.', 'es', 'c-nova', 84, 'approved', 37, 44],
  ['Your transfer has been completed.', '送金が完了しました。', 'ja', 'c-finedge', 90, 'approved', 48, 26],
  ['Annual interest rate: 2.5%', '年利：2.5%', 'ja', 'c-finedge', 100, 'approved', 19, 8],
  ['Restart the app and try again.', 'アプリを再起動して、もう一度お試しください。', 'ja', null, 100, 'approved', 63, 50],
  ['This item cannot be exchanged.', '이 아이템은 교환할 수 없습니다.', 'ko', 'c-orbit', 88, 'approved', 21, 14],
  ['{player} has left your squad.', '{player}님이 스쿼드를 떠났습니다.', 'ko', 'c-orbit', 90, 'approved', 30, 19],
  ['Offer valid until December 31.', 'Offerta valida fino al 31 dicembre.', 'it', 'c-nova', 93, 'approved', 11, 330],
  ['Free cancellation up to 24 hours before check-in.', 'Cancellazione gratuita fino a 24 ore prima del check-in.', 'it', 'c-verde', 94, 'approved', 17, 28],
  ['Do not stop taking this medication without consulting your doctor.', 'Não pare de tomar este medicamento sem consultar seu médico.', 'pt', 'c-helix', 90, 'approved', 9, 23],
  ['Past performance is not indicative of future results.', '过去的业绩并不代表未来的表现。', 'zh', 'c-finedge', 92, 'approved', 27, 36],
  ['Connect to your Smart Hub', '连接到您的智能中枢', 'zh', 'c-aurora', 100, 'approved', 15, 20],
  ['Points expire after 18 months of inactivity.', 'Los puntos caducan tras 18 meses de inactividad.', 'es', 'c-verde', 93, 'draft', 2, 3],
]

export function buildTM(now: number): TMUnit[] {
  const editors = ['m-claire', 'm-maria', 'm-kenji', 'm-ana', 'm-hana', 'u-alex', 'm-julien', 'm-lukas']
  return tmRows.map(([source, target, lang, clientId, lastMatch, status, usageCount, daysAgo], i) => ({
    id: `tm-${5001 + i}`,
    source,
    target,
    sourceLang: 'en',
    targetLang: lang,
    clientId,
    lastMatch,
    status,
    usageCount,
    updatedAt: new Date(now - daysAgo * 86_400_000 - i * 1_800_000).toISOString(),
    updatedBy: editors[i % editors.length]!,
  }))
}
