#!/usr/bin/env python
"""
Test SMTP final avec le nouveau compte
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

# Configuration
EMAIL = 'issouf.fofana.pro@gmail.com'
PASSWORD_ORIGINAL = 'vwgb hvba teya ptlr'  # Avec espaces comme fourni
PASSWORD_VARIANTS = [
    'vwgbhvbatyeaptlr',  # Sans espaces
    'vwgb hvba teya ptlr',  # Avec espaces
    'vwgbhvbatyeaptlr',  # Sans espaces (vérification)
]

print("=" * 70)
print("TEST SMTP - NOUVEAU COMPTE")
print("=" * 70)
print(f"\nEmail: {EMAIL}")
print(f"Mot de passe original: {PASSWORD_ORIGINAL}")
print(f"\nVariantes à tester:")
for i, pwd in enumerate(PASSWORD_VARIANTS, 1):
    print(f"  {i}. {pwd} (longueur: {len(pwd.replace(' ', ''))})")
print("\n" + "=" * 70 + "\n")

for i, password in enumerate(PASSWORD_VARIANTS, 1):
    password_clean = password.replace(' ', '')
    print(f"TEST {i}: Mot de passe '{password_clean}' (longueur: {len(password_clean)})")
    print("-" * 70)
    
    if len(password_clean) != 16:
        print(f"   ⚠️  Longueur incorrecte! Doit être 16 caractères, mais c'est {len(password_clean)}")
        print()
        continue
    
    try:
        # Connexion
        print("   📡 Connexion...")
        smtp = smtplib.SMTP('smtp.gmail.com', 587, timeout=30)
        print("   ✅ Connexion établie")
        
        # TLS
        print("   🔒 Activation TLS...")
        smtp.starttls()
        print("   ✅ TLS activé")
        
        # Authentification
        print("   🔐 Authentification...")
        smtp.login(EMAIL, password_clean)
        print("   ✅ AUTHENTIFICATION RÉUSSIE!")
        
        # Création et envoi du message
        print("   📧 Création du message...")
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'✅ Test SMTP Réussi - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'
        msg['From'] = EMAIL
        msg['To'] = EMAIL
        
        html = f"""
        <html>
          <body style="font-family: Arial; padding: 20px;">
            <h2 style="color: #DC2626;">✅ Test SMTP Réussi!</h2>
            <p>Votre configuration SMTP fonctionne parfaitement.</p>
            <p><strong>Date:</strong> {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}</p>
            <p><strong>Email:</strong> {EMAIL}</p>
          </body>
        </html>
        """
        msg.attach(MIMEText(html, 'html', 'utf-8'))
        
        print("   📤 Envoi de l'email...")
        smtp.send_message(msg)
        print("   ✅ Email envoyé!")
        
        smtp.quit()
        
        print("\n" + "=" * 70)
        print("✅ SUCCÈS! Le mot de passe fonctionne!")
        print("=" * 70)
        print(f"\n📬 Email envoyé à: {EMAIL}")
        print(f"✅ Mot de passe correct: {password_clean}")
        print("\nVous pouvez maintenant utiliser cette configuration dans /admin/parametres:")
        print(f"  - Email: {EMAIL}")
        print(f"  - Mot de passe: {password_clean}")
        print()
        exit(0)
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"   ❌ Authentification échouée: {str(e)}")
        print()
    except Exception as e:
        print(f"   ❌ Erreur: {str(e)}")
        print()
        smtp.quit()

print("=" * 70)
print("❌ TOUS LES TESTS ONT ÉCHOUÉ")
print("=" * 70)
print("\nLe mot de passe fourni ne fonctionne pas.")
print("\nVérifications à faire:")
print("  1. Le mot de passe doit être exactement 16 caractères (sans espaces)")
print("  2. Il doit être un mot de passe d'application Gmail")
print("  3. L'authentification à deux facteurs doit être activée")
print("  4. Le mot de passe doit être généré depuis:")
print("     https://myaccount.google.com/apppasswords")
print("\nPour créer un nouveau mot de passe d'application:")
print("  1. Allez sur: https://myaccount.google.com/security")
print("  2. Activez l'authentification à deux facteurs si ce n'est pas fait")
print("  3. Allez sur: https://myaccount.google.com/apppasswords")
print("  4. Créez un nouveau mot de passe pour 'Mail'")
print("  5. Copiez le mot de passe généré (16 caractères)")
print()









