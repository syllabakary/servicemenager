#!/usr/bin/env python
"""
Script de diagnostic SMTP avancé
Teste plusieurs configurations et fournit des recommandations
"""
import socket
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
import traceback

# Paramètres SMTP
SMTP_CONFIG = {
    'host': 'smtp.gmail.com',
    'port_587': 587,
    'port_465': 465,
    'username': 'issouf.fof0@gmail.com',
    'password': 'gxvwifedvgemdrge',
}

def test_port_connectivity(host, port, timeout=5):
    """Teste si un port est accessible"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception as e:
        return False

def test_dns_resolution(host):
    """Teste la résolution DNS"""
    try:
        socket.gethostbyname(host)
        return True
    except:
        return False

def test_smtp_587():
    """Test SMTP avec port 587 (TLS)"""
    print("\n" + "="*60)
    print("TEST 1: Port 587 avec TLS")
    print("="*60)
    
    try:
        print("📡 Connexion au serveur...")
        smtp = smtplib.SMTP(SMTP_CONFIG['host'], SMTP_CONFIG['port_587'], timeout=10)
        print("   ✅ Connexion TCP réussie")
        
        print("🔐 Activation TLS...")
        smtp.starttls()
        print("   ✅ TLS activé")
        
        print("🔑 Authentification...")
        smtp.login(SMTP_CONFIG['username'], SMTP_CONFIG['password'])
        print("   ✅ Authentification réussie")
        
        smtp.quit()
        print("\n✅ SUCCÈS: Port 587 fonctionne!")
        return True
    except Exception as e:
        print(f"\n❌ ÉCHEC: {str(e)}")
        return False

def test_smtp_465():
    """Test SMTP avec port 465 (SSL)"""
    print("\n" + "="*60)
    print("TEST 2: Port 465 avec SSL")
    print("="*60)
    
    try:
        print("📡 Connexion SSL au serveur...")
        smtp = smtplib.SMTP_SSL(SMTP_CONFIG['host'], SMTP_CONFIG['port_465'], timeout=10)
        print("   ✅ Connexion SSL réussie")
        
        print("🔑 Authentification...")
        smtp.login(SMTP_CONFIG['username'], SMTP_CONFIG['password'])
        print("   ✅ Authentification réussie")
        
        smtp.quit()
        print("\n✅ SUCCÈS: Port 465 fonctionne!")
        return True
    except Exception as e:
        print(f"\n❌ ÉCHEC: {str(e)}")
        return False

def main():
    print("="*60)
    print("DIAGNOSTIC SMTP COMPLET")
    print("="*60)
    print(f"\nConfiguration:")
    print(f"  Serveur: {SMTP_CONFIG['host']}")
    print(f"  Email: {SMTP_CONFIG['username']}")
    
    # Test DNS
    print("\n" + "="*60)
    print("ÉTAPE 1: Test de résolution DNS")
    print("="*60)
    if test_dns_resolution(SMTP_CONFIG['host']):
        print(f"✅ DNS: {SMTP_CONFIG['host']} résolu avec succès")
    else:
        print(f"❌ DNS: Impossible de résoudre {SMTP_CONFIG['host']}")
        print("   → Vérifiez votre connexion internet")
        return
    
    # Test connectivité ports
    print("\n" + "="*60)
    print("ÉTAPE 2: Test de connectivité des ports")
    print("="*60)
    
    port_587_ok = test_port_connectivity(SMTP_CONFIG['host'], SMTP_CONFIG['port_587'])
    port_465_ok = test_port_connectivity(SMTP_CONFIG['host'], SMTP_CONFIG['port_465'])
    
    print(f"Port 587 (TLS): {'✅ Accessible' if port_587_ok else '❌ Bloqué ou inaccessible'}")
    print(f"Port 465 (SSL): {'✅ Accessible' if port_465_ok else '❌ Bloqué ou inaccessible'}")
    
    if not port_587_ok and not port_465_ok:
        print("\n⚠️  ATTENTION: Les deux ports sont bloqués!")
        print("   → Vérifiez votre firewall Windows")
        print("   → Vérifiez les paramètres de votre antivirus")
        print("   → Vérifiez si votre FAI bloque les ports SMTP")
        print("   → Essayez depuis un autre réseau (hotspot mobile)")
    
    # Tests SMTP
    print("\n" + "="*60)
    print("ÉTAPE 3: Tests SMTP complets")
    print("="*60)
    
    success_587 = test_smtp_587() if port_587_ok else False
    success_465 = test_smtp_465() if port_465_ok else False
    
    # Résumé
    print("\n" + "="*60)
    print("RÉSUMÉ")
    print("="*60)
    
    if success_587:
        print("✅ Configuration recommandée: Port 587 avec TLS")
        print(f"   Serveur: {SMTP_CONFIG['host']}")
        print(f"   Port: 587")
        print(f"   TLS: Activé")
        print(f"   SSL: Désactivé")
    elif success_465:
        print("✅ Configuration recommandée: Port 465 avec SSL")
        print(f"   Serveur: {SMTP_CONFIG['host']}")
        print(f"   Port: 465")
        print(f"   TLS: Désactivé")
        print(f"   SSL: Activé")
    else:
        print("❌ Aucune configuration SMTP ne fonctionne")
        print("\n🔧 SOLUTIONS ALTERNATIVES:")
        print("   1. Utilisez un service SMTP externe (SendGrid, Mailgun, etc.)")
        print("   2. Configurez un serveur SMTP local")
        print("   3. Utilisez un VPN pour contourner les restrictions réseau")
        print("   4. Contactez votre administrateur réseau pour débloquer les ports SMTP")

if __name__ == "__main__":
    main()

