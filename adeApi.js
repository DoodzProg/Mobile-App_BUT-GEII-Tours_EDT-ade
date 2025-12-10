/**
 * @file API ADE - Version Calendrier Global Unifié
 * @author Doodz
 * @date Novembre 2025
 * @description Module de gestion de l'API ADE pour récupérer le calendrier global GEII
 * 
 * FONCTIONNALITÉS :
 * - Génération d'URL .ical contenant TOUTES les classes GEII
 * - Système de cache persistant avec validation
 * - Gestion intelligente du mode hors ligne
 * - Retry automatique en cas d'échec
 * - Système de logs détaillé
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

// ===============================================================================================
// CONFIGURATION
// ===============================================================================================

/** Nombre maximum de tentatives de connexion */
const MAX_RETRY_ATTEMPTS = 10;

/** Timeout pour la validation d'URL (en ms) */
const URL_VALIDATION_TIMEOUT = 8000;

/**
 * Liste complète des IDs de toutes les classes GEII
 * - BUT1 : 10767-10776, 10448
 * - BUT2 : 10485-11032
 * - BUT3 : 10538-10970
 */
const ALL_CLASS_IDS = [
  10767, 10768, 10769, 10770, 10771, 10772, 10773, 10776, 10448, // BUT1
  10485, 10515, 10896, 11032, 10464, 10932, // BUT2
  10538, 10459, 10982, 11014, 10969, 10970  // BUT3
];

// Configuration Axios globale
axios.defaults.timeout = 15000;
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Linux; Android 11; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';

// ===============================================================================================
// SYSTÈME DE LOGS
// ===============================================================================================

/**
 * Ajoute une entrée dans les logs de l'application
 * @param {string} message - Message à logger
 * @param {string} level - Niveau de log (INFO, DEBUG, ERROR)
 */
async function addLog(message, level = 'INFO') {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    const existingLogs = await AsyncStorage.getItem('@app_logs') || '';
    const lines = existingLogs.split('\n');
    const recentLines = lines.slice(-300); // Garde les 300 dernières lignes
    const updatedLogs = recentLines.join('\n') + logEntry;
    
    await AsyncStorage.setItem('@app_logs', updatedLogs);
    console.log(`[${level}] ${message}`);
  } catch (error) {
    console.error('Erreur logs:', error);
  }
}

/**
 * Récupère tous les logs de l'application
 * @returns {Promise<string>} Contenu des logs
 */
export async function getLogs() {
  try {
    return await AsyncStorage.getItem('@app_logs') || 'Aucun log disponible.';
  } catch (error) {
    return 'Erreur lors de la récupération des logs.';
  }
}

/**
 * Efface tous les logs de l'application
 */
export async function clearLogs() {
  try {
    await AsyncStorage.removeItem('@app_logs');
    await addLog("Logs effacés par l'utilisateur", "INFO");
  } catch (error) {
    console.error('Erreur effacement logs:', error);
  }
}

// ===============================================================================================
// GESTION DU CACHE PERSISTANT
// ===============================================================================================

/**
 * Sauvegarde l'URL du calendrier global dans le cache
 * @param {string} url - URL à mettre en cache
 */
async function saveUrlToCache(url) {
  try {
    const cacheEntry = {
      url: url,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem('@global_calendar_cache', JSON.stringify(cacheEntry));
    
    const ageStr = new Date().toLocaleString('fr-FR');
    await addLog(`✅ Cache global sauvegardé le ${ageStr}`, "INFO");
  } catch (error) {
    await addLog(`Erreur sauvegarde cache : ${error.message}`, "ERROR");
  }
}

/**
 * Récupère l'URL du calendrier depuis le cache
 * @returns {Promise<string|null>} URL mise en cache ou null
 */
async function getUrlFromCache() {
  try {
    const cached = await AsyncStorage.getItem('@global_calendar_cache');
    if (!cached) {
      await addLog(`Aucun cache global trouvé`, "DEBUG");
      return null;
    }

    const cacheEntry = JSON.parse(cached);
    const age = Date.now() - cacheEntry.timestamp;
    const ageInDays = Math.floor(age / 1000 / 60 / 60 / 24);
    const ageInHours = Math.floor((age / 1000 / 60 / 60) % 24);
    
    await addLog(`Cache global trouvé : ${ageInDays}j ${ageInHours}h`, "DEBUG");
    return cacheEntry.url;
  } catch (error) {
    await addLog(`Erreur lecture cache : ${error.message}`, "ERROR");
    return null;
  }
}

/**
 * Vérifie si une URL .ical est encore valide
 * @param {string} url - URL à valider
 * @returns {Promise<boolean>} true si l'URL est valide
 */
async function isUrlStillValid(url) {
  try {
    await addLog(`🔍 Validation URL en cours...`, "DEBUG");
    
    const response = await axios.get(url, {
      timeout: URL_VALIDATION_TIMEOUT,
      validateStatus: (status) => status === 200
    });
    
    const text = response.data;
    
    if (typeof text !== 'string' || !text.startsWith('BEGIN:VCALENDAR')) {
      await addLog(`❌ URL ne retourne pas un .ical valide`, "DEBUG");
      return false;
    }

    if (!text.includes('BEGIN:VEVENT')) {
      await addLog(`❌ Fichier .ical vide`, "DEBUG");
      return false;
    }

    await addLog(`✅ URL valide (contenu .ical OK)`, "INFO");
    return true;
    
  } catch (error) {
    await addLog(`❌ Erreur validation : ${error.message}`, "DEBUG");
    return false;
  }
}

// ===============================================================================================
// DÉTECTION RÉSEAU
// ===============================================================================================

/**
 * Vérifie si l'appareil est connecté à Internet
 * @returns {Promise<boolean>} true si en ligne
 */
export async function isOnline() {
  try {
    const state = await NetInfo.fetch();
    const online = state.isConnected && state.isInternetReachable;
    await addLog(`Connexion réseau : ${online ? 'En ligne' : 'Hors ligne'}`, "DEBUG");
    return online;
  } catch (error) {
    await addLog(`Erreur vérification réseau : ${error.message}`, "ERROR");
    return false;
  }
}

// ===============================================================================================
// FONCTIONS UTILITAIRES
// ===============================================================================================

/**
 * Pause l'exécution pendant un temps donné
 * @param {number} ms - Durée en millisecondes
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convertit un chiffre en caractère Base64 personnalisé
 * @param {Array} sb - Tableau de caractères
 * @param {number} digit - Chiffre à convertir
 * @param {boolean} haveNonZero - Flag pour éviter les zéros initiaux
 * @returns {boolean} true si on a rencontré un chiffre non-zéro
 */
function base64Append(sb, digit, haveNonZero) {
  if (digit > 0) haveNonZero = true;
  if (haveNonZero) {
    let c;
    if (digit < 26) c = String.fromCharCode("A".charCodeAt(0) + digit);
    else if (digit < 52) c = String.fromCharCode("a".charCodeAt(0) + digit - 26);
    else if (digit < 62) c = String.fromCharCode("0".charCodeAt(0) + digit - 52);
    else if (digit === 62) c = "$";
    else c = "_";
    sb.push(c);
  }
  return haveNonZero;
}

/**
 * Convertit un entier long en chaîne Base64 personnalisée
 * @param {number} value - Valeur à convertir
 * @returns {string} Chaîne Base64
 */
function longToBase64(value) {
  const low = value & 0xffffffff;
  const high = Math.floor(value / 0x100000000);
  let sb = [];
  let haveNonZero = false;
  haveNonZero = base64Append(sb, (high >> 28) & 0xf, haveNonZero);
  haveNonZero = base64Append(sb, (high >> 22) & 0x3f, haveNonZero);
  haveNonZero = base64Append(sb, (high >> 16) & 0x3f, haveNonZero);
  haveNonZero = base64Append(sb, (high >> 10) & 0x3f, haveNonZero);
  haveNonZero = base64Append(sb, (high >> 4) & 0x3f, haveNonZero);
  const v = ((high & 0xf) << 2) | ((low >> 30) & 0x3);
  haveNonZero = base64Append(sb, v, haveNonZero);
  haveNonZero = base64Append(sb, (low >> 24) & 0x3f, haveNonZero);
  haveNonZero = base64Append(sb, (low >> 18) & 0x3f, haveNonZero);
  haveNonZero = base64Append(sb, (low >> 12) & 0x3f, haveNonZero);
  haveNonZero = base64Append(sb, (low >> 6) & 0x3f, haveNonZero);
  base64Append(sb, low & 0x3f, true);
  return sb.join("");
}

/**
 * Convertit une date en chaîne Base64
 * @param {Date} date - Date à convertir
 * @returns {string} Chaîne Base64
 */
function dateStringToBase64(date) {
  return longToBase64(date.getTime());
}

/**
 * Génère un ID utilisateur basé sur l'heure actuelle
 * @returns {string} ID utilisateur en Base64
 */
function currentTimeToBase64() {
  const date = new Date();
  date.setHours(date.getHours() - 2);
  return longToBase64(date.getTime());
}

// ===============================================================================================
// CONNEXION CAS + GWT-RPC
// ===============================================================================================

/**
 * Effectue la connexion au serveur CAS de l'université
 * @returns {Promise<axios.AxiosInstance>} Instance axios avec session authentifiée
 */
async function performLogin() {
  await addLog("🔐 Connexion CAS en cours...", "INFO");
  
  const loginUrl = "https://cas.univ-tours.fr/cas/login?service=https%3A%2F%2Fade.univ-tours.fr%2Fdirect%2Fmyplanning.jsp&renew=true";

  const sessionAxios = axios.create({
    timeout: 15000,
    withCredentials: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
    }
  });
  
  try {
    await addLog("Étape 1/2 : GET jeton execution", "DEBUG");
    
    const response1 = await sessionAxios.get(loginUrl);
    
    if (response1.status !== 200) {
      throw new Error(`HTTP ${response1.status} à l'étape 1`);
    }
    
    const html = response1.data;
    let execution = null;
    
    // Recherche du jeton execution dans le HTML
    let match = html.match(/<input[^>]*name="execution"[^>]*value="([^"]*)"[^>]*>/i);
    if (match && match[1]) execution = match[1];
    
    if (!execution) {
      match = html.match(/<input[^>]*value="([^"]*)"[^>]*name="execution"[^>]*>/i);
      if (match && match[1]) execution = match[1];
    }
    
    if (!execution) {
      match = html.match(/name="execution"\s+value="([^"]+)"/i);
      if (match && match[1]) execution = match[1];
    }
    
    if (!execution) {
      match = html.match(/execution.*?value=["']([^"']+)["']/i);
      if (match && match[1]) execution = match[1];
    }
    
    if (!execution) {
      await addLog(`HTML reçu (premiers 500 chars) : ${html.substring(0, 500)}`, "DEBUG");
      throw new Error("Jeton execution introuvable");
    }
    
    await addLog(`✅ Jeton obtenu : ${execution.substring(0, 20)}...`, "DEBUG");

    // Délai aléatoire pour simuler un comportement humain
    const randomDelay = 400 + Math.floor(Math.random() * 300);
    await sleep(randomDelay);

    await addLog("Étape 2/2 : POST identifiants", "DEBUG");

    const response2 = await sessionAxios.post(
      loginUrl,
      `username=ade-etudiant&password=test&execution=${execution}&_eventId=submit&geolocation=`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': loginUrl,
          'Origin': 'https://cas.univ-tours.fr'
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400
      }
    );

    await addLog("✅ Connexion CAS réussie", "INFO");
    return sessionAxios;
    
  } catch (error) {
    await addLog(`❌ Erreur connexion CAS : ${error.message}`, "ERROR");
    throw error;
  }
}

/**
 * Génère l'URL du fichier .ical contenant TOUTES les classes GEII
 * @param {axios.AxiosInstance} sessionAxios - Instance axios authentifiée
 * @returns {Promise<string>} URL du fichier .ical global
 */
async function generateGlobalIcalUrl(sessionAxios) {
  const userId = currentTimeToBase64();

  // Calcul de l'année scolaire
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const schoolYearStart = currentMonth < 8 ? currentYear - 1 : currentYear;
  
  const date1 = new Date(schoolYearStart, 8, 1); // 1er septembre
  const date2 = new Date(schoolYearStart + 1, 7, 31); // 31 août
  
  await addLog(`Dates demandées : ${date1.toLocaleDateString()} → ${date2.toLocaleDateString()}`, "DEBUG");

  try {
    await addLog("Étape 3/4 : GWT Login", "DEBUG");
    
    // Connexion au service GWT
    const response3 = await sessionAxios.post(
      "https://ade.univ-tours.fr/direct/gwtdirectplanning/MyPlanningClientServiceProxy",
      `7|0|8|https://ade.univ-tours.fr/direct/gwtdirectplanning/|217140C31DF67EF6BA02D106930F5725|com.adesoft.gwt.directplan.client.rpc.MyPlanningClientServiceProxy|method1login|J|com.adesoft.gwt.core.client.rpc.data.LoginRequest/3705388826|com.adesoft.gwt.directplan.client.rpc.data.DirectLoginRequest/635437471||1|2|3|4|2|5|6|${userId}|7|0|0|0|1|1|8|8|-1|0|0|`,
      {
        headers: {
          "Content-Type": "text/x-gwt-rpc; charset=UTF-8",
          "X-GWT-Module-Base": "https://ade.univ-tours.fr/direct/gwtdirectplanning/",
          "X-GWT-Permutation": "30B3E0B5D2C57008E936E550EA0E3F25"
        }
      }
    );
    
    if (response3.status !== 200) {
      throw new Error(`HTTP ${response3.status} à l'étape 3`);
    }

    await sleep(200 + Math.floor(Math.random() * 150));

    await addLog("Étape 4/4 : Génération URL .ical GLOBAL", "DEBUG");
    
    // Construction du payload avec TOUS les IDs de classes
    const classIdsPayload = ALL_CLASS_IDS.map(id => `9|${id}`).join('|');
    const numberOfClasses = ALL_CLASS_IDS.length;
    
    const payload = `7|0|11|https://ade.univ-tours.fr/direct/gwtdirectplanning/|748880AB5D6D59CC4770FCCE7567EA63|com.adesoft.gwt.core.client.rpc.CorePlanningServiceProxy|method11getGeneratedUrl|J|java.util.List|java.lang.String/2004016611|java.util.Date/3385151746|java.lang.Integer/3438268394|java.util.ArrayList/4159755760|ical|1|2|3|4|7|5|6|7|8|8|9|9|${userId}|10|${numberOfClasses}|${classIdsPayload}|11|8|${dateStringToBase64(date1)}|8|${dateStringToBase64(date2)}|9|-1|9|226|`;
    
    const response4 = await sessionAxios.post(
      "https://ade.univ-tours.fr/direct/gwtdirectplanning/CorePlanningServiceProxy",
      payload,
      {
        headers: {
          "Content-Type": "text/x-gwt-rpc; charset=UTF-8",
          "X-GWT-Module-Base": "https://ade.univ-tours.fr/direct/gwtdirectplanning/",
          "X-GWT-Permutation": "30B3E0B5D2C57008E936E550EA0E3F25"
        }
      }
    );

    if (response4.status !== 200) {
      throw new Error(`HTTP ${response4.status} à l'étape 4`);
    }

    // Extraction de l'URL du fichier .ical
    const responseText = response4.data;
    const urlMatch = responseText.match(/https?:\/\/[^\s"\\]+/g);

    if (urlMatch && urlMatch[0]) {
      await addLog(`✅ URL GLOBALE générée : ${urlMatch[0]}`, "INFO");
      return urlMatch[0];
    } else {
      throw new Error("URL .ical introuvable dans la réponse GWT");
    }
    
  } catch (error) {
    await addLog(`❌ Erreur génération URL : ${error.message}`, "ERROR");
    throw error;
  }
}

// ===============================================================================================
// RETRY INTELLIGENT
// ===============================================================================================

/**
 * Tente de générer l'URL avec retry automatique
 * @returns {Promise<string>} URL du calendrier global
 */
async function attemptUrlGenerationWithRetry() {
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      await addLog(`🔄 Tentative ${attempt}/${MAX_RETRY_ATTEMPTS} pour calendrier GLOBAL`, "INFO");

      const sessionAxios = await performLogin();
      const url = await generateGlobalIcalUrl(sessionAxios);
      
      await addLog(`✅ Succès après ${attempt} tentative(s)`, "INFO");
      return url;

    } catch (error) {
      await addLog(`❌ Tentative ${attempt} échouée : ${error.message}`, "ERROR");

      if (attempt < MAX_RETRY_ATTEMPTS) {
        const delay = 500 * attempt;
        await addLog(`⏳ Attente de ${delay}ms avant réessai...`, "INFO");
        await sleep(delay);
      } else {
        await addLog(`💀 Échec définitif après ${MAX_RETRY_ATTEMPTS} tentatives`, "ERROR");
        throw new Error(`Échec génération URL après ${MAX_RETRY_ATTEMPTS} tentatives`);
      }
    }
  }
}

// ===============================================================================================
// FONCTION PRINCIPALE EXPORTÉE
// ===============================================================================================

/**
 * Génère ou récupère l'URL du calendrier global GEII
 * - Utilise le cache si disponible et valide
 * - Génère une nouvelle URL si nécessaire
 * - Gère le mode hors ligne
 * 
 * @returns {Promise<Object>} Objet contenant l'URL et des métadonnées
 *   - url: URL du fichier .ical (ou null)
 *   - fromCache: true si l'URL vient du cache
 *   - isOffline: true si l'appareil est hors ligne
 */
export async function genCalendar() {
  await addLog(`\n${'='.repeat(60)}`, "INFO");
  await addLog(`DÉBUT genCalendar (CALENDRIER GLOBAL)`, "INFO");
  await addLog(`${'='.repeat(60)}`, "INFO");

  const online = await isOnline();
  
  if (!online) {
    await addLog("📶 Mode HORS LIGNE détecté", "INFO");
    const cachedUrl = await getUrlFromCache();
    
    if (cachedUrl) {
      await addLog("📦 Utilisation du cache (mode hors ligne)", "INFO");
      return { url: cachedUrl, fromCache: true, isOffline: true };
    } else {
      await addLog("❌ Aucun cache disponible en mode hors ligne", "ERROR");
      return { url: null, fromCache: false, isOffline: true };
    }
  }

  const cachedUrl = await getUrlFromCache();
  
  if (cachedUrl) {
    await addLog("🔍 Cache trouvé, validation en cours...", "INFO");
    
    const isValid = await isUrlStillValid(cachedUrl);
    
    if (isValid) {
      await addLog("✅ Cache valide → Utilisation directe", "INFO");
      return { url: cachedUrl, fromCache: true, isOffline: false };
    } else {
      await addLog("🔄 Cache expiré → Régénération nécessaire", "INFO");
    }
  } else {
    await addLog("🆕 Aucun cache → Génération d'une nouvelle URL", "INFO");
  }

  try {
    const newUrl = await attemptUrlGenerationWithRetry();
    await saveUrlToCache(newUrl);
    
    await addLog("🎉 Génération terminée avec succès", "INFO");
    return { url: newUrl, fromCache: false, isOffline: false };
    
  } catch (error) {
    await addLog(`💥 Échec génération : ${error.message}`, "ERROR");
    
    if (cachedUrl) {
      await addLog("⚠️ Utilisation cache en dernier recours", "INFO");
      return { url: cachedUrl, fromCache: true, isOffline: false };
    }
    
    await addLog("❌ Aucune solution disponible", "ERROR");
    return { url: null, fromCache: false, isOffline: false };
  }
}