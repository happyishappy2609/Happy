import type { LangCode } from '@/types'

type Row = [string, Partial<Record<LangCode, string>>]

/** Clean, approved UI strings used to fill demo segment batches. Every row passes the rule-based QA checks. */
export const CORPUS: Row[] = [
  ['Sign in to your account', { de: 'Bei Ihrem Konto anmelden', fr: 'Se connecter à votre compte', es: 'Inicia sesión en tu cuenta', ja: 'アカウントにサインイン', ko: '계정에 로그인', it: 'Accedi al tuo account', pt: 'Entre na sua conta', zh: '登录您的账户' }],
  ['Forgot your password?', { de: 'Passwort vergessen?', fr: 'Mot de passe oublié ?', es: '¿Has olvidado tu contraseña?', ja: 'パスワードをお忘れですか？', ko: '비밀번호를 잊으셨나요?', it: 'Hai dimenticato la password?', pt: 'Esqueceu sua senha?', zh: '忘记密码？' }],
  ['Save changes', { de: 'Änderungen speichern', fr: 'Enregistrer les modifications', es: 'Guardar cambios', ja: '変更を保存', ko: '변경 사항 저장', it: 'Salva modifiche', pt: 'Salvar alterações', zh: '保存更改' }],
  ['Cancel', { de: 'Abbrechen', fr: 'Annuler', es: 'Cancelar', ja: 'キャンセル', ko: '취소', it: 'Annulla', pt: 'Cancelar', zh: '取消' }],
  ['Your changes have been saved.', { de: 'Ihre Änderungen wurden gespeichert.', fr: 'Vos modifications ont été enregistrées.', es: 'Tus cambios se han guardado.', ja: '変更が保存されました。', ko: '변경 사항이 저장되었습니다.', it: 'Le modifiche sono state salvate.', pt: 'Suas alterações foram salvas.', zh: '您的更改已保存。' }],
  ['Search', { de: 'Suchen', fr: 'Rechercher', es: 'Buscar', ja: '検索', ko: '검색', it: 'Cerca', pt: 'Pesquisar', zh: '搜索' }],
  ['Notifications', { de: 'Benachrichtigungen', fr: 'Notifications', es: 'Notificaciones', ja: '通知', ko: '알림', it: 'Notifiche', pt: 'Notificações', zh: '通知' }],
  ['Settings', { de: 'Einstellungen', fr: 'Paramètres', es: 'Configuración', ja: '設定', ko: '설정', it: 'Impostazioni', pt: 'Configurações', zh: '设置' }],
  ['Help & support', { de: 'Hilfe & Support', fr: 'Aide et assistance', es: 'Ayuda y soporte', ja: 'ヘルプとサポート', ko: '도움말 및 지원', it: 'Assistenza e supporto', pt: 'Ajuda e suporte', zh: '帮助与支持' }],
  ['Learn more', { de: 'Mehr erfahren', fr: 'En savoir plus', es: 'Más información', ja: '詳細を見る', ko: '자세히 알아보기', it: 'Scopri di più', pt: 'Saiba mais', zh: '了解更多' }],
  ['Continue', { de: 'Weiter', fr: 'Continuer', es: 'Continuar', ja: '続行', ko: '계속', it: 'Continua', pt: 'Continuar', zh: '继续' }],
  ['Download the latest version.', { de: 'Laden Sie die neueste Version herunter.', fr: 'Téléchargez la dernière version.', es: 'Descarga la versión más reciente.', ja: '最新バージョンをダウンロードしてください。', ko: '최신 버전을 다운로드하세요.', it: 'Scarica la versione più recente.', pt: 'Baixe a versão mais recente.', zh: '下载最新版本。' }],
  ['Your session has expired.', { de: 'Ihre Sitzung ist abgelaufen.', fr: 'Votre session a expiré.', es: 'Tu sesión ha caducado.', ja: 'セッションの有効期限が切れました。', ko: '세션이 만료되었습니다.', it: 'La sessione è scaduta.', pt: 'Sua sessão expirou.', zh: '您的会话已过期。' }],
  ['Contact us', { de: 'Kontakt', fr: 'Nous contacter', es: 'Contáctanos', ja: 'お問い合わせ', ko: '문의하기', it: 'Contattaci', pt: 'Fale conosco', zh: '联系我们' }],
  ['Privacy policy', { de: 'Datenschutzerklärung', fr: 'Politique de confidentialité', es: 'Política de privacidad', ja: 'プライバシーポリシー', ko: '개인정보 처리방침', it: 'Informativa sulla privacy', pt: 'Política de privacidade', zh: '隐私政策' }],
  ['Terms of service', { de: 'Nutzungsbedingungen', fr: "Conditions d'utilisation", es: 'Términos del servicio', ja: '利用規約', ko: '서비스 약관', it: 'Termini di servizio', pt: 'Termos de serviço', zh: '服务条款' }],
  ['Language', { de: 'Sprache', fr: 'Langue', es: 'Idioma', ja: '言語', ko: '언어', it: 'Lingua', pt: 'Idioma', zh: '语言' }],
  ['Delete', { de: 'Löschen', fr: 'Supprimer', es: 'Eliminar', ja: '削除', ko: '삭제', it: 'Elimina', pt: 'Excluir', zh: '删除' }],
  ['Are you sure you want to delete this item?', { de: 'Möchten Sie dieses Element wirklich löschen?', fr: 'Voulez-vous vraiment supprimer cet élément ?', es: '¿Seguro que quieres eliminar este elemento?', ja: 'このアイテムを削除してもよろしいですか？', ko: '이 항목을 삭제하시겠습니까?', it: 'Vuoi davvero eliminare questo elemento?', pt: 'Tem certeza de que deseja excluir este item?', zh: '确定要删除此项目吗？' }],
  ['Payment method', { de: 'Zahlungsmethode', fr: 'Moyen de paiement', es: 'Método de pago', ja: 'お支払い方法', ko: '결제 수단', it: 'Metodo di pagamento', pt: 'Forma de pagamento', zh: '付款方式' }],
  ['Update available', { de: 'Update verfügbar', fr: 'Mise à jour disponible', es: 'Actualización disponible', ja: 'アップデートがあります', ko: '업데이트 가능', it: 'Aggiornamento disponibile', pt: 'Atualização disponível', zh: '有可用更新' }],
  ['Welcome to your new workspace', { de: 'Willkommen in Ihrem neuen Arbeitsbereich', fr: 'Bienvenue dans votre nouvel espace de travail', es: 'Te damos la bienvenida a tu nuevo espacio de trabajo', ja: '新しいワークスペースへようこそ', ko: '새 워크스페이스에 오신 것을 환영합니다', it: 'Benvenuto nel tuo nuovo spazio di lavoro', pt: 'Boas-vindas ao seu novo espaço de trabalho', zh: '欢迎使用您的新工作区' }],
  ['Enter your email address', { de: 'Geben Sie Ihre E-Mail-Adresse ein', fr: 'Saisissez votre adresse e-mail', es: 'Introduce tu dirección de correo electrónico', ja: 'メールアドレスを入力してください', ko: '이메일 주소를 입력하세요', it: 'Inserisci il tuo indirizzo email', pt: 'Digite seu endereço de e-mail', zh: '输入您的电子邮件地址' }],
  ['Your files are syncing in the background.', { de: 'Ihre Dateien werden im Hintergrund synchronisiert.', fr: 'Vos fichiers sont en cours de synchronisation en arrière-plan.', es: 'Tus archivos se están sincronizando en segundo plano.', ja: 'ファイルはバックグラウンドで同期されています。', ko: '파일이 백그라운드에서 동기화되고 있습니다.', it: 'I tuoi file vengono sincronizzati in background.', pt: 'Seus arquivos estão sendo sincronizados em segundo plano.', zh: '您的文件正在后台同步。' }],
]

/** Nova Retail product-catalog strings (EN → FR). Product names are never translated. */
export const NOVA_PRODUCTS = ['Alpine Merino Sweater', 'Cloud Runner Sneakers', 'Harbor Canvas Tote', 'Ember Ceramic Mug']

export const NOVA_CATALOG_TEMPLATES: [string, string][] = [
  ['Add {P} to cart', 'Ajouter {P} au panier'],
  ['{P} is back in stock.', '{P} est de nouveau en stock.'],
  ['Customers who bought {P} also viewed', 'Les clients ayant acheté {P} ont aussi consulté'],
  ['Write a review for {P}', 'Rédigez un avis sur {P}'],
  ['{P} has been added to your cart.', '{P} a été ajouté à votre panier.'],
  ['Notify me when {P} is available', "M'avertir lorsque {P} est disponible"],
  ['Select a size for {P}', 'Sélectionnez une taille pour {P}'],
  ['Care instructions for {P}', "Conseils d'entretien pour {P}"],
  ['{P} — free delivery available', '{P} — livraison gratuite disponible'],
  ['Share {P} with a friend', 'Partager {P} avec un ami'],
  ['Product details: {P}', 'Détails du produit : {P}'],
  ['{P} ships within two business days.', '{P} est expédié sous deux jours ouvrés.'],
  ['Compare {P} with similar items', 'Comparer {P} avec des articles similaires'],
  ['Why customers love {P}', 'Pourquoi les clients adorent {P}'],
  ['{P} is part of our autumn collection.', "{P} fait partie de notre collection d'automne."],
  ['View all colors of {P}', 'Voir tous les coloris de {P}'],
  ['Frequently asked questions about {P}', 'Questions fréquentes sur {P}'],
]
