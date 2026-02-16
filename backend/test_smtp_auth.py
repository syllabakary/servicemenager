#!/usr/bin/env python
"""
Test SMTP avec authentification complète
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
import traceback

SMTP_CONFIG = {
    'host': 'smtp.gmail.com',
    'port': 587,
    'use_tls': True,
    'username': 'issouf.fofana.pro@gmail.com',
    'password': 'vwgbhvbatyeaptlr',  # Mot de passe sans espaces (vwgb hvba teya ptlr)
    'to_email': 'issouf.fofana.pro@gmail.com',
}

print("=" * 70)
print("TEST SMTP AVEC AUTHENTIFICATION")
print("=" * 70)
print(f"\nConfiguration:")
print(f"  Serveur: {SMTP_CONFIG['host']}:{SMTP_CONFIG['port']}")
print(f"  Email: {SMTP_CONFIG['username']}")
print(f"  TLS: {SMTP_CONFIG['use_tls']}")
print(f"  Destinataire: {SMTP_CONFIG['to_email']}")
print("\n" + "=" * 70 + "\n")

smtp_server = None
try:
    # Étape 1: Connexion
    print("📡 Étape 1: Connexion au serveur...")
    smtp_server = smtplib.SMTP(SMTP_CONFIG['host'], SMTP_CONFIG['port'], timeout=30)
    print("   ✅ Connexion TCP établie")
    
    # Étape 2: Activation TLS
    if SMTP_CONFIG['use_tls']:
        print("\n🔒 Étape 2: Activation TLS...")
        smtp_server.starttls()
        print("   ✅ TLS activé")
    
    # Étape 3: Authentification
    print("\n🔐 Étape 3: Authentification...")
    print(f"   Tentative avec: {SMTP_CONFIG['username']}")
    try:
        smtp_server.login(SMTP_CONFIG['username'], SMTP_CONFIG['password'])
        print("   ✅ Authentification réussie!")
    except smtplib.SMTPAuthenticationError as e:
        print(f"   ❌ ÉCHEC D'AUTHENTIFICATION")
        print(f"   Erreur: {str(e)}")
        print("\n" + "=" * 70)
        print("PROBLÈME IDENTIFIÉ: AUTHENTIFICATION ÉCHOUÉE")
        print("=" * 70)
        print("\nCauses possibles:")
        print("   1. ❌ Mot de passe d'application incorrect")
        print("   2. ❌ L'authentification à deux facteurs n'est pas activée")
        print("   3. ❌ Le mot de passe d'application a été révoqué")
        print("\nSolution:")
        print("   1. Allez sur: https://myaccount.google.com/security")
        print("   2. Vérifiez que l'authentification à deux facteurs est activée")
        print("   3. Allez sur: https://myaccount.google.com/apppasswords")
        print("   4. Créez un NOUVEAU mot de passe d'application")
        print("   5. Utilisez le mot de passe généré (16 caractères)")
        print("\n⚠️  IMPORTANT: Le mot de passe doit être généré depuis")
        print("   votre compte Google, pas votre mot de passe Gmail normal!")
        smtp_server.quit()
        exit(1)
    
    # Étape 4: Création du message
    print("\n📧 Étape 4: Création du message...")
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'✅ Test SMTP Réussi - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'
    msg['From'] = SMTP_CONFIG['username']
    msg['To'] = SMTP_CONFIG['to_email']
    
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #DC2626;">✅ Test SMTP Réussi!</h2>
        <p>Félicitations! Votre configuration SMTP fonctionne parfaitement.</p>
        <hr>
        <p><strong>Date:</strong> {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}</p>
        <p><strong>Serveur:</strong> {SMTP_CONFIG['host']}</p>
        <p><strong>Port:</strong> {SMTP_CONFIG['port']} (TLS)</p>
        <p><strong>Email:</strong> {SMTP_CONFIG['username']}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Vous pouvez maintenant utiliser cette configuration dans votre application.
        </p>
      </body>
    </html>
    """
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))
    print("   ✅ Message créé")
    
    # Étape 5: Envoi
    print("\n📤 Étape 5: Envoi de l'email...")
    smtp_server.send_message(msg)
    print("   ✅ Email envoyé avec succès!")
    
    # Fermeture
    smtp_server.quit()
    
    print("\n" + "=" * 70)
    print("✅ TEST COMPLET RÉUSSI!")
    print("=" * 70)
    print(f"\n📬 Email de test envoyé à: {SMTP_CONFIG['to_email']}")
    print("   Vérifiez votre boîte de réception (et les spams)")
    print("\n✅ Votre configuration SMTP est correcte!")
    print("   Vous pouvez maintenant l'utiliser dans /admin/parametres\n")
    
except smtplib.SMTPConnectError as e:
    print(f"\n❌ ERREUR DE CONNEXION: {str(e)}")
    print("\nLe serveur SMTP a refusé la connexion.")
    if smtp_server:
        smtp_server.quit()
except smtplib.SMTPServerDisconnected as e:
    print(f"\n❌ SERVEUR DÉCONNECTÉ: {str(e)}")
    print("\nLe serveur a fermé la connexion.")
except Exception as e:
    print(f"\n❌ ERREUR INATTENDUE: {str(e)}")
    print("\nDétails:")
    print(traceback.format_exc())
    if smtp_server:
        try:
            smtp_server.quit()
        except:
            pass

