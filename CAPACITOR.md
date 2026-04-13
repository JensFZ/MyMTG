# Capacitor iOS

Diese App nutzt Next.js mit Server Actions, API-Routes und `better-sqlite3`.
Deshalb wird die iOS-App im Entwicklungsmodus als native Capacitor-Huelle
gegen den laufenden Next-Server betrieben.

## iPhone-Scanner testen

1. Next im lokalen Netzwerk starten:

   ```powershell
   npm run dev -- -H 0.0.0.0 -p 3000
   ```

2. Die LAN-IP des Rechners ermitteln:

   ```powershell
   ipconfig
   ```

3. Capacitor mit dieser Server-URL synchronisieren:

   ```powershell
   $env:CAP_SERVER_URL = "http://<deine-ip>:3000"
   npm run cap:sync:ios
   ```

4. Auf einem Mac das iOS-Projekt in Xcode oeffnen:

   ```bash
   npm run cap:open:ios
   ```

5. In Xcode ein Team fuer Signing auswaehlen und auf dem iPhone starten.

## Hinweise

- Die iOS-App enthaelt Kamera- und lokale Netzwerkberechtigungen in
  `ios/App/App/Info.plist`.
- `CAP_SERVER_URL` ist fuer diese Architektur erforderlich. Ohne laufenden
  Next-Server kann die native App die SQLite- und API-Funktionen nicht nutzen.
- Nach Aenderungen an `capacitor.config.ts` oder nativen Dateien erneut
  `npm run cap:sync:ios` ausfuehren.
