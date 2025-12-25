# Intégration CMI (Centre Monétique Interbancaire)

## 📋 Vue d'ensemble

Cette documentation décrit l'intégration du système de paiement CMI pour remplacer Stripe dans l'application TOMOBILTY. CMI est le centre monétique interbancaire du Maroc qui gère les paiements par carte bancaire.

## 🏗️ Architecture

### Flux de Paiement CMI

```
1. Utilisateur → Création réservation
2. Frontend → POST /api/payments/create (provider=cmi)
3. Backend → Génération session CMI + redirection
4. Utilisateur → Redirection vers gateway CMI
5. CMI → Traitement paiement carte
6. CMI → Retour navigateur + IPN serveur
7. Backend → Validation + confirmation réservation
```

### Composants Principaux

- **CmiProvider**: Implémentation du provider CMI
- **PaymentService**: Service unifié multi-providers
- **PaymentController**: Endpoints API
- **Endpoints spécialisés**: Return handler + IPN handler

## 🔧 Configuration

### Variables d'Environnement

```env
# Provider par défaut
PAYMENT_PROVIDER=cmi

# Configuration CMI
CMI_MERCHANT_ID=your_merchant_id
CMI_STORE_KEY=your_store_key_secret
CMI_TERMINAL_ID=your_terminal_id
CMI_GATEWAY_URL=https://payment.cmi.co.ma/fim/est3Dgate
CMI_CURRENCY=MAD

# URLs de retour
CMI_RETURN_URL=https://yourdomain.com/payments/return
CMI_IPN_URL=https://yourdomain.com/api/payments/cmi/ipn
```

### Configuration Sandbox vs Production

```env
# Sandbox (Test)
CMI_GATEWAY_URL=https://testpayment.cmi.co.ma/fim/est3Dgate

# Production
CMI_GATEWAY_URL=https://payment.cmi.co.ma/fim/est3Dgate
```

## 🔐 Sécurité et Signatures

### Génération Hash CMI

Le hash CMI utilise l'algorithme SHA-512 avec les champs suivants:

```javascript
const hashString = [
  merchantId,
  orderId,
  amount,
  okUrl,
  failUrl,
  tranType,
  rnd,
  storeKey
].join('|');

const hash = crypto.createHash('sha512').update(hashString, 'utf8').digest('base64');
```

### Vérification Retour/IPN

```javascript
const returnHashString = [
  orderId,
  amount,
  procReturnCode,
  storeKey
].join('|');

const expectedHash = crypto.createHash('sha512').update(returnHashString, 'utf8').digest('base64');
```

## 📡 Endpoints API

### Création Session de Paiement

```http
POST /api/payments/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "booking_id": 123,
  "amount": 1500.00,
  "currency": "MAD",
  "provider": "cmi"
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "payment_id": 456,
    "session_id": "TXN_123_1703123456789",
    "session_url": "https://payment.cmi.co.ma/fim/est3Dgate?merchantId=...",
    "provider_ref": "TXN_123_1703123456789",
    "amount": 1500.00,
    "currency": "MAD",
    "provider": "cmi"
  }
}
```

### Retour de Paiement

```http
GET /api/payments/return?orderId=TXN_123_1703123456789&amount=150000&ProcReturnCode=00&HASH=...
```

**Réponse (redirection):**
```
HTTP/1.1 302 Found
Location: https://yourdomain.com/booking/123/payment-success
```

### IPN (Instant Payment Notification)

```http
POST /api/payments/cmi/ipn
Content-Type: application/x-www-form-urlencoded

orderId=TXN_123_1703123456789&amount=150000&ProcReturnCode=00&HASH=...
```

**Réponse:**
```
ACTION=POSTAUTH
```

## 💳 Codes de Retour CMI

| Code | Statut | Description |
|------|--------|-------------|
| 00 | PAID | Paiement réussi |
| 01 | FAILED | Échec générique |
| 02 | FAILED | Carte expirée |
| 03 | FAILED | Carte invalide |
| 04 | FAILED | Fonds insuffisants |
| 05 | FAILED | Carte refusée |
| 06 | FAILED | Erreur système |
| 07 | CANCELED | Transaction annulée |
| 08 | PENDING | En attente |
| 99 | FAILED | Erreur inconnue |

## 🔄 Workflow Détaillé

### 1. Création Session

```javascript
// Frontend
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    booking_id: 123,
    amount: 1500.00,
    provider: 'cmi'
  })
});

const { data } = await response.json();
window.location.href = data.session_url;
```

### 2. Traitement Retour

```javascript
// Backend - handlePaymentReturn
const returnResult = await provider.handleReturn(request);
// → Vérification signature
// → Extraction orderId
// → Mise à jour statut paiement
// → Redirection appropriée
```

### 3. Traitement IPN

```javascript
// Backend - handlePaymentNotification
const notificationResult = await provider.handleNotification(request);
// → Vérification signature IPN
// → Vérification idempotence
// → Mise à jour statut paiement
// → Exécution workflow post-paiement
// → Réponse ACK à CMI
```

## 🧪 Tests et Validation

### Données de Test CMI

```javascript
// Cartes de test (sandbox)
const testCards = {
  success: '4508034508034509',
  declined: '4508034508034517',
  expired: '4508034508034525'
};

// Montants de test
const testAmounts = {
  success: 100, // 1.00 MAD
  decline: 200, // 2.00 MAD
  error: 300    // 3.00 MAD
};
```

### Test d'Intégration

```bash
# 1. Créer session de paiement
curl -X POST http://localhost:3001/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"booking_id": 1, "amount": 100, "provider": "cmi"}'

# 2. Simuler retour navigateur
curl "http://localhost:3001/api/payments/return?orderId=TXN_1_123&amount=10000&ProcReturnCode=00&HASH=..."

# 3. Simuler IPN
curl -X POST http://localhost:3001/api/payments/cmi/ipn \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "orderId=TXN_1_123&amount=10000&ProcReturnCode=00&HASH=..."
```

## 🚨 Gestion d'Erreurs

### Erreurs Communes

1. **Signature invalide**
   - Vérifier STORE_KEY
   - Vérifier ordre des champs dans le hash
   - Vérifier encodage UTF-8

2. **Timeout session**
   - Sessions CMI expirent après 30 minutes
   - Implémenter retry logic côté frontend

3. **Double traitement IPN**
   - Vérification idempotence implémentée
   - Logs détaillés pour debug

### Logs et Monitoring

```javascript
// Logs structurés
console.log('📨 CMI IPN received:', {
  orderId: params.orderId,
  amount: params.amount,
  status: params.ProcReturnCode,
  hash: params.HASH?.substring(0, 10) + '...',
  timestamp: new Date().toISOString()
});
```

## 🔄 Migration depuis Stripe

### Étapes de Migration

1. **Phase 1**: Déployer code avec support dual (Stripe + CMI)
2. **Phase 2**: Basculer `PAYMENT_PROVIDER=cmi`
3. **Phase 3**: Tester en production avec quelques transactions
4. **Phase 4**: Migration complète
5. **Phase 5**: Nettoyage code Stripe (optionnel)

### Compatibilité

```javascript
// Le système supporte les deux providers
const provider = process.env.PAYMENT_PROVIDER; // 'stripe' ou 'cmi'

// Basculement sans interruption de service
if (provider === 'cmi') {
  // Utilise CMI
} else {
  // Utilise Stripe (legacy)
}
```

## 📊 Monitoring et Statistiques

### Métriques CMI

```javascript
// Statistiques par provider
GET /api/payments/admin/statistics?provider=cmi

{
  "success_rate": 95.2,
  "average_amount": 1250.00,
  "total_revenue": 125000.00,
  "transactions_count": 100,
  "by_status": {
    "PAID": 95,
    "FAILED": 3,
    "CANCELED": 2
  }
}
```

## 🛠️ Dépannage

### Checklist de Vérification

- [ ] Variables d'environnement CMI configurées
- [ ] URLs de retour accessibles publiquement
- [ ] Certificats SSL valides (production)
- [ ] Firewall autorise IPN CMI
- [ ] Logs activés pour debug
- [ ] Tests avec cartes de test réussis

### Support CMI

- **Documentation**: https://www.cmi.co.ma/documentation
- **Support technique**: support@cmi.co.ma
- **Téléphone**: +212 522 XX XX XX

## 📝 Notes Importantes

1. **Montants**: CMI attend les montants en centimes (1500 = 15.00 MAD)
2. **Devise**: Toujours MAD pour le Maroc
3. **Timeout**: Sessions expirent après 30 minutes
4. **Sécurité**: Ne jamais logger STORE_KEY en production
5. **IPN**: Toujours vérifier signature avant traitement
6. **Idempotence**: Gérer les notifications dupliquées
7. **Remboursements**: CMI nécessite souvent un traitement manuel

---

**Intégration CMI v1.0 - TOMOBILTY**  
*Système de paiement sécurisé pour le Maroc*
