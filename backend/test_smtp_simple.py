#!/usr/bin/env python
"""
Script de test simple pour vérifier la configuration SMTP
Utilisation: python test_smtp_simple.py
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
import traceback

# Paramètres SMTP de test
SMTP_CONFIG = {
    'host': 'smtp.gmail.com',
    'port': 587,
    'use_tls': True,
    'use_ssl': False,
    'username': 'issouf.fof0@gmail.com',
    'password': 'gxvwifedvgemdrge',
    'from_email': 'issouf.fof0@gmail.com',
    'to_email': 'issouf.fof0@gmail.com',  # Envoyer à soi-même pour le test
}

def test_smtp_connection():
    """Test de connexion SMTP"""
    print("=" * 60)
    print("TEST DE CONFIGURATION SMTP")
    print("=" * 60)
    print(f"\nConfiguration:")
    print(f"  Serveur SMTP: {SMTP_CONFIG['host']}")
    print(f"  Port: {SMTP_CONFIG['port']}")
    print(f"  TLS: {SMTP_CONFIG['use_tls']}")
    print(f"  SSL: {SMTP_CONFIG['use_ssl']}")
    print(f"  Email expéditeur: {SMTP_CONFIG['username']}")
    print(f"  Email destinataire: {SMTP_CONFIG['to_email']}")
    print(f"\n{'=' * 60}\n")
    
    try:
        # Étape 1: Connexion au serveur SMTP
        print("📡 Étape 1: Connexion au serveur SMTP...")
        timeout = 30
        smtp_server = None
        
        if SMTP_CONFIG['use_ssl']:
            print(f"   Connexion SSL sur le port {SMTP_CONFIG['port']}...")
            try:
                smtp_server = smtplib.SMTP_SSL(SMTP_CONFIG['host'], SMTP_CONFIG['port'], timeout=timeout)
                print("   ✅ Connexion SSL réussie!")
            except Exception as e:
                print(f"   ❌ Erreur lors de la connexion SSL: {e}")
                raise
        else:
            print(f"   Connexion TCP sur le port {SMTP_CONFIG['port']}...")
            try:
                smtp_server = smtplib.SMTP(SMTP_CONFIG['host'], SMTP_CONFIG['port'], timeout=timeout)
                print("   ✅ Connexion TCP réussie!")
            except Exception as e:
                print(f"   ❌ Erreur lors de la connexion TCP: {e}")
                raise
            
            if SMTP_CONFIG['use_tls']:
                print("   Activation de TLS...")
                try:
                    smtp_server.starttls()
                    print("   ✅ TLS activé avec succès!")
                except Exception as e:
                    print(f"   ❌ Erreur lors de l'activation TLS: {e}")
                    if smtp_server:
                        smtp_server.quit()
                    raise
        
        # Étape 2: Authentification
        print("\n🔐 Étape 2: Authentification...")
        smtp_server.login(SMTP_CONFIG['username'], SMTP_CONFIG['password'])
        print("   ✅ Authentification réussie!")
        
        # Étape 3: Création du message
        print("\n📧 Étape 3: Création du message de test...")
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Test SMTP - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'
        msg['From'] = SMTP_CONFIG['from_email']
        msg['To'] = SMTP_CONFIG['to_email']
        
        # Corps du message en HTML
        html_body = f"""
        <html>
          <head></head>
          <body>
            <h2 style="color: #DC2626;">✅ Test de configuration SMTP réussi!</h2>
            <p>Ce message a été envoyé depuis votre application ServiceManager.</p>
            <p><strong>Date et heure:</strong> {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}</p>
            <p><strong>Serveur SMTP:</strong> {SMTP_CONFIG['host']}</p>
            <p><strong>Port:</strong> {SMTP_CONFIG['port']}</p>
            <p><strong>Configuration:</strong> {'TLS' if SMTP_CONFIG['use_tls'] else 'SSL' if SMTP_CONFIG['use_ssl'] else 'Aucune'}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">Si vous recevez ce message, votre configuration SMTP est correcte et fonctionne parfaitement!</p>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        print("   ✅ Message créé!")
        
        # Étape 4: Envoi de l'email
        print("\n📤 Étape 4: Envoi de l'email...")
        smtp_server.send_message(msg)
        print("   ✅ Email envoyé avec succès!")
        
        # Étape 5: Fermeture de la connexion
        print("\n🔌 Étape 5: Fermeture de la connexion...")
        smtp_server.quit()
        print("   ✅ Connexion fermée!")
        
        print("\n" + "=" * 60)
        print("✅ TEST RÉUSSI!")
        print("=" * 60)
        print(f"\n📬 Un email de test a été envoyé à: {SMTP_CONFIG['to_email']}")
        print("   Vérifiez votre boîte de réception (et les spams) pour confirmer la réception.")
        print("\n")
        
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print("\n" + "=" * 60)
        print("❌ ERREUR D'AUTHENTIFICATION")
        print("=" * 60)
        print(f"\nErreur: {str(e)}")
        print("\n🔍 Causes possibles:")
        print("   1. Email ou mot de passe incorrect")
        print("   2. Pour Gmail: vous devez utiliser un mot de passe d'application")
        print("   3. L'authentification à deux facteurs doit être activée sur Gmail")
        print("\n💡 Solution pour Gmail:")
        print("   1. Allez sur https://myaccount.google.com/security")
        print("   2. Activez l'authentification à deux facteurs")
        print("   3. Créez un mot de passe d'application:")
        print("      - Allez sur https://myaccount.google.com/apppasswords")
        print("      - Sélectionnez 'Mail' et 'Autre (nom personnalisé)'")
        print("      - Entrez 'ServiceManager' comme nom")
        print("      - Utilisez le mot de passe généré (16 caractères)")
        print("\n")
        return False
        
    except (smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected, ConnectionError, OSError, TimeoutError) as e:
        print("\n" + "=" * 60)
        print("❌ ERREUR DE CONNEXION")
        print("=" * 60)
        print(f"\nErreur: {str(e)}")
        print("\n🔍 Causes possibles:")
        print("   1. Serveur SMTP incorrect ou inaccessible")
        print("   2. Port bloqué par un firewall")
        print("   3. Problème de réseau")
        print("   4. Timeout de connexion")
        print("\n💡 Solutions:")
        print("   1. Vérifiez que le serveur SMTP est correct (smtp.gmail.com pour Gmail)")
        print("   2. Vérifiez que le port est correct (587 pour TLS, 465 pour SSL)")
        print("   3. Vérifiez votre connexion internet")
        print("   4. Vérifiez que votre firewall/autorouteur n'bloque pas le port")
        print("\n")
        return False
        
    except smtplib.SMTPException as e:
        print("\n" + "=" * 60)
        print("❌ ERREUR SMTP")
        print("=" * 60)
        print(f"\nErreur: {str(e)}")
        print("\n🔍 Détails de l'erreur:")
        error_details = traceback.format_exc()
        print(error_details)
        print("\n")
        return False
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ ERREUR INATTENDUE")
        print("=" * 60)
        print(f"\nErreur: {str(e)}")
        print("\n🔍 Détails de l'erreur:")
        error_details = traceback.format_exc()
        print(error_details)
        print("\n")
        return False

if __name__ == "__main__":
    success = test_smtp_connection()
    exit(0 if success else 1)

