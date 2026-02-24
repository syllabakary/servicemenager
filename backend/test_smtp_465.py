#!/usr/bin/env python
"""
Script de test SMTP avec port 465 (SSL).

Pour Gmail : n'utilisez PAS votre mot de passe du compte.
Vous devez créer un "Mot de passe d'application" (App Password) :
  1. Activez la validation en 2 étapes sur votre compte Google.
  2. Allez sur https://myaccount.google.com/apppasswords
  3. Créez un mot de passe d'application pour "Courrier" / "Autre".
  4. Utilisez ce mot de passe de 16 caractères dans SMTP_PASSWORD ou .env.
"""
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
import traceback

# Charger depuis les variables d'environnement (ou .env si python-decouple dispo)
def _env(key, default=""):
    val = os.environ.get(key, default or "").strip()
    if val:
        return val
    try:
        from decouple import config
        return config(key, default=default)
    except Exception:
        return default or ""

# Paramètres SMTP avec port 465 (SSL)
SMTP_CONFIG = {
    'host': _env('SMTP_HOST', 'smtp.gmail.com'),
    'port': int(_env('SMTP_PORT', '465')),
    'use_ssl': True,
    'username': _env('SMTP_USERNAME', 'issouf.fofana.pro@gmail.com'),
    'password': _env('SMTP_PASSWORD', ''),  # Mot de passe d'application Gmail, pas le mot de passe du compte
    'from_email': _env('SMTP_FROM_EMAIL', _env('SMTP_USERNAME', 'issouf.fofana.pro@gmail.com')),
    'to_email': _env('SMTP_TO_EMAIL', _env('SMTP_USERNAME', 'issouf.fofana.pro@gmail.com')),
}

def test_smtp_connection():
    """Test de connexion SMTP avec SSL"""
    if not SMTP_CONFIG['password']:
        print("=" * 60)
        print("ERREUR: SMTP_PASSWORD non défini.")
        print("Pour Gmail, utilisez un MOT DE PASSE D'APPLICATION (pas le mot de passe du compte):")
        print("  1. Activez la validation en 2 étapes: https://myaccount.google.com/security")
        print("  2. Créez un mot de passe d'application: https://myaccount.google.com/apppasswords")
        print("  3. Définissez SMTP_PASSWORD dans .env ou: set SMTP_PASSWORD=votre_mot_de_passe_16_caracteres")
        print("=" * 60)
        return False

    print("=" * 60)
    print("TEST DE CONFIGURATION SMTP (Port 465 - SSL)")
    print("=" * 60)
    print(f"\nConfiguration:")
    print(f"  Serveur SMTP: {SMTP_CONFIG['host']}")
    print(f"  Port: {SMTP_CONFIG['port']} (SSL)")
    print(f"  Email expéditeur: {SMTP_CONFIG['username']}")
    print(f"  Email destinataire: {SMTP_CONFIG['to_email']}")
    print(f"\n{'=' * 60}\n")
    
    try:
        print("📡 Connexion SSL au serveur SMTP...")
        smtp_server = smtplib.SMTP_SSL(SMTP_CONFIG['host'], SMTP_CONFIG['port'], timeout=30)
        print("   ✅ Connexion SSL réussie!")
        
        print("\n🔐 Authentification...")
        smtp_server.login(SMTP_CONFIG['username'], SMTP_CONFIG['password'])
        print("   ✅ Authentification réussie!")
        
        print("\n📧 Création du message...")
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Test SMTP SSL - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'
        msg['From'] = SMTP_CONFIG['from_email']
        msg['To'] = SMTP_CONFIG['to_email']
        
        html_body = f"""
        <html>
          <body>
            <h2 style="color: #DC2626;">✅ Test SMTP SSL réussi!</h2>
            <p>Configuration: Port 465 avec SSL</p>
            <p>Date: {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}</p>
          </body>
        </html>
        """
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        print("   ✅ Message créé!")
        
        print("\n📤 Envoi de l'email...")
        smtp_server.send_message(msg)
        print("   ✅ Email envoyé avec succès!")
        
        smtp_server.quit()
        print("\n✅ TEST RÉUSSI avec le port 465 (SSL)!")
        print(f"📬 Email envoyé à: {SMTP_CONFIG['to_email']}\n")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"\n❌ ERREUR AUTHENTIFICATION: {e}")
        if "535" in str(e) or "Username and Password not accepted" in str(e):
            print("\n📌 Gmail refuse le mot de passe. Utilisez un MOT DE PASSE D'APPLICATION:")
            print("   • https://myaccount.google.com/apppasswords (activez la validation en 2 étapes si besoin)")
            print("   • Créez un mot de passe pour « Courrier » ou « Autre », utilisez les 16 caractères")
            print("   • Dans .env: SMTP_PASSWORD=xxxxxxxxxxxxxxxx (sans espaces)")
        print("\nDétails:")
        print(traceback.format_exc())
        return False
    except Exception as e:
        print(f"\n❌ ERREUR: {str(e)}")
        print("\nDétails:")
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    test_smtp_connection()









