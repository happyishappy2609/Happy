import type { IssueCategory, IssueStatus, LangCode, Severity } from '@/types'

export interface IssueSeedExtra {
  status?: IssueStatus
  assignee?: string
  daysAgo?: number
  resolvedDaysAgo?: number
  resolution?: 'accepted' | 'edited' | 'manual'
  ignoreReason?: string
  detectedBy?: 'ai' | 'rule' | 'reviewer'
  targetSpan?: string
  sourceSpan?: string
  preferredTerm?: string
  ruleId?: string
}

export type IssueSeed = [
  projectId: string,
  lang: LangCode,
  severity: Severity,
  category: IssueCategory,
  confidence: number,
  source: string,
  target: string,
  suggestion: string,
  explanation: string,
  extra?: IssueSeedExtra,
]

/** Existing findings in the workspace when the demo starts. */
export const issueSeeds: IssueSeed[] = [
  // ── Nova E-commerce (EN → FR) — the hero demo project ─────────────────────────
  ['p-nova-ecom', 'fr', 'critical', 'accuracy', 96, 'Your subscription will renew automatically unless cancelled.', 'Votre abonnement ne sera pas renouvelé automatiquement.', "Votre abonnement sera renouvelé automatiquement sauf si vous l'annulez.", 'The target translation reverses the source meaning and changes the renewal condition. Customers would be told their subscription will not renew.', { assignee: 'm-claire', daysAgo: 3, targetSpan: 'ne sera pas renouvelé', sourceSpan: 'will renew automatically unless cancelled' }],
  ['p-nova-ecom', 'fr', 'critical', 'mistranslation', 94, 'Orders over €50 qualify for free shipping.', 'Les commandes de moins de 50 € bénéficient de la livraison gratuite.', 'Les commandes de plus de 50 € bénéficient de la livraison gratuite.', '"Over" was translated as "de moins de" (under), inverting the free-shipping condition. This affects pricing terms shown at checkout.', { assignee: 'm-claire', daysAgo: 3, targetSpan: 'de moins de', sourceSpan: 'over' }],
  ['p-nova-ecom', 'fr', 'major', 'terminology', 91, 'Enable two-factor authentication.', 'Activer la vérification en deux étapes.', 'Activer l’authentification à deux facteurs.', "The target translation does not follow the client's approved terminology.", { assignee: 'm-julien', daysAgo: 3, targetSpan: 'vérification en deux étapes', preferredTerm: 'Authentification à deux facteurs', detectedBy: 'rule', ruleId: 'glossary' }],
  ['p-nova-ecom', 'fr', 'major', 'omission', 89, 'Please save your changes before closing the window.', 'Veuillez fermer la fenêtre.', 'Veuillez enregistrer vos modifications avant de fermer la fenêtre.', 'The instruction to save changes is missing from the target translation.', { daysAgo: 3, sourceSpan: 'save your changes before' }],
  ['p-nova-ecom', 'fr', 'major', 'terminology', 87, 'Proceed to checkout', 'Passer à la caisse', 'Passer au paiement', 'Nova Retail glossary requires "Paiement" for "Checkout". "Caisse" refers to a physical till and is inconsistent with the rest of the storefront.', { assignee: 'm-julien', daysAgo: 2, targetSpan: 'la caisse', preferredTerm: 'Paiement', detectedBy: 'rule', ruleId: 'glossary' }],
  ['p-nova-ecom', 'fr', 'major', 'accuracy', 84, 'Returns are accepted within 30 days of delivery.', 'Les retours sont acceptés dans les 30 jours suivant la commande.', 'Les retours sont acceptés dans les 30 jours suivant la livraison.', 'The return window starts at delivery in the source, but at order date in the translation. This shortens the legal return period.', { daysAgo: 2, targetSpan: 'la commande', sourceSpan: 'delivery' }],
  ['p-nova-ecom', 'fr', 'minor', 'locale', 78, 'Your balance is $1,250.50.', 'Votre solde est $1,250.50.', 'Votre solde est de 1 250,50 $.', 'Currency formatting may not follow the selected French locale conventions (decimal comma, space as thousands separator, symbol after the amount).', { daysAgo: 3, targetSpan: '$1,250.50' }],
  ['p-nova-ecom', 'fr', 'minor', 'fluency', 82, 'Get started in minutes.', 'Obtenir commencé dans minutes.', 'Commencez en quelques minutes.', 'The target sentence is grammatically unnatural — a literal word-for-word rendering of the English phrasal verb.', { daysAgo: 2, targetSpan: 'Obtenir commencé dans minutes' }],
  ['p-nova-ecom', 'fr', 'minor', 'style', 80, 'Discover our new collection', 'Découvre notre nouvelle collection', 'Découvrez notre nouvelle collection', 'Nova Retail style guide requires the formal "vous" form. The informal imperative "Découvre" is used here.', { daysAgo: 2, targetSpan: 'Découvre', assignee: 'm-julien' }],
  ['p-nova-ecom', 'fr', 'minor', 'punctuation', 72, 'Need help? Contact our support team.', "Besoin d'aide? Contactez notre équipe d'assistance.", "Besoin d'aide ? Contactez notre équipe d'assistance.", 'French typography requires a (narrow) non-breaking space before "?".', { daysAgo: 2, targetSpan: "d'aide?" }],
  ['p-nova-ecom', 'fr', 'major', 'terminology', 90, 'Shopping cart', 'Chariot', 'Panier', '"Chariot" is a literal rendering. Client glossary requires "Panier".', { status: 'resolved', resolution: 'accepted', daysAgo: 6, resolvedDaysAgo: 5, assignee: 'm-julien', preferredTerm: 'Panier', detectedBy: 'rule', ruleId: 'glossary' }],
  ['p-nova-ecom', 'fr', 'major', 'omission', 86, 'Enter the promo code at checkout.', 'Saisissez le code promo.', 'Saisissez le code promo lors du paiement.', 'The location where the code should be entered ("at checkout") is missing.', { status: 'resolved', resolution: 'edited', daysAgo: 6, resolvedDaysAgo: 4, assignee: 'm-claire', sourceSpan: 'at checkout' }],
  ['p-nova-ecom', 'fr', 'minor', 'consistency', 58, 'Join Nova Plus for exclusive offers', 'Rejoignez Nova Plus pour des offres exclusives', 'Rejoignez Nova Plus pour des offres exclusives', 'Possible untranslated text: "Nova Plus".', { status: 'ignored', ignoreReason: 'Brand name — do not translate (client style guide).', daysAgo: 6, resolvedDaysAgo: 5, assignee: 'm-claire' }],

  // ── Aurora Mobile App (EN → DE) ───────────────────────────────────────────────
  ['p-aurora-app', 'de', 'major', 'terminology', 88, 'Open the Dashboard to view your devices.', 'Öffne die Übersicht, um deine Geräte anzuzeigen.', 'Öffne das Dashboard, um deine Geräte anzuzeigen.', 'Aurora glossary keeps "Dashboard" untranslated in German UI. "Übersicht" conflicts with the app navigation label.', { assignee: 'm-lukas', daysAgo: 4, targetSpan: 'die Übersicht', preferredTerm: 'Dashboard', detectedBy: 'rule', ruleId: 'glossary' }],
  ['p-aurora-app', 'de', 'minor', 'style', 76, 'Tap Pair to connect your speaker.', 'Tippen Sie auf „Koppeln“, um Ihren Lautsprecher zu verbinden.', 'Tippe auf „Koppeln“, um deinen Lautsprecher zu verbinden.', 'Aurora consumer UI uses the informal "du" form. This segment uses formal "Sie".', { daysAgo: 4, targetSpan: 'Tippen Sie', detectedBy: 'reviewer', assignee: 'm-maria' }],
  ['p-aurora-app', 'de', 'minor', 'locale', 81, 'Firmware updated on 03/14/2025', 'Firmware aktualisiert am 03/14/2025', 'Firmware aktualisiert am 14.03.2025', 'US date format (MM/DD/YYYY) used in a German locale. Expected DD.MM.YYYY.', { daysAgo: 3, targetSpan: '03/14/2025' }],
  ['p-aurora-app', 'de', 'critical', 'accuracy', 95, 'Do not expose the device to water.', 'Setzen Sie das Gerät Wasser aus.', 'Setzen Sie das Gerät keinem Wasser aus.', 'Negation is missing: the translation instructs users to expose the device to water.', { status: 'resolved', resolution: 'accepted', daysAgo: 9, resolvedDaysAgo: 8, assignee: 'm-maria' }],
  ['p-aurora-app', 'de', 'minor', 'punctuation', 74, 'Pairing failed. Try again?', 'Kopplung fehlgeschlagen. Erneut versuchen.', 'Kopplung fehlgeschlagen. Erneut versuchen?', 'Question mark from the source is missing.', { status: 'resolved', resolution: 'accepted', daysAgo: 9, resolvedDaysAgo: 2, assignee: 'm-lukas', detectedBy: 'rule', ruleId: 'punctuation' }],

  // ── FinEdge Platform (EN → JA) ────────────────────────────────────────────────
  ['p-finedge-platform', 'ja', 'minor', 'style', 79, 'Your transfer is being processed.', '送金を処理しているよ。', '送金を処理しています。', 'Casual sentence ending "〜よ" breaks the formal desu/masu register required by the FinEdge style guide.', { daysAgo: 5, targetSpan: 'しているよ', assignee: 'm-kenji' }],
  ['p-finedge-platform', 'ja', 'info', 'consistency', 66, 'Available balance', '利用可能な残高', '利用可能残高', 'Twelve other segments use the compound form "利用可能残高". Consider aligning for consistency.', { daysAgo: 5 }],
  ['p-finedge-platform', 'ja', 'critical', 'numbers', 97, 'Annual interest rate: 2.5%', '年利：25%', '年利：2.5%', 'The interest rate was changed from 2.5% to 25%. Rates must match the source exactly.', { status: 'resolved', resolution: 'accepted', daysAgo: 8, resolvedDaysAgo: 3, assignee: 'm-kenji' }],
  ['p-finedge-platform', 'ja', 'major', 'terminology', 85, 'Withdrawal limit', '引き出し制限', '出金限度額', 'FinEdge glossary uses "出金限度額" for withdrawal limits.', { status: 'resolved', resolution: 'accepted', daysAgo: 8, resolvedDaysAgo: 6, assignee: 'm-hana' }],

  // ── Helix Healthcare (EN → ES) ────────────────────────────────────────────────
  ['p-helix-health', 'es', 'critical', 'accuracy', 97, 'Take one tablet twice daily with food.', 'Tome dos comprimidos una vez al día con alimentos.', 'Tome un comprimido dos veces al día con alimentos.', 'Dosage inverted: "one tablet twice daily" became "two tablets once daily". Dosage instructions are critical under the Helix quality profile.', { assignee: 'm-ana', daysAgo: 2, targetSpan: 'dos comprimidos una vez al día', sourceSpan: 'one tablet twice daily' }],
  ['p-helix-health', 'es', 'critical', 'omission', 93, 'Do not use if you are pregnant or breastfeeding.', 'No lo use si está embarazada.', 'No lo use si está embarazada o en período de lactancia.', 'The breastfeeding contraindication is omitted from the warning.', { assignee: 'm-ana', daysAgo: 2, sourceSpan: 'or breastfeeding' }],
  ['p-helix-health', 'es', 'major', 'terminology', 90, 'Possible side effects include dizziness.', 'Los posibles efectos laterales incluyen mareos.', 'Los posibles efectos secundarios incluyen mareos.', 'Helix glossary requires "efectos secundarios" for "side effects".', { assignee: 'm-sofia', daysAgo: 3, targetSpan: 'efectos laterales', preferredTerm: 'Efectos secundarios', detectedBy: 'rule', ruleId: 'glossary' }],
  ['p-helix-health', 'es', 'major', 'accuracy', 86, 'Refill reminders are sent 3 days before you run out.', 'Los recordatorios de reposición se envían 3 días después de que se agote.', 'Los recordatorios de reposición se envían 3 días antes de que se agote.', '"Before" was translated as "después" (after).', { daysAgo: 3, targetSpan: 'después', sourceSpan: 'before' }],
  ['p-helix-health', 'es', 'minor', 'style', 77, 'Update your profile', 'Actualiza tu perfil', 'Actualice su perfil', 'Helix style guide requires the formal "usted" form in patient-facing content.', { daysAgo: 4, targetSpan: 'Actualiza tu', detectedBy: 'reviewer' }],
  ['p-helix-health', 'es', 'minor', 'fluency', 71, 'Your results are ready to view.', 'Sus resultados están listos para ver.', 'Sus resultados ya están disponibles.', 'Literal structure; "listos para ver" sounds unnatural in Spanish healthcare communications.', { daysAgo: 4, targetSpan: 'listos para ver' }],
  ['p-helix-health', 'es', 'major', 'omission', 88, 'Keep out of reach of children.', 'Mantener fuera del alcance.', 'Mantener fuera del alcance de los niños.', '"Of children" is omitted from a mandatory safety statement.', { status: 'resolved', resolution: 'accepted', daysAgo: 7, resolvedDaysAgo: 1, assignee: 'm-ana' }],

  // ── Orbit Gaming (EN → KO) ────────────────────────────────────────────────────
  ['p-orbit-gaming', 'ko', 'critical', 'numbers', 98, 'Purchase 1,200 Gems for $9.99', '젬 120개를 $9.99에 구매', '젬 1,200개를 $9.99에 구매', 'Gem quantity changed from 1,200 to 120. In-game purchase amounts must be exact.', { assignee: 'm-hana', daysAgo: 1, targetSpan: '120개', detectedBy: 'rule', ruleId: 'numbers' }],
  ['p-orbit-gaming', 'ko', 'critical', 'accuracy', 95, 'This item cannot be refunded.', '이 아이템은 환불할 수 있습니다.', '이 아이템은 환불할 수 없습니다.', 'Meaning reversed: the translation states the item can be refunded.', { assignee: 'm-hana', daysAgo: 1, targetSpan: '있습니다' }],
  ['p-orbit-gaming', 'ko', 'major', 'terminology', 87, 'Enter the Starfall Arena', '스타폴 경기장에 입장', '스타폴 아레나에 입장', 'Orbit lore sheet requires "아레나" for "Arena".', { daysAgo: 2, targetSpan: '경기장', preferredTerm: '아레나', detectedBy: 'rule', ruleId: 'glossary' }],
  ['p-orbit-gaming', 'ko', 'major', 'formatting', 99, '{player} has joined your squad!', '님이 스쿼드에 합류했습니다!', '{player}님이 스쿼드에 합류했습니다!', 'Placeholder {player} is missing. The player name will not be displayed.', { daysAgo: 2, detectedBy: 'rule', ruleId: 'placeholder', assignee: 'm-daniel' }],
  ['p-orbit-gaming', 'ko', 'minor', 'punctuation', 73, 'Victory!', '승리했습니다.', '승리!', 'Exclamation from the source is lost and the system-message tone is too formal for a victory banner.', { daysAgo: 2, detectedBy: 'rule', ruleId: 'punctuation' }],
  ['p-orbit-gaming', 'ko', 'info', 'consistency', 62, 'Daily quests', '데일리 퀘스트', '일일 퀘스트', 'Other segments in this project use "일일 퀘스트".', { daysAgo: 2 }],

  // ── Aurora Help Center (EN → DE / FR / JA) ────────────────────────────────────
  ['p-aurora-help', 'de', 'major', 'omission', 85, 'Visit the Help Center for detailed setup guides.', 'Besuchen Sie das Hilfe-Center.', 'Besuchen Sie das Hilfe-Center für ausführliche Einrichtungsanleitungen.', 'The purpose of the visit ("for detailed setup guides") is omitted.', { daysAgo: 6, sourceSpan: 'for detailed setup guides', assignee: 'm-maria' }],
  ['p-aurora-help', 'ja', 'minor', 'fluency', 72, 'Restart the app and try again.', 'アプリを再開始して再度トライしてください。', 'アプリを再起動して、もう一度お試しください。', '"再開始" and "トライ" read as unnatural loan-word phrasing in support content.', { daysAgo: 5, targetSpan: '再開始して再度トライ' }],
  ['p-aurora-help', 'fr', 'minor', 'fluency', 70, 'Make sure your device is charged.', 'Assurez-vous que votre appareil est chargé.', 'Assurez-vous que votre appareil est bien chargé.', 'Optional fluency improvement.', { status: 'ignored', ignoreReason: 'Preferential change — source meaning preserved.', daysAgo: 7, resolvedDaysAgo: 6, assignee: 'm-claire' }],

  // ── Nova Holiday Campaign (EN → FR / DE / IT / ES) ─────────────────────────────
  ['p-nova-holiday', 'it', 'critical', 'accuracy', 94, 'Offer valid until December 24.', 'Offerta valida dal 24 dicembre.', 'Offerta valida fino al 24 dicembre.', '"Until" was rendered as "dal" (from). The offer period is inverted.', { daysAgo: 1, targetSpan: 'dal', assignee: 'm-luca' }],
  ['p-nova-holiday', 'de', 'critical', 'accuracy', 96, 'Discount does not apply to sale items.', 'Der Rabatt gilt auch für reduzierte Artikel.', 'Der Rabatt gilt nicht für reduzierte Artikel.', 'Negation replaced by "auch" (also): the discount is wrongly extended to sale items.', { daysAgo: 1, targetSpan: 'auch', assignee: 'm-maria' }],
  ['p-nova-holiday', 'es', 'major', 'terminology', 88, 'Gift cards make the perfect present.', 'Las tarjetas de regalo son el regalo perfecto.', 'Las tarjetas regalo son el regalo perfecto.', 'Nova Retail Spanish glossary uses "tarjeta regalo".', { daysAgo: 2, targetSpan: 'tarjetas de regalo', preferredTerm: 'Tarjeta regalo', detectedBy: 'rule', ruleId: 'glossary' }],
  ['p-nova-holiday', 'fr', 'minor', 'fluency', 75, 'Treat yourself this season', 'Traite-toi cette saison', 'Faites-vous plaisir cette saison', 'Calque of the English idiom, and uses informal "tu" contrary to the Nova style guide.', { daysAgo: 2, targetSpan: 'Traite-toi' }],
  ['p-nova-holiday', 'de', 'minor', 'locale', 79, 'Prices from $19.99', 'Preise ab $19.99', 'Preise ab 19,99 $', 'German number formatting uses a decimal comma and the currency symbol after the amount.', { daysAgo: 2, targetSpan: '$19.99' }],

  // ── FinEdge Compliance Pack (EN → JA / ZH) ────────────────────────────────────
  ['p-finedge-compliance', 'zh', 'critical', 'accuracy', 95, 'Past performance does not guarantee future results.', '过去的业绩保证未来的收益。', '过去的业绩并不代表未来的表现。', 'The regulatory disclaimer is reversed: it now states that past performance guarantees future returns.', { daysAgo: 3, targetSpan: '保证未来的收益', assignee: 'm-kenji' }],
  ['p-finedge-compliance', 'ja', 'major', 'terminology', 86, 'Identify the beneficial owner of the account holder.', '口座名義人の受益者を確認してください。', '口座名義人の実質的支配者を確認してください。', 'FinEdge glossary requires "実質的支配者" (regulatory term) for "beneficial owner".', { daysAgo: 4, targetSpan: '受益者', preferredTerm: '実質的支配者', detectedBy: 'rule', ruleId: 'glossary' }],
  ['p-finedge-compliance', 'zh', 'minor', 'punctuation', 70, 'Read the full disclosure.', '阅读完整披露.', '阅读完整披露。', 'Half-width period used in Simplified Chinese. Expected full-width "。".', { daysAgo: 4, targetSpan: '.' }],

  // ── Helix Patient Portal (EN → ES / PT) ───────────────────────────────────────
  ['p-helix-portal', 'pt', 'critical', 'accuracy', 97, 'Do not stop taking this medication without medical advice.', 'Pare de tomar este medicamento sem orientação médica.', 'Não pare de tomar este medicamento sem orientação médica.', 'Negation dropped: the translation instructs patients to stop their medication.', { daysAgo: 1, targetSpan: 'Pare de tomar', assignee: 'm-ana' }],
  ['p-helix-portal', 'es', 'critical', 'numbers', 96, 'Maximum dose: 4 g per day', 'Dosis máxima: 4 mg al día', 'Dosis máxima: 4 g al día', 'Unit changed from grams to milligrams — a 1000× dosage difference.', { daysAgo: 1, targetSpan: '4 mg', assignee: 'm-ana' }],
  ['p-helix-portal', 'pt', 'critical', 'omission', 92, 'Seek emergency care if symptoms worsen or you have difficulty breathing.', 'Procure atendimento de emergência se os sintomas piorarem.', 'Procure atendimento de emergência se os sintomas piorarem ou se tiver dificuldade para respirar.', 'Breathing difficulty — a key emergency condition — is omitted.', { daysAgo: 2, sourceSpan: 'or you have difficulty breathing' }],
  ['p-helix-portal', 'es', 'major', 'terminology', 89, 'Download your medical record', 'Descargue su registro médico', 'Descargue su historia clínica', 'Helix glossary requires "historia clínica" for "medical record".', { daysAgo: 2, targetSpan: 'registro médico', preferredTerm: 'Historia clínica', detectedBy: 'rule', ruleId: 'glossary', assignee: 'm-sofia' }],
  ['p-helix-portal', 'es', 'minor', 'style', 74, 'Your prescription is ready for pickup.', 'Tu receta está lista para recoger.', 'Su receta está lista para recoger.', 'Informal "tu" in patient-facing content; Helix requires "usted".', { status: 'resolved', resolution: 'accepted', daysAgo: 6, resolvedDaysAgo: 2, assignee: 'm-sofia' }],

  // ── Orbit Starfall Season 4 (EN → KO / JA / ZH) ───────────────────────────────
  ['p-orbit-starfall', 'ja', 'critical', 'accuracy', 93, 'Season Pass rewards expire at the end of Season 4.', 'シーズンパスの報酬はシーズン4終了後も失効しません。', 'シーズンパスの報酬はシーズン4の終了時に失効します。', 'The translation says rewards do not expire at the end of Season 4, contradicting the source and the in-game purchase terms.', { daysAgo: 2, targetSpan: '終了後も失効しません', assignee: 'm-hana' }],
  ['p-orbit-starfall', 'zh', 'major', 'terminology', 87, 'Collect Stardust to upgrade your ship.', '收集星辰之尘来升级你的飞船。', '收集星尘来升级你的飞船。', 'Lore sheet term for "Stardust" is "星尘".', { daysAgo: 3, targetSpan: '星辰之尘', preferredTerm: '星尘', detectedBy: 'rule', ruleId: 'glossary' }],
  ['p-orbit-starfall', 'ko', 'minor', 'style', 72, "Let's go, rookie!", '갑시다, 신입이여!', '가자, 신입!', 'Character dialogue should use casual 반말 per the Orbit style guide; the archaic "이여" vocative is out of character.', { daysAgo: 3, targetSpan: '갑시다, 신입이여', detectedBy: 'reviewer' }],
  ['p-orbit-starfall', 'ja', 'minor', 'formatting', 95, 'Level {level} unlocked', 'レベル{level}がアンロックされました ', 'レベル{level}がアンロックされました', 'Trailing whitespace in target.', { daysAgo: 3, detectedBy: 'rule', ruleId: 'whitespace' }],

  // ── Lumen ─────────────────────────────────────────────────────────────────────
  ['p-lumen-dashboard', 'fr', 'minor', 'grammar', 77, 'Filter by date range', 'Filtrer par plage de date', 'Filtrer par plage de dates', '"Plage de dates" requires the plural.', { daysAgo: 2, targetSpan: 'de date' }],
  ['p-lumen-dashboard', 'de', 'major', 'formatting', 98, 'Showing {count} of {total} results', 'Zeige {count} von Ergebnissen', 'Zeige {count} von {total} Ergebnissen', 'Placeholder {total} missing.', { status: 'resolved', resolution: 'accepted', daysAgo: 5, resolvedDaysAgo: 4, assignee: 'm-lukas', detectedBy: 'rule', ruleId: 'placeholder' }],
  ['p-lumen-api', 'ja', 'major', 'formatting', 90, 'Run `lumen deploy --prod` to publish.', '`lumen デプロイ --prod`を実行して公開します。', '`lumen deploy --prod`を実行して公開します。', 'Code inside backticks was translated. CLI commands must remain in English.', { daysAgo: 4, targetSpan: 'デプロイ', assignee: 'm-kenji' }],
  ['p-lumen-api', 'ja', 'minor', 'fluency', 68, 'Requests are rate-limited per API key.', 'リクエストはAPIキーごとにレート制限されています。', 'リクエストには API キーごとにレート制限が適用されます。', 'Slightly unnatural passive construction for technical documentation.', { daysAgo: 4 }],
  ['p-lumen-release', 'ko', 'minor', 'punctuation', 75, 'Improved sync performance.', '동기화 성능 개선', '동기화 성능이 개선되었습니다.', 'Sentence-final punctuation and predicate missing.', { status: 'resolved', resolution: 'edited', daysAgo: 3, resolvedDaysAgo: 1, assignee: 'm-hana' }],
  ['p-lumen-site', 'es', 'minor', 'style', 69, 'Build faster with Lumen', 'Construye más rápido con Lumen', 'Crea más rápido con Lumen', '"Construir" is literal for software; "crear" or "desarrollar" is more idiomatic.', { daysAgo: 8 }],

  // ── Verde ─────────────────────────────────────────────────────────────────────
  ['p-verde-web', 'it', 'critical', 'accuracy', 95, 'Free cancellation up to 48 hours before check-in.', 'Cancellazione gratuita fino a 48 ore dopo il check-in.', 'Cancellazione gratuita fino a 48 ore prima del check-in.', '"Before" became "dopo" (after), changing the cancellation policy.', { daysAgo: 2, targetSpan: 'dopo il', assignee: 'm-ana' }],
  ['p-verde-web', 'pt', 'minor', 'fluency', 72, 'Book your dream getaway', 'Reserve sua escapada de sonho', 'Reserve a viagem dos seus sonhos', 'Literal phrasing; "escapada de sonho" is unidiomatic in Brazilian Portuguese.', { daysAgo: 3, targetSpan: 'escapada de sonho' }],
  ['p-verde-booking', 'fr', 'major', 'omission', 88, 'Enter your passport number and expiry date.', 'Saisissez votre numéro de passeport.', "Saisissez votre numéro de passeport et sa date d'expiration.", 'The expiry date field instruction is omitted.', { daysAgo: 3, sourceSpan: 'and expiry date', assignee: 'm-claire' }],
  ['p-verde-booking', 'de', 'minor', 'punctuation', 76, 'Booking confirmed!', 'Buchung bestätigt.', 'Buchung bestätigt!', 'Exclamation mark from the source replaced by a period.', { daysAgo: 3, detectedBy: 'rule', ruleId: 'punctuation' }],
  ['p-verde-loyalty', 'es', 'major', 'omission', 84, 'Points expire after 12 months of inactivity.', 'Los puntos caducan a los 12 meses.', 'Los puntos caducan tras 12 meses de inactividad.', 'The inactivity condition is omitted, implying all points expire after 12 months.', { daysAgo: 2, sourceSpan: 'of inactivity' }],
  ['p-verde-loyalty', 'pt', 'minor', 'style', 70, 'Earn rewards every time you travel', 'Ganhe recompensas toda vez que você viajar', 'Ganhe recompensas sempre que viajar', 'Redundant pronoun; more concise phrasing preferred.', { daysAgo: 2, detectedBy: 'reviewer' }],

  // ── Nova Product Catalog Q4 (EN → DE / ES) ────────────────────────────────────
  ['p-nova-catalog', 'es', 'critical', 'accuracy', 94, 'Machine wash cold. Do not tumble dry.', 'Lavar a máquina en frío. Secar en secadora.', 'Lavar a máquina en frío. No secar en secadora.', 'Negation dropped in care instructions — customers would damage the product.', { daysAgo: 2, targetSpan: 'Secar en secadora', assignee: 'm-ana' }],
  ['p-nova-catalog', 'de', 'major', 'terminology', 89, 'Add to cart', 'In den Einkaufswagen', 'In den Warenkorb legen', 'Nova German glossary requires "Warenkorb"; the verb "legen" is also missing.', { daysAgo: 3, targetSpan: 'Einkaufswagen', preferredTerm: 'Warenkorb', detectedBy: 'rule', ruleId: 'glossary', assignee: 'm-lukas' }],
  ['p-nova-catalog', 'de', 'minor', 'fluency', 71, 'Made from soft organic cotton', 'Gemacht aus weicher Bio-Baumwolle', 'Aus weicher Bio-Baumwolle gefertigt', 'Anglicized word order; "gefertigt" is more natural in product copy.', { daysAgo: 3, targetSpan: 'Gemacht aus' }],

  // ── Aurora Onboarding Emails / Firmware ───────────────────────────────────────
  ['p-aurora-emails', 'it', 'minor', 'style', 73, "You're all set!", 'Sei tutto impostato!', 'È tutto pronto!', 'Literal calque; unnatural in Italian marketing copy.', { daysAgo: 2, targetSpan: 'Sei tutto impostato' }],
  ['p-aurora-firmware', 'ko', 'major', 'formatting', 97, '<b>Warning:</b> Do not turn off the device during the update.', '경고: 업데이트 중에는 기기를 끄지 마십시오.', '<b>경고:</b> 업데이트 중에는 기기를 끄지 마십시오.', 'HTML tags <b>…</b> are missing; the warning will render without emphasis.', { daysAgo: 3, detectedBy: 'rule', ruleId: 'placeholder', assignee: 'm-daniel' }],
  ['p-aurora-firmware', 'zh', 'major', 'terminology', 86, 'Connect to your Smart Hub', '连接到您的智能中心', '连接到您的智能中枢', 'Aurora glossary requires "智能中枢" for "Smart Hub".', { daysAgo: 3, targetSpan: '智能中心', preferredTerm: '智能中枢', detectedBy: 'rule', ruleId: 'glossary' }],
  ['p-aurora-firmware', 'zh', 'minor', 'locale', 71, 'Temperature: 72°F', '温度：72°F', '温度：22°C', 'Mainland China uses Celsius. Consider converting the unit (verify with client).', { daysAgo: 4, targetSpan: '72°F' }],

  // ── Helix Clinical Trials / Device Manual ─────────────────────────────────────
  ['p-helix-trials', 'de', 'critical', 'accuracy', 95, 'Participants must not take part in other clinical trials during this study.', 'Teilnehmer dürfen während dieser Studie an anderen klinischen Studien teilnehmen.', 'Teilnehmer dürfen während dieser Studie nicht an anderen klinischen Studien teilnehmen.', 'Negation missing: the exclusion criterion is reversed.', { daysAgo: 2, assignee: 'm-maria' }],
  ['p-helix-trials', 'fr', 'critical', 'numbers', 98, 'Report any serious adverse event within 24 hours.', 'Signalez tout événement indésirable grave dans un délai de 48 heures.', 'Signalez tout événement indésirable grave dans un délai de 24 heures.', 'Reporting window changed from 24 to 48 hours.', { daysAgo: 2, targetSpan: '48', detectedBy: 'rule', ruleId: 'numbers', assignee: 'm-claire' }],
  ['p-helix-trials', 'fr', 'minor', 'terminology', 78, 'Informed consent form', 'Formulaire de consentement informé', 'Formulaire de consentement éclairé', '"Consentement éclairé" is the standard regulatory term in French.', { daysAgo: 3, targetSpan: 'informé' }],
  ['p-helix-device', 'it', 'major', 'terminology', 88, 'Calibrate the blood glucose meter weekly.', 'Calibrare settimanalmente il misuratore di zucchero nel sangue.', 'Calibrare settimanalmente il glucometro.', 'Helix glossary requires "glucometro".', { daysAgo: 4, targetSpan: 'misuratore di zucchero nel sangue', preferredTerm: 'Glucometro', detectedBy: 'rule', ruleId: 'glossary' }],
  ['p-helix-device', 'de', 'minor', 'formatting', 94, 'Insert the test strip.', 'Teststreifen  einführen.', 'Teststreifen einführen.', 'Double space in target.', { daysAgo: 4, detectedBy: 'rule', ruleId: 'whitespace' }],

  // ── FinEdge Mobile / Investor ─────────────────────────────────────────────────
  ['p-finedge-mobile', 'ko', 'major', 'numbers', 97, 'Transfers over $10,000 require additional verification.', '$1,000 이상 송금 시 추가 인증이 필요합니다.', '$10,000 이상 송금 시 추가 인증이 필요합니다.', 'Threshold changed from $10,000 to $1,000.', { daysAgo: 3, targetSpan: '$1,000', detectedBy: 'rule', ruleId: 'numbers', assignee: 'm-hana' }],
  ['p-finedge-mobile', 'zh', 'minor', 'fluency', 69, 'Tap to view your statement', '点击以查看您的对账单', '点击查看对账单', 'Wordy construction; "以" is unnecessary in UI copy.', { daysAgo: 3 }],
  ['p-finedge-mobile', 'zh', 'minor', 'formatting', 92, '%d new notifications', '%s 条新通知', '%d 条新通知', 'Placeholder type changed from %d to %s, which may break number formatting.', { daysAgo: 3, detectedBy: 'rule', ruleId: 'placeholder' }],
  ['p-finedge-investor', 'ja', 'critical', 'numbers', 97, 'Revenue grew 12% year over year.', '売上高は前年比21%増加しました。', '売上高は前年比12%増加しました。', 'Digits transposed: 12% became 21%.', { daysAgo: 2, targetSpan: '21%', detectedBy: 'rule', ruleId: 'numbers', assignee: 'm-kenji' }],
  ['p-finedge-investor', 'zh', 'minor', 'style', 70, 'We remain committed to long-term value creation.', '我们仍然致力于长期的价值的创造。', '我们将继续致力于创造长期价值。', 'Repeated "的" makes the sentence heavy for investor communications.', { daysAgo: 2 }],

  // ── Orbit Store Listings ──────────────────────────────────────────────────────
  ['p-orbit-store', 'de', 'major', 'omission', 87, 'Free to play. In-app purchases available.', 'Kostenlos spielbar.', 'Kostenlos spielbar. In-App-Käufe verfügbar.', 'Mandatory in-app purchase disclosure is omitted.', { daysAgo: 2, sourceSpan: 'In-app purchases available.' }],
  ['p-orbit-store', 'fr', 'minor', 'style', 70, 'Join millions of players worldwide', 'Rejoignez des millions de joueurs à travers le monde entier', 'Rejoignez des millions de joueurs dans le monde entier', '"À travers le monde entier" is redundant.', { daysAgo: 2 }],

  // ── Completed projects (history) ──────────────────────────────────────────────
  ['p-nova-spring', 'fr', 'major', 'accuracy', 90, 'Sale ends Sunday at midnight.', 'Les soldes se terminent dimanche à midi.', 'Les soldes se terminent dimanche à minuit.', '"Midnight" translated as "midi" (noon).', { status: 'resolved', resolution: 'accepted', daysAgo: 45, resolvedDaysAgo: 44, assignee: 'm-claire' }],
  ['p-nova-spring', 'de', 'minor', 'punctuation', 74, 'Shop the sale now!', 'Jetzt im Sale shoppen.', 'Jetzt im Sale shoppen!', 'Exclamation mark missing.', { status: 'resolved', resolution: 'accepted', daysAgo: 45, resolvedDaysAgo: 43, assignee: 'm-maria' }],
  ['p-orbit-trailer', 'ja', 'minor', 'style', 71, 'The stars are calling.', '星たちが呼んでいる。', '星が呼んでいる。', 'Subtitle exceeds reading speed; simplify.', { status: 'resolved', resolution: 'accepted', daysAgo: 25, resolvedDaysAgo: 24, assignee: 'm-hana' }],
  ['p-finedge-annual', 'ja', 'major', 'numbers', 96, 'Net income: ¥4.2 billion', '純利益：42億円', '純利益：42億円', 'Possible number mismatch (4.2 vs 42).', { status: 'ignored', ignoreReason: 'Correct — ¥4.2 billion = 42億円 (unit conversion).', daysAgo: 20, resolvedDaysAgo: 19, assignee: 'm-kenji', detectedBy: 'rule', ruleId: 'numbers' }],
  ['p-finedge-annual', 'ja', 'minor', 'consistency', 72, 'Consolidated balance sheet', '連結バランスシート', '連結貸借対照表', 'Use the standard accounting term "連結貸借対照表".', { status: 'resolved', resolution: 'accepted', daysAgo: 20, resolvedDaysAgo: 18, assignee: 'm-kenji' }],
]

/**
 * Latent findings: defects that exist in the current Nova E-commerce batch but have not been
 * flagged yet. The demo QA engine "discovers" them when a scan runs (deterministically).
 * Rule-detectable ones (placeholder, numbers, glossary, punctuation, whitespace, repeated words)
 * are found by the rule checks; the entries here supply rich explanations and corrections.
 */
export interface LatentSeed {
  projectId: string
  lang: LangCode
  severity: Severity
  category: IssueCategory
  confidence: number
  source: string
  target: string
  suggestion: string
  explanation: string
  targetSpan?: string
  sourceSpan?: string
  preferredTerm?: string
  /** Only surfaced in Strict sensitivity. */
  strictOnly?: boolean
}

const L = (
  severity: Severity,
  category: IssueCategory,
  confidence: number,
  source: string,
  target: string,
  suggestion: string,
  explanation: string,
  extra: Partial<LatentSeed> = {},
): LatentSeed => ({ projectId: 'p-nova-ecom', lang: 'fr', severity, category, confidence, source, target, suggestion, explanation, ...extra })

export const latentSeeds: LatentSeed[] = [
  L('major', 'formatting', 99, 'You have {count} items in your cart.', 'Vous avez des articles dans votre panier.', 'Vous avez {count} articles dans votre panier.', 'Placeholder {count} is missing from the target. The item count will not render on the cart page.'),
  L('major', 'terminology', 92, 'Add to wishlist', 'Ajouter aux favoris', 'Ajouter à la liste de souhaits', 'Nova Retail glossary requires "Liste de souhaits" for "Wishlist". "Favoris" is listed as a forbidden variant.', { targetSpan: 'aux favoris', preferredTerm: 'Liste de souhaits' }),
  L('major', 'accuracy', 83, 'Delivery in 3–5 business days', 'Livraison en 3 à 5 jours', 'Livraison en 3 à 5 jours ouvrés', '"Business days" was reduced to "jours" (calendar days), which sets an incorrect delivery expectation.', { targetSpan: 'jours', sourceSpan: 'business days' }),
  L('major', 'numbers', 97, 'Save 20% on your first order.', 'Économisez 15 % sur votre première commande.', 'Économisez 20 % sur votre première commande.', 'The discount changed from 20% to 15%. Promotional figures must match the source.', { targetSpan: '15 %' }),
  L('minor', 'punctuation', 88, 'Your order has been shipped.', 'Votre commande a été expédiée', 'Votre commande a été expédiée.', 'The sentence-final period from the source is missing.'),
  L('minor', 'formatting', 93, 'Track your order', 'Suivre  votre commande', 'Suivre votre commande', 'Double space detected in the target.'),
  L('minor', 'grammar', 90, 'Sign up for our newsletter', 'Inscrivez-vous à notre notre newsletter', 'Inscrivez-vous à notre newsletter', 'Repeated word "notre".', { targetSpan: 'notre notre' }),
  L('minor', 'consistency', 76, 'Continue shopping', 'Continuer vos achats', 'Continuer mes achats', 'Inconsistent with 4 other segments in this project that use "Continuer mes achats".', { targetSpan: 'vos achats' }),
  L('minor', 'locale', 81, 'Order by 11/30 for delivery before the holidays.', 'Commandez avant le 11/30 pour une livraison avant les fêtes.', 'Commandez avant le 30/11 pour une livraison avant les fêtes.', 'US date format (MM/DD) in a French storefront. Expected DD/MM.', { targetSpan: '11/30' }),
  L('minor', 'grammar', 85, 'Your items are reserved for 15 minutes.', 'Vos articles sont réservé pendant 15 minutes.', 'Vos articles sont réservés pendant 15 minutes.', 'Past participle must agree with the plural subject "articles".', { targetSpan: 'réservé' }),
  L('info', 'style', 64, 'Sale ends tonight!', 'La vente se termine ce soir !', 'Les soldes se terminent ce soir !', '"Les soldes" is the idiomatic retail term in French e-commerce.', { targetSpan: 'La vente se termine' }),
  L('info', 'consistency', 61, 'Customer reviews', 'Avis des clients', 'Avis clients', 'The shorter form "Avis clients" is used on 6 other product pages.'),
  L('info', 'locale', 63, 'Prices shown in USD', 'Prix affichés en USD', 'Prix affichés en EUR', 'Client style guide prefers EUR pricing on the fr-FR storefront. Verify with the client before changing.', { targetSpan: 'USD' }),
  L('info', 'style', 55, 'Welcome back!', 'Bon retour !', 'Content de vous revoir !', 'Alternative greeting that better matches the warm Nova tone.', { strictOnly: true }),
  L('info', 'style', 54, 'Checkout securely', 'Paiement sécurisé', 'Payez en toute sécurité', 'Consider an active CTA phrasing to match other checkout buttons.', { strictOnly: true }),
]
