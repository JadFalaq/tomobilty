# Migration Stripe → CMI - Guide Complet

## 🎯 Objectif

Remplacer l'intégration Stripe par CMI (Centre Monétique Interbancaire) pour accepter les paiements en dirhams marocains (MAD) de manière native.

## 📋 Résumé de la Migration

### ✅ Travaux Réalisés

1. **Architecture Multi-Provider**
   - Interface `PaymentProvider` abstraite
   - `StripeProvider` (refactorisé)
   - `CmiProvider` (nouveau)
   - `PaymentProviderFactory` pour la gestion

2. **Services Refactorisés**
   - `payment.service.v2.js` - Service unifié multi-providers
   - Support Stripe + CMI avec flag de configuration
   - Gestion des retours navigateur et IPN

3. **Nouveaux Endpoints**
   - `POST /api/payments/create` - Création session (multi-provider)
   - `GET /api/payments/return` - Retour navigateur
   - `POST /api/payments/cmi/ipn` - Notifications CMI
   - `POST /api/payments/stripe/webhook` - Webhooks Stripe (legacy)

4. **Sécurité CMI**
   - Vérification signatures SHA-512
   - Gestion idempotence IPN
   - Validation intégrité des données

5. **Configuration**
   - Variables d'environnement CMI
   - Support dual Stripe/CMI
   - URLs de retour configurables

6. **Tests et Documentation**
   - Tests unitaires CmiProvider
   - Documentation complète CMI
   - Script de migration automatisé

## 🚀 Déploiement

### Phase 1: Préparation

```bash
# 1. Sauvegarder la configuration actuelle
cp .env .env.backup

# 2. Tester la migration (simulation)
node scripts/migrate-to-cmi.js --dry-run

# 3. Exécuter la migration avec sauvegarde
node scripts/migrate-to-cmi.js --backup
```

### Phase 2: Configuration CMI

```env
# .env
PAYMENT_PROVIDER=cmi

# Configuration CMI (à obtenir auprès de votre banque)
CMI_MERCHANT_ID=votre_merchant_id
CMI_STORE_KEY=votre_store_key_secret
CMI_TERMINAL_ID=votre_terminal_id
CMI_GATEWAY_URL=https://payment.cmi.co.ma/fim/est3Dgate
CMI_CURRENCY=MAD

# URLs publiques (HTTPS requis en production)
CMI_RETURN_URL=https://tomobilty.com/payments/return
CMI_IPN_URL=https://api.tomobilty.com/api/payments/cmi/ipn
```

### Phase 3: Tests

```bash
# Tests unitaires
npm test src/tests/providers/CmiProvider.test.js

# Test d'intégration
curl -X POST http://localhost:3001/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"booking_id": 1, "amount": 100, "provider": "cmi"}'
```

### Phase 4: Déploiement Production

1. **Déployer le code** avec `PAYMENT_PROVIDER=stripe` (temporaire)
2. **Configurer CMI** avec les vraies credentials
3. **Basculer** `PAYMENT_PROVIDER=cmi`
4. **Tester** quelques transactions réelles
5. **Monitorer** les logs et statistiques

## 🔧 Utilisation

### Frontend (JavaScript)

```javascript
// Créer une session de paiement CMI
const createPayment = async (bookingId, amount) => {
  const response = await fetch('/api/payments/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      booking_id: bookingId,
      amount: amount,
      provider: 'cmi' // ou 'stripe' pour legacy
    })
  });

  const { data } = await response.json();
  
  // Rediriger vers CMI
  window.location.href = data.session_url;
};
```

### Backend (Node.js)

```javascript
// Utilisation du service unifié
const paymentService = require('./services/payment.service');

// Créer session (provider automatique selon config)
const session = await paymentService.createPaymentSession(bookingId, bookingData);

// Ou forcer un provider spécifique
const session = await paymentService.createPaymentSession(bookingId, bookingData, 'cmi');

// Traiter retour de paiement
const result = await paymentService.handlePaymentReturn(req, 'cmi');

// Traiter notification IPN
const result = await paymentService.handlePaymentNotification(req, 'cmi');
```

## 🔄 Workflow CMI

```
1. Utilisateur clique "Payer"
   ↓
2. Frontend → POST /api/payments/create
   ↓
3. Backend génère session CMI + redirectUrl
   ↓
4. Redirection navigateur → Gateway CMI
   ↓
5. Utilisateur saisit carte bancaire
   ↓
6. CMI traite paiement
   ↓
7. Retour navigateur → /payments/return
   ↓
8. Notification serveur → /api/payments/cmi/ipn
   ↓
9. Backend valide + confirme réservation
   ↓
10. Redirection → Page de succès
```

## 📊 Monitoring

### Logs CMI

```javascript
// Logs structurés pour monitoring
console.log('📨 CMI IPN:', {
  orderId: params.orderId,
  amount: params.amount,
  status: params.ProcReturnCode,
  timestamp: new Date().toISOString()
});
```

### Statistiques

```bash
# Statistiques par provider
GET /api/payments/admin/statistics?provider=cmi

{
  "success_rate": 95.2,
  "total_revenue": 125000.00,
  "transactions_count": 100,
  "payments_by_provider": [
    {"provider": "cmi", "count": 80, "revenue": 100000},
    {"provider": "stripe", "count": 20, "revenue": 25000}
  ]
}
```

## 🛠️ Dépannage

### Problèmes Courants

1. **Signature invalide**
   ```bash
   # Vérifier STORE_KEY et ordre des champs
   echo "merchantId|orderId|amount|okUrl|failUrl|tranType|rnd|storeKey" | sha512sum
   ```

2. **IPN non reçu**
   - Vérifier URL publique accessible
   - Vérifier firewall/proxy
   - Tester avec ngrok en dev

3. **Double traitement**
   - Idempotence automatique implémentée
   - Vérifier logs pour duplicatas

### Commandes Utiles

```bash
# Vérifier configuration
node -e "console.log(require('./src/services/providers/PaymentProviderFactory').getAllProvidersInfo())"

# Tester provider CMI
node -e "
const CmiProvider = require('./src/services/providers/CmiProvider');
const provider = new CmiProvider({
  merchantId: process.env.CMI_MERCHANT_ID,
  storeKey: process.env.CMI_STORE_KEY,
  gatewayUrl: process.env.CMI_GATEWAY_URL
});
console.log('Config valid:', provider.validateConfig());
"

# Monitorer logs en temps réel
tail -f logs/payment.log | grep CMI
```

## 🔐 Sécurité

### Bonnes Pratiques

1. **Variables sensibles**
   - `CMI_STORE_KEY` ne doit jamais être loggé
   - Utiliser des secrets managers en production

2. **URLs publiques**
   - HTTPS obligatoire en production
   - Vérifier certificats SSL valides

3. **Validation**
   - Toujours vérifier signature IPN
   - Ne jamais faire confiance au retour navigateur seul

4. **Monitoring**
   - Alertes sur échecs de signature
   - Monitoring taux de succès

## 📈 Performance

### Optimisations

1. **Cache provider instances**
2. **Pool de connexions DB**
3. **Queue pour IPN processing**
4. **Retry logic intelligent**

### Métriques

- Temps de réponse création session: < 500ms
- Temps de traitement IPN: < 200ms
- Taux de succès: > 95%
- Disponibilité: > 99.9%

## 🔄 Rollback

En cas de problème, rollback rapide:

```bash
# 1. Basculer vers Stripe
export PAYMENT_PROVIDER=stripe

# 2. Restaurer fichiers (si sauvegarde)
cp backups/stripe-backup-*/src/services/payment.service.js src/services/

# 3. Redémarrer services
pm2 restart tomobilty-api
```

## 📞 Support

### Contacts CMI

- **Documentation**: https://www.cmi.co.ma/documentation
- **Support technique**: support@cmi.co.ma
- **Urgences**: +212 522 XX XX XX

### Équipe Interne

- **Lead Dev**: Responsable intégration
- **DevOps**: Configuration infrastructure
- **Business**: Validation fonctionnelle

---

## ✅ Checklist de Déploiement

- [ ] Tests unitaires passent
- [ ] Configuration CMI validée
- [ ] URLs publiques configurées
- [ ] Certificats SSL valides
- [ ] Monitoring en place
- [ ] Plan de rollback préparé
- [ ] Équipe informée
- [ ] Documentation à jour

**Migration CMI v1.0 - TOMOBILTY**  
*Paiements sécurisés en MAD pour le Maroc*
