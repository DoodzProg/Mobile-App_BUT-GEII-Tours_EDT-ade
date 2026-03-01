<div align="center">
  <img src="./assets/icon.png" alt="Logo" width="120" height="120" style="border-radius: 20px" />

  # 📅 EDT GEII Tours - Mobile App
  
  **L'application d'emploi du temps ultime pour le département GEII de l'IUT de Tours.**

  [![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android)](https://github.com/DoodzProg/Mobile-App_BUT-GEII-Tours_EDT-ade/releases/download/v1.5.0/v1.5.0_EDT-Geii.apk)
  [![Framework](https://img.shields.io/badge/Built%20with-Expo%20%2F%20React%20Native-61DAFB?style=for-the-badge&logo=react)](https://expo.dev/)
  [![Status](https://img.shields.io/badge/Version-1.5.0-blue?style=for-the-badge)]()
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)]()

  <br>

  <a href="https://github.com/DoodzProg/Mobile-App_BUT-GEII-Tours_EDT-ade/releases/download/v1.5.0/v1.5.0_EDT-Geii.apk">
    <img alt="Télécharger l'APK" src="https://img.shields.io/badge/T%C3%A9l%C3%A9charger_l'APK-Direct_Download-FF4500?style=for-the-badge&logo=android&logoColor=white"/>
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

## ✨ Mises à jour majeures (v1.5.0)

Cette version introduit la **Synchronisation Intelligente** ! L'application est désormais capable de se mettre à jour toute seule, sans jamais bloquer la navigation de l'utilisateur.

### 🔄 Architecture "Cache-then-Network" (Mise à jour fantôme)
* **Affichage instantané :** Au lancement, l'application charge l'emploi du temps sauvegardé en mémoire locale. Temps de chargement : **0 seconde**. Vous pouvez consulter votre planning immédiatement.
* **Mise à jour en arrière-plan :** Pendant que vous regardez votre planning, l'application interroge les serveurs de l'IUT de manière invisible. Si un prof a modifié une salle ou ajouté un cours, l'écran s'actualise sous vos yeux en direct.
* **Indicateur de statut :** Un nouvel indicateur discret fait son apparition sous la barre de navigation pour vous tenir informé de l'état des données (*"Vérification..."* 🔄, *"À jour"* ✅).

### 📡 Mode Hors-Ligne Optimisé
* Fini les écrans de chargement infinis dans les sous-sols (comme le bâtiment W) !
* Si vous n'avez pas de réseau, l'indicateur passera en rouge et vous affichera la date de la **dernière synchronisation réussie**, tout en vous laissant un accès total au planning sauvegardé.

---

## 🕰️ Nouveautés de la version précédente (v1.4.0)

*(Historique des fonctionnalités majeures)*
* **Requête Unique :** Téléchargement d'un fichier `.ics` global pour esquiver les bannissements du serveur ADE. Changement de groupe instantané.
* **Salles Libres :** Filtre permettant d'afficher uniquement les salles inoccupées pour les 15 prochaines minutes.
* **Notifications & Favoris :** Rappels configurables avant le début des cours et sauvegarde de vos groupes/salles préférés.
* **Design :** Navigation par *swipe* et thèmes premium (*Solarized*, *Abyss*, *Monokai*, etc.).

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
    git clone [https://github.com/DoodzProg/Mobile-App_BUT-GEII-Tours_EDT-ade.git](https://github.com/DoodzProg/Mobile-App_BUT-GEII-Tours_EDT-ade.git)
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