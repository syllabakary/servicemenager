#!/usr/bin/env python
"""
Script de test SMTP avec port 465 (SSL)
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
import traceback

# Paramètres SMTP avec port 465 (SSL)
SMTP_CONFIG = {
    'host': 'smtp.gmail.com',
    'port': 465,
    'use_tls': False,
    'use_ssl': True,
    'username': 'issouf.fof0@gmail.com',
    'password': 'gxvwifedvgemdrge',
    'from_email': 'issouf.fof0@gmail.com',
    'to_email': 'issouf.fof0@gmail.com',
}

def test_smtp_connection():
    """Test de connexion SMTP avec SSL"""
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
        
    except Exception as e:
        print(f"\n❌ ERREUR: {str(e)}")
        print("\nDétails:")
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    test_smtp_connection()









