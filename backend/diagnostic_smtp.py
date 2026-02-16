#!/usr/bin/env python
"""
Script de diagnostic SMTP complet
Teste la connectivité réseau et les différents ports SMTP
"""
import socket
import smtplib
from datetime import datetime
import traceback

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
        ip = socket.gethostbyname(host)
        return True, ip
    except Exception as e:
        return False, str(e)

def test_smtp_connection(host, port, use_ssl=False, timeout=10):
    """Teste une connexion SMTP"""
    try:
        if use_ssl:
            server = smtplib.SMTP_SSL(host, port, timeout=timeout)
        else:
            server = smtplib.SMTP(host, port, timeout=timeout)
        server.quit()
        return True, "Connexion réussie"
    except Exception as e:
        return False, str(e)

print("=" * 70)
print("DIAGNOSTIC COMPLET SMTP")
print("=" * 70)
print(f"\nDate: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

# Test 1: Résolution DNS
print("1. TEST DE RÉSOLUTION DNS")
print("-" * 70)
host = "smtp.gmail.com"
success, result = test_dns_resolution(host)
if success:
    print(f"   ✅ DNS résolu: {host} -> {result}")
else:
    print(f"   ❌ Échec DNS: {result}")
    print("\n   ⚠️  Problème de connexion internet ou DNS")
    exit(1)

# Test 2: Connectivité des ports
print("\n2. TEST DE CONNECTIVITÉ DES PORTS")
print("-" * 70)
ports_to_test = [
    (587, "TLS"),
    (465, "SSL"),
    (25, "SMTP standard"),
    (80, "HTTP (test général)"),
    (443, "HTTPS (test général)"),
]

port_results = {}
for port, description in ports_to_test:
    accessible = test_port_connectivity(host, port, timeout=5)
    status = "✅ Accessible" if accessible else "❌ Bloqué/Timeout"
    port_results[port] = accessible
    print(f"   Port {port:3d} ({description:20s}): {status}")

# Test 3: Connexion SMTP détaillée
print("\n3. TEST DE CONNEXION SMTP DÉTAILLÉE")
print("-" * 70)

# Test port 587 (TLS)
print("\n   Test port 587 (TLS):")
if port_results.get(587, False):
    print("      Tentative de connexion...")
    success, message = test_smtp_connection(host, 587, use_ssl=False, timeout=10)
    if success:
        print(f"      ✅ {message}")
    else:
        print(f"      ❌ Échec: {message}")
else:
    print("      ⚠️  Port non accessible, test ignoré")

# Test port 465 (SSL)
print("\n   Test port 465 (SSL):")
if port_results.get(465, False):
    print("      Tentative de connexion...")
    success, message = test_smtp_connection(host, 465, use_ssl=True, timeout=10)
    if success:
        print(f"      ✅ {message}")
    else:
        print(f"      ❌ Échec: {message}")
else:
    print("      ⚠️  Port non accessible, test ignoré")

# Analyse et recommandations
print("\n" + "=" * 70)
print("ANALYSE ET RECOMMANDATIONS")
print("=" * 70)

if not port_results.get(587, False) and not port_results.get(465, False):
    print("\n❌ PROBLÈME CRITIQUE: Les ports SMTP sont bloqués")
    print("\nCauses possibles:")
    print("   1. Firewall Windows bloque les connexions sortantes")
    print("   2. Antivirus bloque les ports SMTP")
    print("   3. FAI (Fournisseur d'Accès Internet) bloque les ports SMTP")
    print("   4. Routeur/Modem a des restrictions")
    print("\nSolutions:")
    print("   1. Désactiver temporairement le firewall pour tester")
    print("   2. Vérifier les paramètres de l'antivirus")
    print("   3. Contacter votre FAI pour débloquer les ports SMTP")
    print("   4. Utiliser un VPN ou un autre réseau")
    print("   5. Utiliser un service SMTP externe (SendGrid, Mailgun, etc.)")
elif port_results.get(80, False) or port_results.get(443, False):
    print("\n✅ Connexion internet fonctionnelle")
    print("⚠️  Mais les ports SMTP sont bloqués")
    print("\nRecommandation: Utiliser un service SMTP externe")
    print("   - SendGrid (gratuit jusqu'à 100 emails/jour)")
    print("   - Mailgun (gratuit jusqu'à 5000 emails/mois)")
    print("   - Amazon SES (très économique)")
else:
    print("\n⚠️  Problème de connectivité réseau général")
    print("Vérifiez votre connexion internet")

print("\n" + "=" * 70)
print("FIN DU DIAGNOSTIC")
print("=" * 70)







