# Certificats SSL - Informations importantes

## Let's Encrypt (Actuellement utilisé)

### Caractéristiques :
- ✅ **GRATUIT**
- ✅ **Renouvellement automatique** (configuré par Certbot)
- ✅ **Reconnu par tous les navigateurs**
- ⚠️ **Durée de validité : 90 jours** (renouvelé automatiquement avant expiration)

### Pourquoi 90 jours ?
Let's Encrypt utilise des certificats à courte durée pour des raisons de sécurité :
- Si un certificat est compromis, il expire rapidement
- Encourage les bonnes pratiques de sécurité
- Le renouvellement automatique garantit que vous avez toujours un certificat valide

### Renouvellement automatique
Certbot a configuré un renouvellement automatique. Le certificat sera renouvelé automatiquement avant expiration.

Pour vérifier le renouvellement automatique :
```bash
systemctl status certbot.timer
```

## Certificats payants (pour expiration en 2030)

Si vous avez absolument besoin d'un certificat valide jusqu'en 2030, vous devez utiliser un certificat payant :

### Options :
1. **DigiCert** - Certificats jusqu'à 3 ans (~$200-500/an)
2. **Sectigo (ex-Comodo)** - Certificats jusqu'à 3 ans (~$50-200/an)
3. **GlobalSign** - Certificats jusqu'à 3 ans (~$200-500/an)
4. **GoDaddy** - Certificats jusqu'à 2 ans (~$70-200/an)

### Avantages des certificats payants :
- Durée de validité plus longue (1-3 ans)
- Support client
- Garantie financière
- Options de validation étendue (EV, OV)

### Inconvénients :
- Coût annuel
- Renouvellement manuel nécessaire
- Pas de renouvellement automatique gratuit

## Recommandation

**Nous recommandons de continuer avec Let's Encrypt** car :
- C'est gratuit
- Le renouvellement est automatique
- Aucune intervention manuelle nécessaire
- Aussi sécurisé que les certificats payants
- Reconnu par tous les navigateurs

Le certificat sera renouvelé automatiquement tous les 90 jours, vous n'avez rien à faire !

