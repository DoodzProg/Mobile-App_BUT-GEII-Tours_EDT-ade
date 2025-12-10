<div align="center">
  <img src="./assets/icon.png" alt="Logo" width="120" height="120" style="border-radius: 20px" />

  # 📅 EDT GEII Tours - Mobile App
  
  **L'application d'emploi du temps ultime pour le département GEII de l'IUT de Tours.**

  [![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android)](https://play.google.com/store/apps/details?id=fr.doodz.edtgeii)
  [![Framework](https://img.shields.io/badge/Built%20with-Expo%20%2F%20React%20Native-61DAFB?style=for-the-badge&logo=react)](https://expo.dev/)
  [![Status](https://img.shields.io/badge/Version-1.4.0-blue?style=for-the-badge)]()
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)]()

  <a href="https://play.google.com/store/apps/details?id=fr.doodz.edtgeii">
    <img alt="Get it on Google Play" height="80" src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"/>
  </a>
</div>

---

## 📸 Aperçu de l'interface

<div align="center">
  <table>
    <tr>
      <td align="center"><b>Planning (Thème Solarized)</b></td>
      <td align="center"><b>Vue 5 Jours (Thème Abyss)</b></td>
      <td align="center"><b>Menu Principal</b></td>
    </tr>
    <tr>
      <td><img src="./assets/screenshots/1 - Planning color (theme Solarized).jpg" width="250" /></td>
      <td><img src="./assets/screenshots/2 - Planning defaut (theme Abyss).jpg" width="250" /></td>
      <td><img src="./assets/screenshots/3 - Menu (theme Comfy).jpg" width="250" /></td>
    </tr>
    <tr>
      <td align="center"><b>Gestion des Favoris</b></td>
      <td align="center"><b>Notifications</b></td>
      <td align="center"><b>Choix des Thèmes</b></td>
    </tr>
    <tr>
      <td><img src="./assets/screenshots/10 - Menu des favoris (theme DarkGreen).jpg" width="250" /></td>
      <td><img src="./assets/screenshots/5 - Notifications (theme DarkGreen).jpg" width="250" /></td>
      <td><img src="./assets/screenshots/6 - Menu des themes (theme Nord).jpg" width="250" /></td>
    </tr>
     <tr>
      <td align="center"><b>Personnalisation Couleurs</b></td>
      <td align="center"><b>Sélecteur de Couleur</b></td>
      <td align="center"><b>Types d'affichage</b></td>
    </tr>
    <tr>
      <td><img src="./assets/screenshots/7 - Couleurs par type de cours (theme Monokai).jpg" width="250" /></td>
      <td><img src="./assets/screenshots/8 - Listes couleurs personnalisable (theme Monokai).jpg" width="250" /></td>
      <td><img src="./assets/screenshots/9 - Affichage par 5j 7j 1j (theme Abyss).jpg" width="250" /></td>
    </tr>
  </table>
</div>

---

## ✨ Mises à jour majeures (v1.4.0)

Cette version introduit une refonte complète de l'architecture des données pour une performance et une fiabilité accrues.

### 🚀 Architecture "Single Source of Truth"
* **Optimisation Réseau :** L'application ne fait plus qu'**UNE SEULE requête API** globale. Elle télécharge un fichier `.ics` massif contenant l'intégralité des plannings (Étudiants, Profs, Salles, Groupes...).
* **Zéro Latence :** Le changement de groupe, d'enseignant ou de salle est désormais **instantané** car il s'agit d'un filtrage local des données déjà en mémoire.
* **Stabilité :** Supprime totalement le risque de "rate limiting" (bannissement temporaire) par le serveur ADE, car l'utilisateur ne bombarde plus l'API à chaque clic.
* **Mode Hors-Ligne Robuste :** Le calendrier global est mis en cache (`AsyncStorage`). L'application reste 100% fonctionnelle même sans internet. (En se basant sur les dernières données chargées)

### 🏢 Gestion des Salles & Disponibilités
* **Planning des Salles :** Consultation de l'emploi du temps de n'importe quelle salle de l'IUT, triées par étage.
* **Filtre "Salles Libres" :** Un bouton intelligent permet de n'afficher que les salles disponibles.
    * *Algorithme :* Une salle est considérée libre si aucun cours n'y a lieu **maintenant** ET dans les **15 prochaines minutes**. Idéal pour trouver une salle de travail rapidement.

### ⭐ Système de Favoris
* Accès rapide via l'étoile en haut à droite.
* Permet de sauvegarder des **groupes** (ex: BUT3 AII2), des **salles** (ex: GR W 006) pour basculer de l'un à l'autre en un clic.

### 🔔 Notifications Intelligentes
* Système de rappel configurable.
* L'utilisateur peut choisir d'être notifié **X temps** (de 00h00 à 24h59) avant le début de son prochain cours.
* Fonctionne en arrière-plan grâce à `expo-notifications`.

### 🎨 UX & Personnalisation
* **Navigation par Swipe :** Glissez latéralement sur le planning pour changer de semaine ou de jour.
* **Nouveaux Thèmes Premium :** Ajout de *Abyss*, *Dark Green* (Matrix), *Dracula*, *Nord*, *Monokai* et *Solarized* en plus des classiques Jour/Nuit.
* **Couleurs Dynamiques :** Personnalisation complète des couleurs par matière ou par type de cours (CM/TD/TP).

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé les outils suivants sur votre machine (Windows, macOS ou Linux) :

* **Node.js (Version LTS recommandée)** : Le moteur pour faire tourner le projet.
    * 👉 [Télécharger Node.js](https://nodejs.org/)
* **Git** : Nécessaire pour récupérer (cloner) le code source.
    * 👉 [Télécharger Git](https://git-scm.com/downloads)
* **Expo Go** : L'application mobile pour tester le projet en temps réel sur votre téléphone physique.
    * 📲 [Android (Play Store)](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)
* **Visual Studio Code** (Recommandé) : L'éditeur de code idéal pour ce projet.
    * 👉 [Télécharger VS Code](https://code.visualstudio.com/)

> **⚠️ Pour la compilation locale (Étape 4.1 uniquement) :**
> Si vous comptez compiler l'APK sur votre propre machine (sans les serveurs Expo), vous aurez besoin en plus de **Java (JDK 17)** et du **Android SDK**.
> * [Guide officiel pour configurer l'environnement Android](https://reactnative.dev/docs/environment-setup)

## 🛠️ Installation

Pour tester ou contribuer au projet :

1.  **Cloner le dépôt :**
    ```bash
    git clone https://github.com/DoodzProg/Mobile-App_BUT-GEII-Tours_EDT-ade.git
    cd Mobile-App_BUT-GEII-Tours_EDT-ade
    ```

2.  **Installer les dépendances :**
    ```bash
    npm install
    ```

3.  **Lancer le serveur de développement :**
    ```bash
    npx expo start
    ```

4.  **Compiler l'APK (Cloud - Serveurs Expo) :**
    Cette méthode utilise les serveurs d'Expo.
    *Note : Le plan gratuit d'Expo impose une file d'attente prioritaire et une limite mensuelle de builds.*
    ```bash
    eas build --profile preview --platform android
    ```


4.1. **Alternative : Compiler en local (Illimité) :**
    Pour éviter les files d'attente et les limites, vous pouvez compiler directement sur votre machine.
    * **Prérequis :** Nécessite un environnement **Linux** ou **macOS**. Sur Windows (10/11), vous devez impérativement utiliser **WSL (Windows Subsystem for Linux)**.
    * *L'environnement de développement Android (JDK/SDK) doit être configuré.*
    ```bash
    eas build --profile preview --platform android --local
    ```

---

## 🏗️ Stack Technique

* **Framework :** [React Native](https://reactnative.dev/) via [Expo](https://expo.dev/) (SDK 52).
* **Parsing Calendrier :** `ical.js` pour le traitement du fichier ICS global.
* **Stockage Local :** `@react-native-async-storage/async-storage` pour le cache et les préférences utilisateurs.
* **Requêtes HTTP :** `axios` avec gestion des cookies pour l'authentification CAS.
* **UI/UX :** Composants natifs, gestes tactiles (`onTouchStart/End`), animations fluides.

---

<div align="center">
  <p>Développé avec ❤️ par <b>Doodz</b></p>
  <p>Étudiant en BUT GEII - IUT de Tours (2023-2026)</p>
</div>