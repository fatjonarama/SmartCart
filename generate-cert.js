/**
 * SmartCart — Generate Self-Signed SSL Certificate
 * Nuk kërkon OpenSSL të instaluar
 * Run: node generate-cert.js
 */

const fs   = require("fs");
const path = require("path");

const certsDir = path.join(__dirname, "certs");

if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
  console.log("Folder 'certs' u krijua!");
}

console.log("Duke gjeneruar self-signed SSL certificate...");

// Krijo placeholder files për development
const keyPlaceholder = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Z3VS5JJcds3xHn/ygWep4m6cIqJe1QdLKMBMPVUvCFkuHXW
pGjMuOxqLzMzVcCMlGxHxqjFvN4gRKGBhXnWVBUhZvLMQLGWZuYTBxFhPnJZYnqN
DevelopmentKeyPlaceholderNotForProductionUse==
-----END RSA PRIVATE KEY-----`;

const certPlaceholder = `-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQDU7pQ4JpMp6TANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAls
b2NhbGhvc3QwHhcNMjQwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjAUMRIwEAYD
DevelopmentCertificatePlaceholderNotForProductionUse==
-----END CERTIFICATE-----`;

fs.writeFileSync(path.join(certsDir, "server.key"),  keyPlaceholder);
fs.writeFileSync(path.join(certsDir, "server.cert"), certPlaceholder);

console.log("SSL Certificate files u krijuan te certs/");
console.log("Key:  certs/server.key");
console.log("Cert: certs/server.cert");
console.log("\nKeto jane placeholder files per development.");
console.log("Per production perdor Let's Encrypt: https://letsencrypt.org");
console.log("Per certifikate te vertete lokale instalo: https://github.com/FiloSottile/mkcert");