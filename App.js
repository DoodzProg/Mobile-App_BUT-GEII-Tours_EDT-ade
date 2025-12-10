/**
 * @file Application Emploi du Temps GEII - Version Calendrier Global
 * @author Doodz
 * @date Novembre 2025
 * @description Application mobile React Native pour consulter l'emploi du temps du BUT GEII Tours
 * 
 * ARCHITECTURE :
 * - Une seule requête API pour TOUT le calendrier (toutes les classes)
 * - Filtrage LOCAL par groupe (pas de requête réseau supplémentaire)
 * - Cache du tableau d'événements parsé (pas juste l'URL)
 * - Interface moderne avec thèmes clair/sombre
 * - Personnalisation des couleurs par type de cours ou matière
 * - Affichages multiples : semaine, semaine complète, jour
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, useColorScheme, StatusBar, Linking, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ICAL from 'ical.js';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { genCalendar, getLogs, clearLogs } from './adeApi';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// --- CONFIGURATION NOTIFICATIONS ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ===============================================================================================
// CONFIGURATION
// ===============================================================================================

/**
 * Mapping des groupes GEII par année
 * Chaque groupe a un ID unique dans le système ADE
 */
const groupIDs = {
  'BUT1': { 'A1': 10767, 'A2': 10768, 'B1': 10769, 'B2': 10770, 'C1': 10771, 'C2': 10772, 'D1': 10773, 'D2': 10776, 'M1': 10448 },
  'BUT2': { 'AII1': 10485, 'AII2': 10515, 'EME1': 10896, 'EME2': 11032, 'ESE1': 10464, 'ESE2': 10932 },
  'BUT3': { 'AII1': 10538, 'AII2': 10459, 'EME1': 10982, 'EME2': 11014, 'ESE1': 10969, 'ESE2': 10970 },
};

/** Abréviations des jours de la semaine */
const daysOfWeekShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/**
 * Configuration des thèmes
 * Ajout de la propriété 'boxText' pour le texte dans les encadrés
 */
const themes = {
  light: {
    background: '#fff', text: '#000', topBar: '#f8f8f8', borderColor: '#eee',
    buttonBackground: '#f0f0f0', buttonText: '#000', headerBackground: '#f0f0f0',
    headerText: '#000', todayHeaderBackground: '#444', todayHeaderText: '#fff',
    eventBackground: '#ebebebff', eventBorder: '#c7c7c7ff', eventText: '#333',
    modalBackground: '#fff', modalText: '#000', modalButton: '#ddd',
    boxText: '#000', // Texte noir dans les boîtes claires
  },
  dark: {
    background: '#121212', text: '#fff', topBar: '#1f1f1f', borderColor: '#333',
    buttonBackground: '#333', buttonText: '#fff', headerBackground: '#1f1f1f',
    headerText: '#fff', todayHeaderBackground: '#666', todayHeaderText: '#fff',
    eventBackground: '#2a2a2a', eventBorder: '#4a4a4a', eventText: '#fff',
    modalBackground: '#1f1f1f', modalText: '#fff', modalButton: '#444',
    boxText: '#fff', // Texte blanc dans les boîtes sombres
  },
  abyss: {
    background: '#050d21', text: '#e0e0e0', topBar: '#000c18', borderColor: '#1b2f52',
    buttonBackground: '#111d36', buttonText: '#77aadd', headerBackground: '#000c18',
    headerText: '#6688cc', 
    todayHeaderBackground: '#1b2f52', 
    todayHeaderText: '#fff',
    eventBackground: '#1b2f52', eventBorder: '#223355', eventText: '#ddeeff',
    modalBackground: '#051336', modalText: '#cbd9f4', modalButton: '#1b2f52',
    boxText: '#ddeeff',
  },
  darkgreen: {
    background: '#1e1e1e', text: '#d4d4d4', topBar: '#161616', borderColor: '#3a3a3a',
    buttonBackground: '#2d2d2d', buttonText: '#4caf50', headerBackground: '#161616',
    headerText: '#81c784', todayHeaderBackground: '#4caf50', todayHeaderText: '#000',
    eventBackground: '#2d2d2d', eventBorder: '#1b5e20', eventText: '#e8f5e9',
    modalBackground: '#1e1e1e', modalText: '#d4d4d4', modalButton: '#2d2d2d',
    boxText: '#d4d4d4',
  },
  comfy: {
    background: '#3e3530', text: '#f2e9e4', topBar: '#2d2622', borderColor: '#5c4d45',
    buttonBackground: '#5c4d45', buttonText: '#f2e9e4', headerBackground: '#2d2622',
    headerText: '#dcb8a8', todayHeaderBackground: '#dcb8a8', todayHeaderText: '#2d2622',
    eventBackground: '#5c4d45', eventBorder: '#786459', eventText: '#f2e9e4',
    modalBackground: '#2d2622', modalText: '#f2e9e4', modalButton: '#5c4d45',
    boxText: '#f2e9e4',
  },
  violet: {
    background: '#201a2b', text: '#e6e1ff', topBar: '#17131f', borderColor: '#392e4d',
    buttonBackground: '#2d243d', buttonText: '#bd93f9', headerBackground: '#17131f',
    headerText: '#bd93f9', todayHeaderBackground: '#bd93f9', todayHeaderText: '#17131f',
    eventBackground: '#2d243d', eventBorder: '#524273', eventText: '#f8f8f2',
    modalBackground: '#1b1624', modalText: '#e6e1ff', modalButton: '#2d243d',
    boxText: '#e6e1ff',
  },
  dracula: {
    background: '#282a36', text: '#f8f8f2', topBar: '#21222c', borderColor: '#44475a',
    buttonBackground: '#44475a', buttonText: '#bd93f9', headerBackground: '#21222c',
    headerText: '#8be9fd', todayHeaderBackground: '#ff79c6', todayHeaderText: '#282a36',
    eventBackground: '#44475a', eventBorder: '#6272a4', eventText: '#f8f8f2',
    modalBackground: '#282a36', modalText: '#f8f8f2', modalButton: '#44475a',
    boxText: '#f8f8f2',
  },
  nord: {
    background: '#2e3440', text: '#d8dee9', topBar: '#242933', borderColor: '#4c566a',
    buttonBackground: '#3b4252', buttonText: '#88c0d0', headerBackground: '#242933',
    headerText: '#81a1c1', todayHeaderBackground: '#5e81ac', todayHeaderText: '#eceff4',
    eventBackground: '#3b4252', eventBorder: '#434c5e', eventText: '#e5e9f0',
    modalBackground: '#2e3440', modalText: '#d8dee9', modalButton: '#3b4252',
    boxText: '#d8dee9',
  },
  // ☀️ SOLARIZED (Version optimisée : Fond clair, mais Boîtes/Boutons Sombres)
  solarized: {
    background: '#fdf6e3',      // Fond Crème clair
    text: '#657b83',            // Texte gris moyen
    topBar: '#eee8d5',          // Barre beige
    
    // MODIFS MAJEURES ICI POUR LE CONTRASTE :
    borderColor: '#073642',     // Boîtes : Bleu nuit profond (Solarized Base02)
    buttonBackground: '#073642',// Boutons : Bleu nuit profond
    buttonText: '#fdf6e3',      // Texte boutons : Blanc crème
    boxText: '#fdf6e3',         // Texte dans les boîtes : Blanc crème (TA DEMANDE)
    
    headerBackground: '#eee8d5',
    headerText: '#586e75',
    todayHeaderBackground: '#cb4b16', 
    todayHeaderText: '#fdf6e3',
    eventBackground: '#fdf6e3', 
    eventBorder: '#586e75', 
    eventText: '#657b83',
    modalBackground: '#fdf6e3', // Fond modale clair
    modalText: '#657b83',       // Texte modale sombre
    modalButton: '#073642',     // Bouton retour sombre
  },
  monokai: {
    background: '#272822', text: '#f8f8f2', topBar: '#1e1f1c', borderColor: '#49483e',
    buttonBackground: '#3e3d32', buttonText: '#fd971f', headerBackground: '#1e1f1c',
    headerText: '#a6e22e', todayHeaderBackground: '#f92672', todayHeaderText: '#f8f8f2',
    eventBackground: '#3e3d32', eventBorder: '#75715e', eventText: '#f8f8f2',
    modalBackground: '#272822', modalText: '#f8f8f2', modalButton: '#3e3d32',
    boxText: '#f8f8f2',
  }
};

/** Version de l'application */
const APP_VERSION = "v1.4.0";

// ===============================================================================================
// FONCTIONS UTILITAIRES
// ===============================================================================================

/**
 * Parse le fichier .ics et retourne TOUS les événements du calendrier global
 * @param {string} url - URL du fichier .ics à télécharger
 * @returns {Promise<Array>} Tableau d'événements parsés
 */
async function parseGlobalICS(url) {
  try {
    console.log("📥 Téléchargement du calendrier global...");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    
    const icsText = await response.text();
    const jcalData = ICAL.parse(icsText);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    console.log(`✅ ${vevents.length} événements parsés`);

    const events = vevents.map(vevent => {
      const event = new ICAL.Event(vevent);
      const description = vevent.getFirstPropertyValue('description') || '';
      const location = vevent.getFirstPropertyValue('location') || 'Salle inconnue';
      
      let cleanSummary = event.summary;
      
      // Extraction du type de cours (CM, TD, TP)
      const typeMatch = cleanSummary.match(/\b(CM|TD|TP)\b/i);
      const courseType = typeMatch ? typeMatch[1].toUpperCase() : 'Autre';
     
      // Extraction du nom du cours (ex: R101, S104)
      const nameMatch = cleanSummary.match(/\b([A-Z]{2,5}[0-9])\b/i);
      const courseName = nameMatch ? nameMatch[1].toUpperCase() : 'Inconnu';
      
      // Nettoyage du titre (suppression des groupes)
      const groupRegex = /Gr (?:[A-Z]{2,4}[0-9]?|[A-Z][0-9]?)/;
      cleanSummary = cleanSummary.replace(groupRegex, '').trim();

      // Parse de la description complète
      let fullDescription = description.replace(/\\n/g, '\n').trim();
      
      const descriptionLines = fullDescription.split('\n').filter(line => line.trim() !== '');
      const timeLogLine = descriptionLines.find(line => line.startsWith('(Exported'));
      const teacherLine = descriptionLines[descriptionLines.indexOf(timeLogLine) - 1];
      const groupLines = descriptionLines.slice(0, descriptionLines.indexOf(teacherLine));
      
      return {
        title: cleanSummary,
        location: location,
        start: event.startDate.toJSDate(),
        end: event.endDate.toJSDate(),
        fullDescription: fullDescription,
        groups: groupLines,
        teacher: teacherLine,
        timeLog: timeLogLine,
        courseType,
        courseName,
      };
    });

    events.sort((a, b) => a.start - b.start);
    return events;
  } catch (error) {
    console.error("❌ Erreur parsing ICS global:", error);
    throw error;
  }
}

/**
 * Extrait une liste unique et triée (ex: liste des profs)
 */
function getUniqueList(events, field) {
  const items = new Set();
  events.forEach(event => {
    if (event[field] && event[field].trim() !== '') {
      // Nettoyage basique (enlever les sauts de ligne)
      const val = event[field].replace(/\n/g, ' ').trim();
      items.add(val);
    }
  });
  return Array.from(items).sort((a, b) => a.localeCompare(b));
}

/**
 * Groupe une liste de noms par première lettre (pour l'affichage alphabétique)
 */
function groupAlphabetically(list) {
  const grouped = {};
  list.forEach(item => {
    const firstLetter = item.charAt(0).toUpperCase();
    if (!grouped[firstLetter]) grouped[firstLetter] = [];
    grouped[firstLetter].push(item);
  });
  return grouped;
}

/**
 * Groupe les salles par étage (Rez-de-chaussée, Étage 1, Étage 2, Autres)
 */
function groupRoomsByFloor(list) {
  const groups = {
    'Rez-de-chaussée': [],
    'Étage 1': [],
    'Étage 2': [],
    'Autres': []
  };

  list.forEach(room => {
    const upperRoom = room.toUpperCase().trim();
    
    // CAS SPÉCIFIQUE : SEUL "GR W AMPHI" va au RdC
    if (upperRoom.includes('GR W AMPHI') || upperRoom === 'W AMPHI') {
      groups['Rez-de-chaussée'].push(room);
      return; 
    }

    // Regex pour capturer le numéro après GR W
    const match = upperRoom.match(/GR\s*W\s*(\d{3})/);

    if (match && match[1]) {
      const number = match[1];
      if (number.startsWith('0')) groups['Rez-de-chaussée'].push(room);
      else if (number.startsWith('1')) groups['Étage 1'].push(room);
      else if (number.startsWith('2')) groups['Étage 2'].push(room);
      else groups['Autres'].push(room);
    } else {
      groups['Autres'].push(room);
    }
  });

  // Nettoyage et Tri Spécial
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) delete groups[key];
    else {
      groups[key].sort(); // D'abord on trie tout (001, 002, Amphi...)

      // SI on est au RDC, on force l'Amphi en PREMIER
      if (key === 'Rez-de-chaussée') {
        const amphiIndex = groups[key].findIndex(r => r.toUpperCase().includes('AMPHI'));
        if (amphiIndex > -1) {
          const amphi = groups[key].splice(amphiIndex, 1)[0]; // On le retire de sa place
          groups[key].unshift(amphi); // On le met tout au début
        }
      }
    }
  });

  return groups;
}

/**
 * Filtre Universel : Gère Étudiants, Profs et Salles avec le même fichier
 * @param {Array} allEvents - La totalité du calendrier
 * @param {string} type - 'student', 'teacher', ou 'room'
 * @param {Object} criteria - { year, group } pour student, ou la chaîne de caractère pour teacher/room
 */
function filterGlobalEvents(allEvents, type, criteria) {
  if (!allEvents) return [];

  return allEvents.filter(event => {
    // --- FILTRE ÉTUDIANT ---
    if (type === 'student') {
      const { year, group } = criteria;
      // Cas Spécifique BUT1
      if (year === 'BUT1') {
        return event.groups.some(g => g.trim() === group);
      } 
      // Cas BUT2 et BUT3
      else {
        const searchPattern = `${year}A_${group}`; 
        return event.groups.some(g => g.includes(searchPattern));
      }
    }
    
    // --- FILTRE PROFESSEUR ---
    else if (type === 'teacher') {
      // On vérifie si le nom du prof est dans la ligne teacher
      return event.teacher && event.teacher.toUpperCase().includes(criteria.toUpperCase()); 
    }
    
    // --- FILTRE SALLE ---
    else if (type === 'room') {
      return event.location && event.location.toUpperCase().includes(criteria.toUpperCase());
    }
    
    return false;
  });
}

/**
 * Calcule la couleur de texte contrastante pour un fond donné
 * @param {string} hexcolor - Couleur de fond en hexadécimal
 * @returns {string} '#000' ou '#fff' selon le contraste
 */
const getContrastColor = (hexcolor) => {
  if (!hexcolor) return '#000';
  const r = parseInt(hexcolor.substr(1, 2), 16);
  const g = parseInt(hexcolor.substr(3, 2), 16);
  const b = parseInt(hexcolor.substr(5, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000' : '#fff';
};

/**
 * Calcule le numéro de semaine ISO 8601 d'une date
 * @param {Date} date - Date à analyser
 * @returns {number} Numéro de semaine (1-53)
 */
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// ===============================================================================================
// COMPOSANTS MODAUX
// ===============================================================================================

/**
 * Modal Universelle de Sélection (Corrigée pour Solarized)
 */
const UniversalSelectionModal = ({ visible, onClose, onSelect, theme, availableRooms, favorites = [], allEvents }) => {
  const [tab, setTab] = useState('student');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  const isFav = (type, value) => {
    return favorites.some(f => {
      if (f.type !== type) return false;
      if (type === 'student') return f.value.year === value.year && f.value.group === value.group;
      return f.value === value;
    });
  };

  // Rendu de l'onglet Étudiant
  const renderStudentTab = () => (
    <View style={styles.groupTable}>
      {Object.keys(groupIDs).map(year => (
        <View 
          key={year} 
          style={[
            styles.groupColumn,
            { 
              backgroundColor: theme.borderColor, 
              borderRadius: 16, marginHorizontal: 5, paddingVertical: 15, paddingHorizontal: 2    
            }
          ]}
        >
          <Text style={[styles.groupYearTitle, { color: theme.boxText || theme.modalText }]}>{year}</Text>
          
          {Object.keys(groupIDs[year]).map(groupName => {
            const value = { year, group: groupName };
            const fav = isFav('student', value);
            return (
              <TouchableOpacity 
                key={groupName} 
                style={[
                  styles.groupButton, 
                  { 
                    backgroundColor: theme.modalBackground,
                    width: '90%', marginBottom: 8, borderRadius: 8,
                    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                    borderWidth: fav ? 1 : 0, borderColor: '#FFD700'
                  }
                ]} 
                onPress={() => onSelect('student', value)}
              >
                {/* MODIF ICI : Utilisation de modalText au lieu de buttonText */}
                <Text style={[styles.groupButtonText, { color: theme.modalText }]}>{groupName}</Text>
                {fav && <Ionicons name="star" size={12} color="#FFD700" style={{ marginLeft: 5 }} />}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  // Fonction pour obtenir les salles libres (Maintenant + 15min)
  const getFreeRooms = () => {
    const now = new Date();
    const future = new Date(now.getTime() + 15 * 60000); // Maintenant + 15min
    
    // On cherche toutes les salles occupées dans cet intervalle
    const occupiedSet = new Set();
    
    allEvents.forEach(event => {
      // Si l'événement chevauche la période [Maintenant -> Future]
      // (Commence avant la fin de la période ET termine après le début de la période)
      if (event.start < future && event.end > now) {
        if (event.location) {
          // On sépare les salles si y'en a plusieurs (ex: "GR W 001, GR W 002")
          const locs = event.location.split(',');
          locs.forEach(l => occupiedSet.add(l.trim()));
        }
      }
    });

    // On retourne uniquement les salles qui NE SONT PAS dans le set occupiedSet
    return availableRooms.filter(room => !occupiedSet.has(room));
  };

  // Rendu des listes
  const renderList = (data, type) => {
    // Si on est en mode "Salles", on décide quelle liste utiliser
    let listToDisplay = data;
    if (type === 'room' && showFreeOnly) {
      listToDisplay = getFreeRooms();
    }

    if (!listToDisplay || listToDisplay.length === 0) {
      return (
        <View style={{ width: '100%', alignItems: 'center', marginTop: 20 }}>
          {type === 'room' && showFreeOnly && (
             // Si on filtre et qu'il n'y a rien, on affiche le switch quand même pour pouvoir l'enlever
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20, paddingHorizontal: 5 }}>
                <Text style={{ color: theme.modalText, fontSize: 14, fontWeight: 'bold' }}>
                  Afficher uniquement les salles libres
                </Text>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => setShowFreeOnly(!showFreeOnly)}
                  style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: showFreeOnly ? '#4caf50' : theme.borderColor, padding: 2, justifyContent: 'center', alignItems: showFreeOnly ? 'flex-end' : 'flex-start' }}
                >
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff' }} />
                </TouchableOpacity>
             </View>
          )}
          <Text style={{color: theme.modalText, padding: 20, textAlign: 'center'}}>
            {type === 'room' && showFreeOnly 
              ? "Aucune salle libre trouvée pour les 15 prochaines minutes occupied." 
              : "Aucune donnée disponible."}
          </Text>
        </View>
      );
    }

    let grouped;
    let sortedKeys;

    if (type === 'room') {
      grouped = groupRoomsByFloor(listToDisplay);
      const floorOrder = ['Rez-de-chaussée', 'Étage 1', 'Étage 2', 'Autres'];
      sortedKeys = floorOrder.filter(key => grouped[key]);
    } else {
      grouped = groupAlphabetically(listToDisplay);
      sortedKeys = Object.keys(grouped).sort();
    }

    return (
      <ScrollView style={{ width: '100%', maxHeight: 400 }}>
        
        {/* --- LE BOUTON SWITCH (Visible uniquement pour les salles) --- */}
        {type === 'room' && (
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            width: '100%', 
            marginBottom: 20, 
            paddingHorizontal: 5,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.borderColor
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.modalText, fontSize: 15, fontWeight: '600' }}>
                Salles libres uniquement
              </Text>
              <Text style={{ color: theme.modalText, fontSize: 10, opacity: 0.6 }}>
                Libres maintenant et dans 15 min
              </Text>
            </View>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setShowFreeOnly(!showFreeOnly)}
              style={{
                width: 50,
                height: 30,
                borderRadius: 15,
                backgroundColor: showFreeOnly ? '#4caf50' : theme.borderColor, // Vert si ON, Gris si OFF
                padding: 2,
                justifyContent: 'center',
                alignItems: showFreeOnly ? 'flex-end' : 'flex-start',
                borderWidth: 1,
                borderColor: theme.borderColor
              }}
            >
              <View style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: '#fff',
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 2,
              }} />
            </TouchableOpacity>
          </View>
        )}

        {sortedKeys.map(key => (
          <View key={key} style={{ width: '100%', marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
              <Text style={{ color: theme.modalText, fontSize: 18, fontWeight: 'bold', marginRight: 10 }}>{key}</Text>
              <View style={{ height: 1, flex: 1, backgroundColor: theme.borderColor }} />
            </View>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {grouped[key].map((item, index) => {
                let displayName = item;
                if (type === 'room') {
                  if (item.toUpperCase().includes('GR W AMPHI')) displayName = "Amphi Geii (W)"; 
                  else if (/GR\s*W\s*\d/.test(item.toUpperCase())) displayName = item.replace(/^GR\s*W\s*/i, '');
                  else displayName = item.replace(/^GR\s*/i, '');
                }

                const fav = isFav(type, item);

                return (
                  <TouchableOpacity 
                    key={index}
                    style={[
                      styles.groupButton, 
                      { 
                        backgroundColor: theme.buttonBackground, 
                        width: '100%', marginBottom: 8,
                        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                        borderWidth: fav ? 1 : 0, borderColor: '#FFD700',
                        // Si c'est une salle libre, on met une petite bordure verte subtile
                        borderLeftWidth: (type === 'room' && showFreeOnly) ? 5 : 0,
                        borderLeftColor: '#4caf50'
                      }
                    ]} 
                    onPress={() => onSelect(type, item)}
                  >
                    <Text style={[styles.groupButtonText, { color: theme.buttonText }]}>{displayName}</Text>
                    {fav && <Ionicons name="star" size={14} color="#FFD700" style={{ marginLeft: 8 }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: theme.modalBackground === themes.dark.modalBackground ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.modalBackground, maxHeight: '90%' }]}>
          
          <View style={{ flexDirection: 'row', marginBottom: 20, width: '100%', justifyContent: 'center' }}>
            {['student', 'room'].map(t => {
              const labels = { student: 'Étudiants', room: 'Salles' };
              const isActive = tab === t;
              return (
                <TouchableOpacity 
                  key={t} onPress={() => setTab(t)}
                  style={{ 
                    paddingVertical: 8, paddingHorizontal: 12, 
                    borderBottomWidth: isActive ? 3 : 0, borderColor: theme.text, marginHorizontal: 5
                  }}
                >
                  <Text style={{ color: theme.modalText, fontWeight: isActive ? 'bold' : 'normal' }}>
                    {labels[t]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {tab === 'student' && renderStudentTab()}
          {tab === 'room' && renderList(availableRooms, 'room')}

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.modalButton, width: '100%', alignItems: 'center' }]}>
              <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal de sélection du thème
 */
const ThemeSelectionModal = ({ visible, onClose, onBack, onSelectTheme, theme, themePreference }) => {
  
  // Helper pour le rendu d'un bouton de thème
  const renderThemeButton = (label, value, previewColor = null, icon = null) => { // Ajout de previewColor et icon
    const isSelected = themePreference === value;
    return (
      <TouchableOpacity 
        style={[
          styles.menuButton, 
          { 
            backgroundColor: theme.buttonBackground,
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }, 
          isSelected && styles.selectedButton
        ]} 
        onPress={() => onSelectTheme(value)}
      >
        {/* MODIF ICI : Affichage de la pastille de couleur OU de l'icône */}
        {previewColor ? (
          <View style={{ 
            width: 20, 
            height: 20, 
            borderRadius: 10, 
            backgroundColor: previewColor, 
            marginRight: 10,
            borderWidth: 1, // Petite bordure pour la démarquer
            borderColor: theme.borderColor
          }} />
        ) : (
          icon && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={theme.buttonText} 
              style={{ marginRight: 10 }} 
            />
          )
        )}
        
        <Text style={[styles.menuButtonText, { color: theme.buttonText }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: theme.modalBackground === themes.dark.modalBackground ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
        <View style={[
          styles.menuContent, 
          { 
            backgroundColor: theme.modalBackground, 
            width: '85%', 
            maxHeight: '80%' // <--- C'est ici que la magie opère ! (Limite la hauteur)
          }
        ]}>
          
          <Text style={[styles.modalTitle, { color: theme.modalText, marginBottom: 5 }]}>Thèmes 🎨</Text>
          
          {/* Le ScrollView va automatiquement gérer le défilement si ça dépasse */}
          <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={true}>
            
            {/* --- SECTION CLASSIQUE --- */}
            <Text style={{ color: theme.modalText, fontSize: 12, fontWeight: 'bold', opacity: 0.5, marginBottom: 10, marginTop: 15, textTransform: 'uppercase', letterSpacing: 1 }}>
              Classique
            </Text>

            {renderThemeButton('Appareil', 'system', null, 'phone-portrait-outline')}
            {renderThemeButton('Jour', 'light', null, 'sunny-outline')}
            {renderThemeButton('Nuit', 'dark', null, 'moon-outline')}

            {/* --- SECTION PERSONNALISÉ --- */}
            <Text style={{ color: theme.modalText, fontSize: 12, fontWeight: 'bold', opacity: 0.5, marginBottom: 10, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 }}>
              Personnalisé
            </Text>

            {renderThemeButton('Abyss', 'abyss', themes.abyss.modalBackground)}
            {renderThemeButton('Dark Green', 'darkgreen', '#4caf50')} 
            {renderThemeButton('Comfy', 'comfy', '#3e3530')}
            {renderThemeButton('Violet', 'violet', '#201a2b')}
            {renderThemeButton('Dracula', 'dracula', '#bd93f9')}
            {renderThemeButton('Nord', 'nord', '#88c0d0')}
            {renderThemeButton('Solarized', 'solarized', '#b58900')}
            {renderThemeButton('Monokai', 'monokai', '#f92672')}

          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: theme.modalButton }]}>
              <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.modalButton }]}>
              <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal de gestion des Favoris (UI Améliorée)
 */
const FavoritesModal = ({ visible, onClose, onToggleFavorite, onSelectFavorite, isFavorite, favorites, theme }) => {
  
  const studentFavs = favorites.filter(f => f.type === 'student');
  const roomFavs = favorites.filter(f => f.type === 'room');
  const hasAnyFavorite = favorites.length > 0;

  const renderColumn = (title, items) => {
    if (items.length === 0) return null;
    return (
      <View style={{ flex: 1, minWidth: 100, paddingHorizontal: 5 }}>
        <Text style={{ color: theme.modalText, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', textDecorationLine: 'underline' }}>
          {title}
        </Text>
        {items.map((fav, index) => (
          <TouchableOpacity 
            key={index} 
            style={[
              styles.groupButton, 
              { 
                backgroundColor: theme.buttonBackground, 
                width: '100%', 
                paddingVertical: 10, 
                marginBottom: 8,
                // Bordure dorée pour rappeler que c'est un favori
                borderWidth: 1,
                borderColor: '#FFD700' 
              }
            ]}
            onPress={() => onSelectFavorite(fav)}
          >
            <Text style={[styles.groupButtonText, { color: theme.buttonText, fontSize: 12, textAlign: 'center' }]}>
              {fav.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: theme.modalBackground === themes.dark.modalBackground ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.modalBackground, width: '90%', maxHeight: '80%' }]}>
          
          <Text style={[styles.modalTitle, { color: theme.modalText, marginBottom: 15 }]}>Favoris ⭐</Text>

          {/* Bouton d'action principal */}
          <TouchableOpacity 
            style={[
              styles.menuButton, 
              { 
                backgroundColor: theme.buttonBackground, // Fond du thème
                borderColor: isFavorite ? '#ff6b6b' : '#51cf66', // Bordure Rouge ou Verte
                borderWidth: 2,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
              }
            ]} 
            onPress={onToggleFavorite}
          >
            {/* Icône dynamique */}
            <Ionicons 
              name={isFavorite ? "remove-circle-outline" : "add-circle-outline"} 
              size={24} 
              color={isFavorite ? "#ff6b6b" : "#51cf66"} 
              style={{ marginRight: 10 }} 
            />
            <Text style={[styles.menuButtonText, { color: theme.buttonText }]}>
              {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            </Text>
          </TouchableOpacity>

          {/* Barre de séparation */}
          <View style={{ height: 1, width: '100%', backgroundColor: theme.borderColor, marginVertical: 20 }} />

          {/* Listes */}
          {!hasAnyFavorite ? (
            <Text style={{ color: theme.modalText, opacity: 0.6, fontStyle: 'italic', marginVertical: 20 }}>
              Vous n'avez aucun favori pour le moment.
            </Text>
          ) : (
            <ScrollView style={{ width: '100%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                {renderColumn("Étudiants", studentFavs)}
                {renderColumn("Salles", roomFavs)}
              </View>
            </ScrollView>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.modalButton, width: '100%', alignItems: 'center' }]}>
              <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal de personnalisation des couleurs (Refonte UI Moderne)
 */
const CourseColorCustomizationModal = ({ visible, onClose, onBack, events, courseTypeColors, courseNameColors, onSelectColor, theme, coloringMode, onSetColoringMode }) => {
  // --- CONFIGURATION ---
  const allCourseTypes = ['CM', 'TD', 'TP', 'Autre'];
  // Récupération unique et triée des matières
  const allCourseNames = [...new Set(events.map(event => event.courseName))].sort();
  
  // Nouvelle Palette Étendue (24 couleurs)
  const colorPalette = [
    { code: null, name: 'Par défaut' },
    // Rouges / Oranges
    { code: '#ffadad', name: 'Rouge Pastel' }, { code: '#ffd6a5', name: 'Orange Pastel' }, 
    { code: '#fdffb6', name: 'Jaune Pastel' }, { code: '#ffc6ff', name: 'Rose Bonbon' },
    { code: '#ff8fab', name: 'Rose Vif' },     { code: '#e07a5f', name: 'Terre Cuite' },
    // Verts
    { code: '#caffbf', name: 'Vert Lime' },    { code: '#9bf6ff', name: 'Cyan Pastel' },
    { code: '#52b788', name: 'Vert Forêt' },   { code: '#b7e4c7', name: 'Vert Menthe' },
    // Bleus
    { code: '#a0c4ff', name: 'Bleu Ciel' },    { code: '#bdb2ff', name: 'Violet Lavande' },
    { code: '#0077b6', name: 'Bleu Océan' },   { code: '#023e8a', name: 'Bleu Royal' },
    // Sombres / Neutres
    { code: '#343a40', name: 'Gris Anthracite' }, { code: '#6c757d', name: 'Gris Souris' },
    { code: '#cdb4db', name: 'Mauve' },        { code: '#ffc8dd', name: 'Rose Pâle' },
    // Vifs
    { code: '#ff9f1c', name: 'Orange Vif' },   { code: '#2ec4b6', name: 'Turquoise' },
    { code: '#e71d36', name: 'Rouge Vif' },    { code: '#7209b7', name: 'Violet Profond' }
  ];

  // --- ÉTATS ---
  // Item en cours d'édition (ex: 'CM' ou 'AUTO5'). Si null, on affiche la liste.
  const [editingItem, setEditingItem] = useState(null); 

  // --- RENDU : SÉLECTEUR DE COULEUR (GRILLE) ---
  const renderColorPicker = () => (
    <View style={{ flex: 1, width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 10 }}>
        <TouchableOpacity onPress={() => setEditingItem(null)} style={{ padding: 5 }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.modalText, marginLeft: 10 }}>
          Couleur pour "{editingItem}"
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingBottom: 20 }}>
        {colorPalette.map((color, index) => {
          const isSelected = (coloringMode === 'type' ? courseTypeColors[editingItem] : courseNameColors[editingItem]) === color.code;
          return (
            <TouchableOpacity 
              key={index} 
              style={{
                width: '45%', // 2 colonnes
                margin: 5,
                padding: 10,
                borderRadius: 12,
                backgroundColor: theme.buttonBackground,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: isSelected ? 2 : 0,
                borderColor: theme.text,
                overflow: 'hidden' // Empêche le débordement visuel
              }}
              onPress={() => {
                onSelectColor(editingItem, color.code, coloringMode);
                setEditingItem(null); 
              }}
            >
              {/* La pastille de couleur reste fixe */}
              <View style={{ 
                width: 30, height: 30, borderRadius: 15, 
                backgroundColor: color.code || theme.eventBackground,
                borderWidth: 1, borderColor: theme.borderColor, marginRight: 10,
                flexShrink: 0 // Empêche la pastille de s'écraser
              }} />
              
              {/* Le texte prend la place restante et rétrécit si besoin */}
              <Text 
                style={{ 
                  color: theme.buttonText, 
                  fontSize: 12, // Un peu plus petit (c'était 14)
                  fontWeight: '500',
                  flex: 1, // Prend toute la largeur dispo
                  flexWrap: 'wrap' // Permet d'aller à la ligne si vraiment trop long
                }}
                numberOfLines={2} // Limite à 2 lignes max
                adjustsFontSizeToFit={true} // Rétrécit la police si ça ne rentre pas (iOS/Android)
                minimumFontScale={0.8} // Limite du rétrécissement
              >
                {color.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // --- RENDU : LISTE DES MATIÈRES / TYPES ---
  const renderList = () => {
    const data = coloringMode === 'type' ? allCourseTypes : allCourseNames;
    
    return (
      <View style={{ flex: 1, width: '100%' }}>
        {/* Toggle Type / Matière */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, coloringMode === 'type' && styles.toggleButtonActive, { backgroundColor: theme.buttonBackground }]} 
            onPress={() => onSetColoringMode('type')}
          >
            <Text style={[styles.toggleButtonText, { color: theme.buttonText }]}>Par Type</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, coloringMode === 'name' && styles.toggleButtonActive, { backgroundColor: theme.buttonBackground }]} 
            onPress={() => onSetColoringMode('name')}
          >
            <Text style={[styles.toggleButtonText, { color: theme.buttonText }]}>Par Matière</Text>
          </TouchableOpacity>
        </View>

        {/* Liste Scrollable */}
        <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={true}>
          {data.map((item, index) => {
            const currentColor = coloringMode === 'type' ? courseTypeColors[item] : courseNameColors[item];
            return (
              <TouchableOpacity 
                key={index} 
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 15,
                  paddingHorizontal: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.borderColor
                }}
                onPress={() => setEditingItem(item)}
              >
                <Text style={{ fontSize: 16, color: theme.modalText, fontWeight: '500', flex: 1 }}>
                  {item}
                </Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Pastille de prévisualisation */}
                  <View style={{ 
                    width: 24, height: 24, borderRadius: 12, 
                    backgroundColor: currentColor || theme.eventBackground,
                    borderWidth: 1, borderColor: theme.borderColor, marginRight: 10
                  }} />
                  <Ionicons name="chevron-forward" size={20} color={theme.text} style={{ opacity: 0.5 }} />
                </View>
              </TouchableOpacity>
            );
          })}
          {/* Espace vide en bas pour le scroll */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    );
  };
  
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: theme.modalBackground === themes.dark.modalBackground ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.modalBackground, height: '80%', maxHeight: '80%', width: '95%', padding: 20 }]}>
          
          {!editingItem && (
            <Text style={[styles.modalTitle, { color: theme.modalText, marginBottom: 15 }]}>Couleurs des cours 🎨</Text>
          )}

          {editingItem ? renderColorPicker() : renderList()}

          {!editingItem && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: theme.modalButton }]}>
                <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.modalButton }]}>
                <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Fermer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal du menu principal
 */
const MenuModal = ({ visible, onClose, onOpenPersonalization, onForceRefresh, onOpenNotifications, theme, onMenuTitlePress, tapCount, appVersion }) => {
  
  // Fonction pour gérer le clic sur le logo GitHub
  const handleOpenGithub = () => {
    Alert.alert(
      "Projet Open Source",
      "Consulter le dêpot GitHub du projet ?\n(Code source, documentation...)",
      [
        { text: "Non", style: "cancel" },
        { 
          text: "Oui", 
          onPress: () => Linking.openURL('https://github.com/DoodzProg/Mobile-App_BUT-GEII-Tours_EDT-ade?tab=readme-ov-file') 
        }
      ]
    );
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.menuContent, { backgroundColor: theme.modalBackground, position: 'relative' }]}>
          
          {/* --- 1. Logo GITHUB (Aligné en haut à gauche) --- */}
          <TouchableOpacity 
            onPress={handleOpenGithub}
            style={{ 
              position: 'absolute', 
              top: 20, 
              left: 20, 
              zIndex: 10,
              padding: 5
            }}
          >
            <Ionicons name="logo-github" size={32} color={theme.modalText} />
          </TouchableOpacity>

          {/* --- 2. Titre "Menu" (Centré avec Easter Egg Logs) --- */}
          <TouchableOpacity activeOpacity={1} onPress={onMenuTitlePress} style={{ marginTop: 15, marginBottom: 20 }}>
            <Text style={[styles.menuTitle, { color: theme.modalText, marginBottom: 0 }]}>Menu</Text>
          </TouchableOpacity>
          
          {/* Compteur pour l'Easter Egg (Logs) */}
          {tapCount > 0 && tapCount < 5 && (
            <Text style={{ color: theme.modalText, fontSize: 10, textAlign: 'center', marginBottom: 10 }}>
              encore {5 - tapCount}...
            </Text>
          )}

          {/* --- Les Boutons --- */}

          <TouchableOpacity style={[styles.menuButton, { backgroundColor: theme.buttonBackground }]} onPress={onOpenPersonalization}>
            <Text style={[styles.menuButtonText, { color: theme.buttonText }]}>Personnalisation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuButton, { backgroundColor: theme.buttonBackground }]} onPress={onOpenNotifications}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications" size={20} color={theme.buttonText} style={{ marginRight: 10 }} />
              <Text style={[styles.menuButtonText, { color: theme.buttonText }]}>Notifications</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuButton, { backgroundColor: theme.buttonBackground }]} onPress={onForceRefresh}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="refresh" size={20} color={theme.buttonText} style={{ marginRight: 10 }} />
              <Text style={[styles.menuButtonText, { color: theme.buttonText }]}>Actualiser le planning</Text>
            </View>
          </TouchableOpacity>

          <View style={{ marginTop: 20, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: theme.modalText, opacity: 0.5, fontSize: 12 }}>{appVersion}</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.modalButton }]}>
              <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

/**
 * Modal de réglage des notifications (Version Toggle Switch)
 */
const NotificationSettingsModal = ({ visible, onClose, onBack, theme, notificationsEnabled, setNotificationsEnabled, notificationDelay, setNotificationDelay, onSave }) => {
  
  const hours = Array.from({ length: 25 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Composant interne pour le Scroll de temps
  const TimeColumn = ({ data, selected, onSelect, suffix }) => (
    <ScrollView 
      style={{ height: 150, width: 80, backgroundColor: theme.buttonBackground, borderRadius: 8, marginHorizontal: 5 }}
      contentContainerStyle={{ paddingVertical: 60 }}
      showsVerticalScrollIndicator={false}
      snapToInterval={40}
      decelerationRate="fast"
    >
      {data.map((item) => {
        const isSelected = item === selected;
        return (
          <TouchableOpacity 
            key={item} 
            style={{ height: 40, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => onSelect(item)}
          >
            <Text style={{ color: theme.modalText, fontSize: 18, fontWeight: isSelected ? 'bold' : 'normal', opacity: isSelected ? 1 : 0.3 }}>
              {item < 10 ? `0${item}` : item} {suffix}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: theme.modalBackground === themes.dark.modalBackground ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.menuContent, { backgroundColor: theme.modalBackground, width: '90%' }]}>
          
          <Text style={[styles.modalTitle, { color: theme.modalText, marginBottom: 30 }]}>Paramètres Notifications</Text>

          {/* --- ZONE TOGGLE --- */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            width: '100%', 
            paddingHorizontal: 10,
            marginBottom: notificationsEnabled ? 30 : 10 // Plus d'espace si ouvert
          }}>
            <Text style={{ color: theme.modalText, fontSize: 16, fontWeight: '600' }}>
              État des notifications :
            </Text>

            {/* LE BOUTON SWITCH CUSTOM */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
              style={{
                width: 60,
                height: 34,
                borderRadius: 20,
                backgroundColor: notificationsEnabled ? '#4caf50' : theme.borderColor, // Vert si ON, Gris si OFF
                padding: 4,
                justifyContent: 'center',
                alignItems: notificationsEnabled ? 'flex-end' : 'flex-start', // Bouge le cercle
                borderWidth: 1,
                borderColor: theme.borderColor
              }}
            >
              {/* Le cercle (Thumb) */}
              <View style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: '#fff',
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 2,
              }} />
            </TouchableOpacity>
          </View>

          {/* --- ZONE SÉLECTEUR DE TEMPS (Conditionnelle) --- */}
          {notificationsEnabled && (
            <View style={{ alignItems: 'center', marginBottom: 20, width: '100%' }}>
              {/* Ligne de séparation subtile */}
              <View style={{ height: 1, width: '80%', backgroundColor: theme.borderColor, marginBottom: 20 }} />

              <Text style={{ color: theme.modalText, marginBottom: 15, fontStyle: 'italic', opacity: 0.8 }}>
                M'alerter avant le cours :
              </Text>
              
              <View style={{ flexDirection: 'row', height: 150, alignItems: 'center' }}>
                <TimeColumn 
                  data={hours} 
                  selected={notificationDelay.hours} 
                  onSelect={(h) => setNotificationDelay(prev => ({ ...prev, hours: h }))} 
                  suffix="h"
                />
                <Text style={{ color: theme.modalText, fontSize: 20, fontWeight: 'bold', marginHorizontal: 5 }}>:</Text>
                <TimeColumn 
                  data={minutes} 
                  selected={notificationDelay.minutes} 
                  onSelect={(m) => setNotificationDelay(prev => ({ ...prev, minutes: m }))} 
                  suffix="m"
                />
              </View>

              <Text style={{ color: '#4caf50', marginTop: 15, fontSize: 13, fontWeight: '500' }}>
                Rappel configuré : {notificationDelay.hours}h {notificationDelay.minutes}m avant
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
             <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: theme.modalButton }]}>
              <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} style={[styles.closeButton, { backgroundColor: theme.buttonBackground, borderWidth: 1, borderColor: '#4caf50' }]}>
              <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Enregistrer</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal du sous-menu personnalisation
 */
const PersonalizationMenuModal = ({ visible, onClose, onBack, onOpenThemeSelector, onOpenCourseColorCustomization, onOpenViewSelector, theme }) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: theme.modalBackground === themes.dark.modalBackground ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.menuContent, { backgroundColor: theme.modalBackground }]}>
          <Text style={[styles.menuTitle, { color: theme.modalText }]}>Personnalisation</Text>
          
          <TouchableOpacity style={[styles.menuButton, { backgroundColor: theme.buttonBackground }]} onPress={onOpenThemeSelector}>
            <Text style={[styles.menuButtonText, { color: theme.buttonText }]}>Thèmes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuButton, { backgroundColor: theme.buttonBackground }]} onPress={onOpenCourseColorCustomization}>
            <Text style={[styles.menuButtonText, { color: theme.buttonText }]}>Couleurs des cours</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuButton, { backgroundColor: theme.buttonBackground }]} onPress={onOpenViewSelector}>
            <Text style={[styles.menuButtonText, { color: theme.buttonText }]}>Type d'affichage</Text>
          </TouchableOpacity>
          
          {/* Le bouton Notifications a été retiré d'ici */}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: theme.modalButton }]}>
              <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.modalButton }]}>
              <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal de sélection du type d'affichage
 */
const ViewSelectionModal = ({ visible, onClose, onBack, onToggleView, viewMode, theme }) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: theme.modalBackground === themes.dark.modalBackground ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.menuContent, { backgroundColor: theme.modalBackground }]}>
          <Text style={[styles.menuTitle, { color: theme.modalText }]}>Choisissez l'affichage</Text>
          
          <TouchableOpacity 
            style={[styles.menuButton, viewMode === 'week' && styles.selectedButton, { backgroundColor: theme.buttonBackground }]} 
            onPress={() => onToggleView('week')}
          >
            <Text style={[styles.menuButtonText, { color: theme.buttonText }]}>Semaine (5j)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, viewMode === 'fullweek' && styles.selectedButton, { backgroundColor: theme.buttonBackground }]} 
            onPress={() => onToggleView('fullweek')}
          >
            <Text style={[styles.menuButtonText, { color: theme.buttonText }]}>Semaine & Week-end (7j)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, viewMode === 'day' && styles.selectedButton, { backgroundColor: theme.buttonBackground }]} 
            onPress={() => onToggleView('day')}
          >
            <Text style={[styles.menuButtonText, { color: theme.buttonText }]}>Jour</Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: theme.modalButton }]}>
              <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.modalButton }]}>
              <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal de détails d'un événement (Version Finale avec boxText)
 */
const EventDetailsModal = ({ visible, onClose, onBack, event, theme }) => {
  if (!event) return null;
  
  const padZero = (num) => num < 10 ? `0${num}` : num;
  const startTime = `${padZero(event.start.getHours())}:${padZero(event.start.getMinutes())}`;
  const endTime = `${padZero(event.end.getHours())}:${padZero(event.end.getMinutes())}`;

  // Fonction pour nettoyer le nom de la salle
  const formatLocation = (location) => {
    if (!location) return "";
    return location.split(',').map(part => {
      const room = part.trim();
      const upperRoom = room.toUpperCase();
      
      if (upperRoom.includes('GR W AMPHI')) {
        return "Amphi Geii (W)";
      }
      
      return room
        .replace(/^GR\s*W\s*/i, '')
        .replace(/^GR\s*/i, '');
    }).join(', ');
  };

  const displayLocation = formatLocation(event.location);

  // Organise les groupes
  const organizeGroups = (rawGroups) => {
    const columns = { 'BUT1': [], 'BUT2': [], 'BUT3': [] };
    
    rawGroups.forEach(g => {
      const groupUpper = g.toUpperCase();
      
      if (groupUpper.includes('BUT2')) {
        columns['BUT2'].push(g.replace(/^BUT2A_/i, '').replace(/^BUT2_/i, ''));
      } else if (groupUpper.includes('BUT3')) {
        columns['BUT3'].push(g.replace(/^BUT3A_/i, '').replace(/^BUT3_/i, ''));
      } else {
        let cleanName = g;
        if (g.includes('BUT1')) {
           const match = g.match(/_([A-D][1-2])/);
           if (match) cleanName = match[1];
        }
        columns['BUT1'].push(cleanName);
      }
    });

    const activeColumns = [];
    ['BUT1', 'BUT2', 'BUT3'].forEach(year => {
      if (columns[year].length > 0) {
        columns[year].sort();
        activeColumns.push({ title: year, data: columns[year] });
      }
    });

    return activeColumns;
  };

  const activeGroups = organizeGroups(event.groups);

  // Rendu d'une ligne d'information "Box"
  const renderInfoBox = (icon, label, value) => (
    <View style={{ 
      backgroundColor: theme.borderColor, 
      borderRadius: 12, 
      padding: 12, 
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center'
    }}>
      {/* MODIF: Utilisation de boxText pour l'icône */}
      <Ionicons name={icon} size={24} color={theme.boxText || theme.text} style={{ opacity: 0.7, marginRight: 15 }} />
      <View style={{ flex: 1 }}>
        {/* MODIF: Utilisation de boxText pour le label */}
        <Text style={{ color: theme.boxText || theme.modalText, fontSize: 11, textTransform: 'uppercase', opacity: 0.7, marginBottom: 2, fontWeight: 'bold' }}>
          {label}
        </Text>
        {/* MODIF: Utilisation de boxText pour la valeur */}
        <Text style={{ color: theme.boxText || theme.modalText, fontSize: 15, fontWeight: '500' }}>
          {value || "Non spécifié"}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: theme.modalBackground === themes.dark.modalBackground ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.detailsModalContent, { backgroundColor: theme.modalBackground, maxHeight: '90%', width: '90%', padding: 0 }]}>
          
          {/* En-tête */}
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: theme.borderColor, alignItems: 'center', width: '100%' }}>
            <Text style={[styles.detailsModalTitle, { color: theme.modalText, marginBottom: 5 }]}>Détails du cours</Text>
            {(() => {
              const fullDate = event.start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
              const formattedDate = fullDate.charAt(0).toUpperCase() + fullDate.slice(1);
              return (
                <Text style={{ color: theme.modalText, opacity: 0.7, fontStyle: 'italic' }}>
                  {formattedDate} • {event.start.getFullYear()}
                </Text>
              );
            })()}
          </View>

          <ScrollView style={{ width: '100%', padding: 20 }}>
            
            {/* Infos Principales */}
            {renderInfoBox("school-outline", "Matière", event.title)}
            {renderInfoBox("time-outline", "Horaires", `${startTime} - ${endTime}`)}
            {renderInfoBox("location-outline", "Salle", displayLocation)}
            {renderInfoBox("person-outline", "Enseignant", event.teacher)}

            {/* Groupes Dynamiques */}
            {activeGroups.length > 0 && (
              <View style={{ marginTop: 10, marginBottom: 20 }}>
                <Text style={{ color: theme.modalText, fontSize: 11, textTransform: 'uppercase', opacity: 0.5, marginBottom: 10, fontWeight: 'bold', marginLeft: 5 }}>
                  Groupes concernés
                </Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {activeGroups.map((col, index) => (
                    <View key={col.title} style={{ 
                      flex: 1, 
                      backgroundColor: theme.borderColor, 
                      borderRadius: 8, 
                      padding: 12, 
                      marginRight: index < activeGroups.length - 1 ? 8 : 0 
                    }}>
                      {/* C'EST ICI QUE TU MODIFIES LE TITRE DE COLONNE */}
                      <Text style={{ color: theme.boxText || theme.modalText, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, opacity: 0.9, borderBottomWidth: 1, borderBottomColor: theme.eventBorder, paddingBottom: 5 }}>
                        {col.title}
                      </Text>
                      
                      <View style={{ alignItems: 'center' }}>
                        {col.data.map((g, i) => (
                          // C'EST ICI QUE TU MODIFIES LA LISTE DES GROUPES
                          <Text key={i} style={{ color: theme.boxText || theme.modalText, fontSize: 14, marginBottom: 4, fontWeight: '500' }}>
                            {g}
                          </Text>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Time Log */}
            {event.timeLog && (
              <Text style={{ textAlign: 'center', color: theme.modalText, opacity: 0.3, fontSize: 10, fontStyle: 'italic', marginBottom: 10 }}>
                {event.timeLog}
              </Text>
            )}

          </ScrollView>

          {/* Footer */}
          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: theme.borderColor, width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: theme.modalButton, flex: 1, marginRight: 10, alignItems: 'center' }]}>
              <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.modalButton, flex: 1, marginLeft: 10, alignItems: 'center' }]}>
              <Text style={[styles.closeButtonText, { color: theme.modalText }]}>Fermer</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};



/**
 * Modal de visualisation des logs
 */
const LogsViewerModal = ({ visible, onClose, theme }) => {
  const [logs, setLogs] = useState('Chargement des logs...');

  useEffect(() => {
    if (visible) {
      loadLogs();
    }
  }, [visible]);

  const loadLogs = async () => {
    const logContent = await getLogs();
    setLogs(logContent);
  };

  const handleClearLogs = async () => {
    Alert.alert(
      "Effacer les logs",
      "Voulez-vous vraiment supprimer tous les logs ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Effacer", 
          style: "destructive",
          onPress: async () => {
            await clearLogs();
            setLogs('Logs effacés.');
          }
        }
      ]
    );
  };

  const handleCopyLogs = async () => {
    await Clipboard.setStringAsync(logs);
    Alert.alert("Copié", "Les logs ont été copiés dans le presse-papier.");
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
        <View style={[styles.logsModalContent, { backgroundColor: '#fff' }]}>
          <Text style={[styles.modalTitle, { color: '#000' }]}>Logs de l'application 🥡</Text>
          
          <ScrollView style={styles.logsScrollView}>
            <Text style={[styles.logsText, { color: '#000' }]}>{logs}</Text>
          </ScrollView>

          <View style={styles.logsButtonRow}>
            <TouchableOpacity onPress={handleCopyLogs} style={[styles.logsActionButton, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="copy-outline" size={20} color="#fff" />
              <Text style={styles.logsButtonText}>Copier</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={loadLogs} style={[styles.logsActionButton, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
              <Text style={styles.logsButtonText}>Actualiser</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleClearLogs} style={[styles.logsActionButton, { backgroundColor: '#F44336' }]}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.logsButtonText}>Effacer</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: '#ddd' }]}>
              <Text style={[styles.closeButtonText, { color: '#000' }]}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ===============================================================================================
// COMPOSANT PRINCIPAL
// ===============================================================================================

export function MainApp() {
  // --- ÉTATS ---
  
  const [calendarHeight, setCalendarHeight] = useState(0);

  /** Tous les événements du calendrier global */
  const [allEvents, setAllEvents] = useState([]);
  
  /** Listes extraites pour les menus */
  const [availableRooms, setAvailableRooms] = useState([]);

  /** Type de sélection active : 'student', 'teacher', 'room' */
  const [selectionType, setSelectionType] = useState('student');

  /** Critères de sélection actuels */
  const [currentSelection, setCurrentSelection] = useState({ year: 'BUT3', group: 'AII1' }); // Par défaut
  // Si teacher : currentSelection sera une string "NOM DU PROF"
  // Si room : currentSelection sera une string "SALLE"

  /** Événements filtrés à afficher */
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalCalendarLoaded, setGlobalCalendarLoaded] = useState(false);

  // ... États de navigation (inchangés)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [currentDayOffset, setCurrentDayOffset] = useState(0);
  const [viewMode, setViewMode] = useState('week');
  const [groupHasLoaded, setGroupHasLoaded] = useState(false);
  
  // ... Thèmes et Couleurs (inchangés)
  const systemTheme = useColorScheme();
  const [themePreference, setThemePreference] = useState('system');
  const [courseTypeColors, setCourseTypeColors] = useState({});
  const [courseNameColors, setCourseNameColors] = useState({});
  const [coloringMode, setColoringMode] = useState('type');

  // ... Modales (inchangés sauf groupModalVisible qu'on va renommer mentalement en selectionModal)
  const [selectionModalVisible, setSelectionModalVisible] = useState(false); // Anciennement groupModalVisible
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [personalizationModalVisible, setPersonalizationModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [courseColorModalVisible, setCourseColorModalVisible] = useState(false);
  const [viewSelectionModalVisible, setViewSelectionModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [favoritesModalVisible, setFavoritesModalVisible] = useState(false);
  const [favorites, setFavorites] = useState([]);

  // --- AJOUTER CES LIGNES QUI MANQUENT ---
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  // Par défaut : 15 minutes avant
  const [notificationDelay, setNotificationDelay] = useState({ hours: 0, minutes: 15 });
  // ----------------------------------------


  // Easter egg (inchangé)
  const [menuTapCount, setMenuTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState(null);
  
  const activeTheme = themePreference === 'system' ? systemTheme : themePreference;
  const theme = themes[activeTheme] || themes.light;
  const insets = useSafeAreaInsets();

  // Re-planifier si les événements changent ET que les notifs sont actives
  useEffect(() => {
    if (globalCalendarLoaded && notificationsEnabled) {
      scheduleNotificationsForEvents();
    }
  }, [filteredEvents, globalCalendarLoaded]); 

  // --- EFFETS ---

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        await clearLogs();
      }
    });
    return () => subscription.remove();
  }, []);

  // Chargement des préférences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@theme_preference');
        if (savedTheme) setThemePreference(savedTheme);

        const savedColoringMode = await AsyncStorage.getItem('@coloring_mode');
        if (savedColoringMode) setColoringMode(savedColoringMode);

        // Chargement de la dernière sélection
        const savedType = await AsyncStorage.getItem('@selection_type');
        const savedValue = await AsyncStorage.getItem('@selection_value');
        
        if (savedType && savedValue) {
          setSelectionType(savedType);
          setCurrentSelection(JSON.parse(savedValue));
        }
        // Legacy : si on a d'anciens paramètres mais pas les nouveaux
        else {
            const savedYear = await AsyncStorage.getItem('@selected_year');
            const savedGroup = await AsyncStorage.getItem('@selected_group');
            if (savedYear && savedGroup) {
                setSelectionType('student');
                setCurrentSelection({ year: savedYear, group: savedGroup });
            }
        }

        const savedFavorites = await AsyncStorage.getItem('@favorites');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }

        // Chargement notifs
        const savedNotifEnabled = await AsyncStorage.getItem('@notif_enabled');
        if (savedNotifEnabled) setNotificationsEnabled(JSON.parse(savedNotifEnabled));
        
        const savedNotifDelay = await AsyncStorage.getItem('@notif_delay');
        if (savedNotifDelay) setNotificationDelay(JSON.parse(savedNotifDelay));
        
      } catch (e) {
        console.error('Erreur chargement préférences:', e);
      } finally {
        setGroupHasLoaded(true);
      }
    };
    loadPreferences();
  }, []);

  // Chargement du Calendrier
  useEffect(() => {
    if (!groupHasLoaded) return;

    const loadGlobalCalendar = async () => {
      setLoading(true);
      console.log("🔥 Chargement du calendrier GLOBAL...");

      let eventsToProcess = [];

      try {
        const cachedEvents = await AsyncStorage.getItem('@parsed_global_events');
        if (cachedEvents) {
          const parsed = JSON.parse(cachedEvents);
          eventsToProcess = parsed.map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
          }));
          console.log(`✅ Cache trouvé : ${parsed.length} événements`);
        }
      } catch (e) { console.log("Pas de cache"); }

      if (eventsToProcess.length === 0) {
        const result = await genCalendar();
        if (result.url) {
          try {
            const events = await parseGlobalICS(result.url);
            eventsToProcess = events.map(event => ({
              ...event,
              start: new Date(event.start),
              end: new Date(event.end)
            }));
            await AsyncStorage.setItem('@parsed_global_events', JSON.stringify(events));
          } catch (error) {
            Alert.alert("Erreur", "Erreur lecture calendrier.");
          }
        }
      }

      if (eventsToProcess.length > 0) {
        setAllEvents(eventsToProcess);

        // Extraction Intelligente des Salles (NOUVEAU)
        const roomSet = new Set();
        eventsToProcess.forEach(e => {
          if (e.location) {
            // On sépare les salles s'il y a des virgules
            const splitRooms = e.location.split(','); 
            splitRooms.forEach(r => {
              const cleanRoom = r.trim();
              if (cleanRoom.length > 0 && cleanRoom !== 'Salle inconnue') {
                roomSet.add(cleanRoom);
              }
            });
          }
        });
        const sortedRooms = Array.from(roomSet).sort();
        setAvailableRooms(sortedRooms);

        setGlobalCalendarLoaded(true);
      }
      
      setLoading(false);
    };

    loadGlobalCalendar();
  }, [groupHasLoaded]);

  // Filtrage automatique quand la sélection ou les données changent
  useEffect(() => {
    if (!globalCalendarLoaded || allEvents.length === 0) return;

    console.log(`🔍 Filtrage : ${selectionType}`, currentSelection);
    const filtered = filterGlobalEvents(allEvents, selectionType, currentSelection);
    setFilteredEvents(filtered);
  }, [selectionType, currentSelection, allEvents, globalCalendarLoaded]);

  // --- GESTIONNAIRES D'ÉVÉNEMENTS ---

  /**
   * Gestion de la sélection (Étudiant, Prof, Salle)
   */
  const handleUniversalSelection = async (type, value) => {
    try {
      setSelectionType(type);
      setCurrentSelection(value);
      
      // Sauvegarde persistant
      await AsyncStorage.setItem('@selection_type', type);
      await AsyncStorage.setItem('@selection_value', JSON.stringify(value));
      
      setSelectionModalVisible(false);
      setCurrentWeekOffset(0); // Reset navigation
      setCurrentDayOffset(0);
    } catch (e) {
      console.error('Erreur sauvegarde sélection:', e);
    }
  };

  /**
   * Gestion du changement de thème
   */
  const handleSelectTheme = async (preference) => {
    try {
      await AsyncStorage.setItem('@theme_preference', preference);
      setThemePreference(preference);
    } catch (e) {
      console.error('Erreur sauvegarde thème:', e);
    }
  };

  /**
   * Gestion de la personnalisation des couleurs
   */
  const handleSelectCourseColor = async (item, color, type) => {
    if (type === 'type') {
      setCourseTypeColors(prev => {
        const newColors = { ...prev, [item]: color };
        AsyncStorage.setItem('@course_type_colors', JSON.stringify(newColors));
        return newColors;
      });
    } else {
      setCourseNameColors(prev => {
        const newColors = { ...prev, [item]: color };
        AsyncStorage.setItem('@course_name_colors', JSON.stringify(newColors));
        return newColors;
      });
    }
  };

  /**
   * Gestion du mode de coloration
   */
  const handleSetColoringMode = async (mode) => {
    try {
      await AsyncStorage.setItem('@coloring_mode', mode);
      setColoringMode(mode);
    } catch (e) {
      console.error('Erreur sauvegarde mode couleur:', e);
    }
  };

  /**
   * Gestion du changement de vue
   */
  const handleToggleView = async (mode) => {
    try {
      await AsyncStorage.setItem('@view_mode', mode);
      setViewMode(mode);
      if (mode === 'week' || mode === 'fullweek') setCurrentDayOffset(0);
      else setCurrentWeekOffset(0);
    } catch (e) {
      console.error('Erreur sauvegarde mode affichage:', e);
    }
  };

  /**
   * Vérifie si la sélection actuelle est un favori
   */
  const isCurrentSelectionFavorite = () => {
    return favorites.some(fav => 
      fav.type === selectionType && 
      JSON.stringify(fav.value) === JSON.stringify(currentSelection)
    );
  };

  /**
   * Ajoute ou retire la sélection actuelle des favoris
   */
  const handleToggleFavorite = async () => {
    let newFavorites;
    
    if (isCurrentSelectionFavorite()) {
      // Retirer
      newFavorites = favorites.filter(fav => 
        !(fav.type === selectionType && JSON.stringify(fav.value) === JSON.stringify(currentSelection))
      );
    } else {
      // Ajouter
      let label = '';
      if (selectionType === 'student') label = `${currentSelection.year} ${currentSelection.group}`;
      else label = currentSelection; // Prof ou Salle

      const newFav = {
        type: selectionType,
        value: currentSelection,
        label: label
      };
      newFavorites = [...favorites, newFav];
    }

    setFavorites(newFavorites);
    await AsyncStorage.setItem('@favorites', JSON.stringify(newFavorites));
  };

  /**
   * Charge un favori
   */
  const handleSelectFavorite = (fav) => {
    handleUniversalSelection(fav.type, fav.value);
    setFavoritesModalVisible(false);
  };

  /**
   * Forcer le rafraîchissement du calendrier
   * Supprime tous les caches et régénère l'URL
   */
  const handleForceRefresh = async () => {
    Alert.alert(
      "Actualiser le planning",
      "Voulez-vous forcer la mise à jour de l'emploi du temps global ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Actualiser",
          onPress: async () => {
            setMenuModalVisible(false);
            setLoading(true);
            
            // Supprimer TOUS les caches
            await AsyncStorage.removeItem('@global_calendar_cache');
            await AsyncStorage.removeItem('@parsed_global_events');
            console.log('🗑️ Cache global supprimé');
            
            // Forcer régénération
            const result = await genCalendar();
            
            if (result.url) {
              const events = await parseGlobalICS(result.url);
              setAllEvents(events);
              
              // Sauvegarder nouveau cache
              await AsyncStorage.setItem('@parsed_global_events', JSON.stringify(events));
              
              Alert.alert("✅ Succès", "Planning global actualisé !");
            } else {
              Alert.alert("❌ Erreur", "Impossible de régénérer l'emploi du temps.");
            }
            
            setLoading(false);
          }
        }
      ]
    );
  };

  /**
   * Easter egg : tap 6 fois sur "Menu" pour voir les logs
   */
  const handleMenuTitlePress = () => {
    if (tapTimeout) {
      clearTimeout(tapTimeout);
    }

    const newCount = menuTapCount + 1;
    setMenuTapCount(newCount);

    if (newCount >= 6) {
      setMenuModalVisible(false);
      setLogsModalVisible(true);
      setMenuTapCount(0);
    } else {
      const timeout = setTimeout(() => {
        setMenuTapCount(0);
      }, 2000);
      setTapTimeout(timeout);
    }
  };

  // --- RENDU ---

  /**
   * Demande la permission pour les notifications
   */
  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Permission de notification refusée !');
        return false;
      }
      return true;
    }
    return false;
  };

  /**
   * Planifie les notifications pour tous les cours futurs
   */
  const scheduleNotificationsForEvents = async () => {
    // 1. On annule tout pour repartir propre
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!notificationsEnabled) return;

    const hasPermission = await registerForPushNotificationsAsync();
    if (!hasPermission) return;

    const delayInMinutes = (notificationDelay.hours * 60) + notificationDelay.minutes;
    const now = new Date();
    let count = 0;

    // On parcourt les événements affichés (filteredEvents)
    for (const event of filteredEvents) {
      const triggerDate = new Date(event.start);
      // On retire le délai (ex: 8h00 - 15min = 7h45)
      triggerDate.setMinutes(triggerDate.getMinutes() - delayInMinutes);

      // Si la date de notif est dans le futur
      if (triggerDate > now) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Cours dans ${notificationDelay.hours > 0 ? notificationDelay.hours + 'h' : ''}${notificationDelay.minutes}m 🎓`,
              body: `${event.title} en salle ${event.location || '?'}`,
              sound: true,
            },
            trigger: triggerDate,
          });
          count++;
          // Limite Android/iOS : On ne planifie pas 500 notifs, juste les 50 prochaines par sécurité
          if (count >= 50) break; 
        } catch (e) {
          console.error("Erreur planif notif", e);
        }
      }
    }
    console.log(`🔔 ${count} notifications planifiées`);
  };

  /**
   * Sauvegarde et Application des réglages
   */
  const handleSaveNotifications = async () => {
    await AsyncStorage.setItem('@notif_enabled', JSON.stringify(notificationsEnabled));
    await AsyncStorage.setItem('@notif_delay', JSON.stringify(notificationDelay));
    
    setNotificationModalVisible(false);
    
    // On lance la replanification
    scheduleNotificationsForEvents();
    alert(notificationsEnabled ? "Rappels activés ! 🔔" : "Rappels désactivés.");
  };

  /**
   * Simule une notification immédiate pour tester
   */
  const handleTestNotification = async () => {
    const hasPermission = await registerForPushNotificationsAsync();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 Test de notification",
        body: "Ceci est une simulation ! Si tu vois ça, c'est que tout fonctionne. 🎉",
        sound: true,
      },
      trigger: { seconds: 2 }, // Se déclenche dans 2 secondes
    });

    alert("Simulation lancée ! Regarde ta barre d'état dans 2 secondes.");
  };

  /**
   * Écran de chargement
   */
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Chargement du calendrier global...
        </Text>
        <Text style={{ color: theme.text, opacity: 0.7, textAlign: 'center', paddingHorizontal: 20 }}>
          Cela peut prendre quelques secondes la première fois
        </Text>
      </View>
    );
  }

  // Calculs de dates pour l'affichage
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() || 7) + 1 + (currentWeekOffset * 7));
  
  const daysToShow = viewMode === 'fullweek' ? 7 : 5;
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + (daysToShow - 1));

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  startOfDay.setDate(startOfDay.getDate() + currentDayOffset);
  
  // Filtrage des événements à afficher
  const eventsToDisplay = filteredEvents.filter(event => {
    const eventDate = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate());
    if (viewMode === 'day') {
      return eventDate.toDateString() === startOfDay.toDateString();
    } else {
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    }
  });

  // Regroupement des événements par jour
  const groupedEvents = eventsToDisplay.reduce((acc, event) => {
    const day = event.start.getDay();
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});
  
  /**
   * Affiche les détails d'un événement
   */
  const showEventDetails = (event) => {
    setSelectedEvent(event);
    setDetailsModalVisible(true);
  };
  
  /**
   * Retourne la couleur d'un événement selon les préférences
   */
  const getEventColor = (event) => {
    if (coloringMode === 'type' && courseTypeColors[event.courseType]) {
      return courseTypeColors[event.courseType];
    }
    if (coloringMode === 'name' && courseNameColors[event.courseName]) {
      return courseNameColors[event.courseName];
    }
    return theme.eventBackground;
  };
  
  const padZero = (num) => num < 10 ? `0${num}` : num;
  const currentDay = now.getDay();
  const currentDayIndex = currentDay === 0 ? 7 : currentDay;
  const isCurrentWeek = currentWeekOffset === 0;

  /**
   * Rendu du calendrier principal (Version Responsive 19h)
   */
  const renderCalendar = () => {
    // --- DÉBUT SWIPE ---
    // Variables locales pour stocker la position du doigt
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.nativeEvent.pageX;
      touchStartY = e.nativeEvent.pageY;
    };

    const handleTouchEnd = (e) => {
      const touchEndX = e.nativeEvent.pageX;
      const touchEndY = e.nativeEvent.pageY;

      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;

      // On vérifie que le mouvement est bien horizontal (plus de X que de Y)
      // et qu'il est assez long (> 50 pixels) pour éviter les faux positifs
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          // Swipe vers la GAUCHE -> Suivant
          if (viewMode === 'day') setCurrentDayOffset(prev => prev + 1);
          else setCurrentWeekOffset(prev => prev + 1);
        } else {
          // Swipe vers la DROITE -> Précédent
          if (viewMode === 'day') setCurrentDayOffset(prev => prev - 1);
          else setCurrentWeekOffset(prev => prev - 1);
        }
      }
    };
    // --- FIN  SWIPE (Partie 1) ---

    let weekdays, headerStartDate;
    
    // Configuration horaire
    const startHour = 8;
    const endHour = 19; // <--- MODIF 1 : Fin à 19h
    const totalHours = endHour - startHour;
    
    // Calcul dynamique de la hauteur d'une heure (si la hauteur du conteneur est connue)
    // On divise la hauteur totale disponible par le nombre d'heures
    const dynamicHourHeight = calendarHeight > 0 ? calendarHeight / totalHours : 50; // 50 par défaut
    const dynamicMinuteMultiplier = dynamicHourHeight / 60;


    // Calcul de la position de la ligne rouge
    const getCurrentTimePosition = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      
      // Si on est avant 8h ou après 19h, on n'affiche rien
      if (currentHour < startHour || currentHour >= endHour) return null;

      const minutesSinceStart = (currentHour - startHour) * 60 + currentMinutes;
      return minutesSinceStart * dynamicMinuteMultiplier;
    };

    const currentTimeTop = getCurrentTimePosition();
    
    // Vérifie si "Aujourd'hui" est visible à l'écran
    // (Si on est en mode semaine et offset 0, OU si on est en mode jour et que c'est la date d'ajd)
    const isNowVisible = (viewMode === 'day') 
      ? startOfDay.toDateString() === new Date().toDateString()
      : currentWeekOffset === 0;

    const hours = Array.from({ length: totalHours }, (_, i) => startHour + i);
    
    if (viewMode === 'day') {
      weekdays = [daysOfWeekShort[startOfDay.getDay() === 0 ? 6 : startOfDay.getDay() - 1]];
      headerStartDate = startOfDay;
    } else if (viewMode === 'fullweek') {
      weekdays = daysOfWeekShort;
      headerStartDate = startOfWeek;
    } else {
      weekdays = daysOfWeekShort.slice(0, 5);
      headerStartDate = startOfWeek;
    }

    return (
      <View style={[styles.mainContent, { paddingBottom: 10 }]} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {/* Barre de navigation semaine/jour */}
        <View style={[styles.weekNavigator, { backgroundColor: theme.topBar, borderColor: theme.borderColor }]}>
          <TouchableOpacity onPress={() => viewMode === 'day' ? setCurrentDayOffset(prev => prev - 1) : setCurrentWeekOffset(prev => prev - 1)}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.weekText, { color: theme.text }]}>
            {viewMode === 'day' ? 
              `${weekdays[0]} ${startOfDay.toLocaleDateString()}` :
              `Semaine n°${getWeekNumber(startOfWeek)} | ${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`
            }
          </Text>
          <TouchableOpacity onPress={() => viewMode === 'day' ? setCurrentDayOffset(prev => prev + 1) : setCurrentWeekOffset(prev => prev + 1)}>
            <Ionicons name="arrow-forward" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* En-têtes des jours */}
        <View style={[styles.dayHeadersContainer, { borderColor: theme.borderColor }]}>
          <View style={[styles.timeAxisSpacer, { backgroundColor: theme.headerBackground }]} />
          {weekdays.map((dayName, index) => {
            const dayDate = new Date(headerStartDate);
            dayDate.setDate(headerStartDate.getDate() + (viewMode === 'day' ? 0 : index));
            const formattedDate = `${padZero(dayDate.getDate())}/${padZero(dayDate.getMonth() + 1)}`;
            const dayIndex = dayDate.getDay() === 0 ? 7 : dayDate.getDay();
            const isToday = viewMode !== 'day' && isCurrentWeek && dayIndex === currentDayIndex;
            
            return (
              <View key={index} style={[styles.dayHeader, { flex: 1, backgroundColor: theme.headerBackground }, isToday && { backgroundColor: theme.todayHeaderBackground, borderRadius: 8 }]}>
                <Text style={[styles.dayNameText, { color: theme.headerText }, isToday && { color: theme.todayHeaderText }]}>{dayName}</Text>
                <Text style={[styles.dayDateText, { color: theme.headerText === themes.dark.headerText ? '#fff' : '#555' }, isToday && { color: theme.todayHeaderText }, viewMode === 'fullweek' && { fontSize: 8 }]}>{formattedDate}</Text>
              </View>
            );
          })}
        </View>
        
        {/* Calendrier avec événements */}
        <View 
          style={styles.calendarContainer} 
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setCalendarHeight(height);
          }}
        >
          {/* --- AJOUTER CE BLOC ICI (DÉBUT) --- */}
          {/* Grille de fond (Lignes horizontales) */}
          <View style={styles.gridBackground}>
            {hours.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.gridLine, 
                  { 
                    top: index * dynamicHourHeight, 
                    height: dynamicHourHeight,
                    borderColor: theme.borderColor 
                  }
                ]} 
              />
            ))}
          </View>

          {/* Axe des heures */}
          <View style={[styles.timeAxis, { borderColor: theme.borderColor }]}>
            {hours.map(hour => (
              <View key={hour} style={[styles.hourSlot, { height: dynamicHourHeight, borderColor: theme.borderColor }]}>
                <Text style={[styles.hourText, { color: '#888' }]}>{`${hour}h`}</Text>
              </View>
            ))}
            
            <Text style={[styles.hourText, { color: '#888', position: 'absolute', bottom: 2, right: 2 }]}>{endHour}h</Text>

            {/* --- NOUVEAU : LIGNE ROUGE (Uniquement dans cette colonne) --- */}
            {isNowVisible && currentTimeTop !== null && (
              <View style={{
                position: 'absolute',
                top: currentTimeTop,
                width: '100%', // Prend toute la largeur de la colonne (25px)
                borderTopWidth: 2,
                borderColor: 'red',
                zIndex: 99, // Au-dessus du reste
              }}>
                {/* Petit point rouge pour faire joli sur le bord */}
                <View style={{
                  position: 'absolute',
                  right: -3, // Déborde un tout petit peu vers le planning
                  top: -4,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'red',
                }}/>
              </View>
            )}
          </View>
          
          {/* Message si aucun événement */}
          {filteredEvents.length === 0 ? (
            <View style={styles.noEventsContainer}>
              <Text style={[styles.noEventsText, { color: theme.text }]}>Aucun événement trouvé pour ce groupe.</Text>
              <Text style={[styles.noEventsTextSmall, { color: theme.text }]}>Vérifiez votre sélection.</Text>
            </View>
          ) : (
            // Colonnes des jours avec événements
            weekdays.map((dayName, index) => {
              const dayDate = new Date(headerStartDate);
              dayDate.setDate(headerStartDate.getDate() + (viewMode === 'day' ? 0 : index));
              const dayIndex = dayDate.getDay();
              
              // Détection du jour actuel (uniquement si on n'est pas en vue "Jour")
              const isToday = viewMode !== 'day' && dayDate.toDateString() === new Date().toDateString();
              
              return (
                <View 
                  key={index} 
                  style={[
                    styles.dayColumn, 
                    { 
                      flex: 1, 
                      borderColor: theme.borderColor, 
                      height: '100%',
                      // --- MODIFICATIONS DE STYLE ICI ---
                      backgroundColor: isToday ? theme.todayHeaderBackground + '50' : 'transparent',
                      // Augmente les bordures sur les côtés pour bien délimiter la colonne
                      borderLeftWidth: isToday ? 2 : 0,
                      borderRightWidth: isToday ? 2 : 1, 
                      // La couleur de la bordure est celle du thème (orange/vert/etc.)
                      borderColor: isToday ? theme.todayHeaderBackground : theme.borderColor,
                      // Petit arrondi en bas pour faire propre
                      borderBottomLeftRadius: isToday ? 8 : 0,
                      borderBottomRightRadius: isToday ? 8 : 0,
                    }
                  ]}
                >
                  {groupedEvents[dayIndex]?.map((event, eventIndex) => {
                    const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
                    const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
                    
                    // Calcul des positions basé sur la hauteur dynamique
                    const startOffset = (startMinutes - startHour * 60) * dynamicMinuteMultiplier;
                    const duration = (endMinutes - startMinutes) * dynamicMinuteMultiplier;
                    
                    const eventBgColor = getEventColor(event);
                    const eventTextColor = getContrastColor(eventBgColor);
                    
                    const eventStyle = {
                      top: startOffset, height: duration, backgroundColor: eventBgColor,
                      borderColor: theme.eventBorder,
                    };
                    
                    return (
                      <TouchableOpacity key={eventIndex} style={[styles.event, eventStyle]} onPress={() => showEventDetails(event)}>
                        {/* Titre en GRAS et plus gros */}
                        <Text style={[styles.eventTitle, { color: eventTextColor }]} numberOfLines={1}>
                          {event.title}
                        </Text>
                        
                        {/* Salle et Type en plus petit */}
                        <Text style={[styles.eventLocation, { color: eventTextColor, opacity: 0.8 }]}>
                          {event.location}
                        </Text>

                        {/* Heure en tout petit, discret */}
                        <Text style={[styles.eventTime, { color: eventTextColor, opacity: 0.7, fontSize: 8, marginTop: 2 }]}>
                          {padZero(event.start.getHours())}:{padZero(event.start.getMinutes())} - {padZero(event.end.getHours())}:{padZero(event.end.getMinutes())}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>
      </View>
    );
  };

  // --- RENDU PRINCIPAL ---
  // MODIF IMPORTANTE : On remplace ScrollView par View ici pour que le flex:1 fonctionne
  return (
    <>
      <StatusBar barStyle={
        (activeTheme === 'dark' || activeTheme === 'abyss' || activeTheme === 'darkgreen' || activeTheme === 'comfy' || activeTheme === 'violet' || activeTheme === 'dracula' || activeTheme === 'nord' || activeTheme === 'monokai') 
        ? 'light-content' : 'dark-content'
      } />
      <View style={[styles.appContainer, { backgroundColor: theme.background }]}>
        {/* Barre supérieure */}
        <View style={[styles.topBar, { backgroundColor: theme.topBar, borderColor: theme.borderColor, paddingTop: insets.top + 15 }]}>
          {/* Bouton Menu Burger */}
          <TouchableOpacity 
            onPress={() => setMenuModalVisible(true)} 
            style={{ 
              padding: 8, 
              borderRadius: 12, 
              // MODIF : Utilise toujours la couleur de bouton du thème actif
              // Cela marchera pour Light, Abyss, Solarized, etc.
              backgroundColor: theme.buttonBackground 
            }}
          >
            <Ionicons name="menu" size={28} color={theme.buttonText || theme.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setSelectionModalVisible(true)} 
            style={[
              styles.selectGroupButton, 
              { 
                // MODIF : On utilise directement la couleur du thème !
                backgroundColor: theme.buttonBackground, 
                width: 'auto', 
                minWidth: 150, 
                maxWidth: 220,
                marginHorizontal: 10
              }
            ]}
          >
            <Text style={[styles.groupTitle, { color: theme.text, fontSize: 16 }]} numberOfLines={1}>
              {selectionType === 'student' ? `${currentSelection.year} ${currentSelection.group}` : currentSelection}
            </Text>
            <Ionicons name="caret-down-outline" size={18} color={theme.text} style={styles.dropdownIcon} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setFavoritesModalVisible(true)} style={{ padding: 5 }}>
            <Ionicons 
              name={isCurrentSelectionFavorite() ? "star" : "star-outline"} 
              size={28} 
              color={isCurrentSelectionFavorite() ? "#FFD700" : theme.text}
            />
          </TouchableOpacity>
        </View>

        {/* Le calendrier va maintenant prendre toute la place restante */}
        {renderCalendar()}
        
        {/* ... (Tes modales ici, pas de changement, copie-les juste) ... */}
        <MenuModal 
          visible={menuModalVisible} 
          onClose={() => { setMenuModalVisible(false); setMenuTapCount(0); }}
          onOpenPersonalization={() => { setMenuModalVisible(false); setPersonalizationModalVisible(true); setMenuTapCount(0); }}
          onOpenNotifications={() => { setMenuModalVisible(false); setNotificationModalVisible(true); }}
          onForceRefresh={handleForceRefresh}
          theme={theme}
          onMenuTitlePress={handleMenuTitlePress}
          tapCount={menuTapCount}
          appVersion={APP_VERSION}
        />
        <PersonalizationMenuModal visible={personalizationModalVisible} onClose={() => setPersonalizationModalVisible(false)} onBack={() => { setPersonalizationModalVisible(false); setMenuModalVisible(true); }} onOpenThemeSelector={() => { setPersonalizationModalVisible(false); setThemeModalVisible(true); }} onOpenCourseColorCustomization={() => { setPersonalizationModalVisible(false); setCourseColorModalVisible(true); }} onOpenViewSelector={() => { setPersonalizationModalVisible(false); setViewSelectionModalVisible(true); }} theme={theme}/>
        <ViewSelectionModal visible={viewSelectionModalVisible} onClose={() => setViewSelectionModalVisible(false)} onBack={() => { setViewSelectionModalVisible(false); setPersonalizationModalVisible(true); }} onToggleView={handleToggleView} viewMode={viewMode} theme={theme} />
        <ThemeSelectionModal visible={themeModalVisible} onClose={() => setThemeModalVisible(false)} onBack={() => { setThemeModalVisible(false); setPersonalizationModalVisible(true); }} onSelectTheme={handleSelectTheme} theme={theme} themePreference={themePreference} />
        <CourseColorCustomizationModal visible={courseColorModalVisible} onClose={() => setCourseColorModalVisible(false)} onBack={() => { setCourseColorModalVisible(false); setPersonalizationModalVisible(true); }} events={filteredEvents} courseTypeColors={courseTypeColors} courseNameColors={courseNameColors} onSelectColor={handleSelectCourseColor} theme={theme} coloringMode={coloringMode} onSetColoringMode={handleSetColoringMode} />
        <UniversalSelectionModal visible={selectionModalVisible} onClose={() => setSelectionModalVisible(false)} onSelect={handleUniversalSelection} theme={theme} availableRooms={availableRooms} favorites={favorites} allEvents={allEvents} />
        <FavoritesModal visible={favoritesModalVisible} onClose={() => setFavoritesModalVisible(false)} onToggleFavorite={handleToggleFavorite} onSelectFavorite={handleSelectFavorite} isFavorite={isCurrentSelectionFavorite()} favorites={favorites} theme={theme} />
        <EventDetailsModal visible={detailsModalVisible} onClose={() => setDetailsModalVisible(false)} onBack={() => setDetailsModalVisible(false)} event={selectedEvent} theme={theme} />
        <LogsViewerModal visible={logsModalVisible} onClose={() => setLogsModalVisible(false)} theme={theme} />
        <NotificationSettingsModal visible={notificationModalVisible} onClose={() => setNotificationModalVisible(false)} onBack={() => { setNotificationModalVisible(false); setMenuModalVisible(true); }} theme={theme} notificationsEnabled={notificationsEnabled} setNotificationsEnabled={setNotificationsEnabled} notificationDelay={notificationDelay} setNotificationDelay={setNotificationDelay} onSave={handleSaveNotifications} />
      </View>
    </>
  );
}

// ===============================================================================================
// STYLES
// ===============================================================================================

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15, 
    paddingTop: 15,        
    paddingBottom: 5,      
    borderBottomWidth: 1,
  },
  selectGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 3,
    borderWidth: 0,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 5,
  },
  dropdownIcon: {
    marginLeft: 5,
  },
  weekNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
  },
  weekText: {
    fontWeight: 'bold',
  },
  dayHeadersContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  timeAxisSpacer: {
    width: 25,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayNameText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  dayDateText: {
    fontSize: 10,
  },
  calendarContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  timeAxis: {
    width: 25,
    borderRightWidth: 1,
  },
  hourSlot: {
    justifyContent: 'flex-start',
    paddingTop: 5,
    borderBottomWidth: 1,
    width: '100%',
  },
  halfHourSlot: {
    height: 30,
    justifyContent: 'flex-start',
    paddingTop: 5,
  },
  hourText: {
    fontSize: 10,
    textAlign: 'right',
  },
  dayColumn: {
    flex: 1,
    borderRightWidth: 1,
    position: 'relative',
    height: '100%',
    backgroundColor: 'transparent', 
  },
  event: {
    position: 'absolute',
    left: 2, 
    right: 2, 
    padding: 2,
    borderRadius: 5, 
    borderWidth: 1,
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 10, 
  },
  eventTime: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    width: '95%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  detailsModalContent: {
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
    alignItems: 'flex-start',
    maxHeight: '85%'
  },
  detailsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'center',
  },
  detailsModalSubtitle: {
    fontSize: 14,
  },
  detailsScrollView: {
    width: '100%',
    flexShrink: 1, 
    marginBottom: 15, 
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  githubLogo: {
    padding: 5,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  easterEggHint: {
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  gridBackground: {
    position: 'absolute',
    top: 0,
    left: 25,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  gridLine: {
    width: '100%',
    borderBottomWidth: 0.3,
    position: 'absolute',
    left: 0,
  },
  versionText: {
    fontSize: 12,
    alignSelf: 'center',
  },
  menuContent: {
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  groupTable: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  groupColumn: {
    flex: 1,
    alignItems: 'center',
  },
  groupYearTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  groupButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginBottom: 5,
    width: '90%',
    alignItems: 'center',
  },
  groupButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  closeButton: {
    padding: 10,
    borderRadius: 5,
  },
  backButton: {
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noEventsText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noEventsTextSmall: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  detailsTable: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: {
    fontWeight: 'bold',
    marginRight: 10,
    minWidth: 80,
  },
  detailValue: {
    flexShrink: 1,
  },
  italicText: {
    fontStyle: 'italic',
  },
  selectedButton: {
    borderWidth: 2,
    borderColor: '#66a3ff',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  toggleButtonActive: {
    borderWidth: 2,
    borderColor: '#66a3ff',
  },
  toggleButtonText: {
    fontWeight: 'bold',
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  colorItemText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  colorItemTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  colorPreview: {
    width: 20, 
    height: 20,
    borderRadius: 10, 
    borderWidth: 1,
    borderColor: '#ccc', 
    marginRight: 4,
  },
  dropdownContainer: {
    position: 'relative',
    width: 76,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  dropdownButtonText: {
    flex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%', 
    left: -80, 
    right: 0,
    borderRadius: 5, 
    borderWidth: 1,
    zIndex: 1000, 
    marginTop: 5,
    maxHeight: 200,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  dropdownColor: {
    width: 15, 
    height: 15,
    borderRadius: 7.5,
    marginRight: 10,
  },
  dropdownText: {
    flex: 1,
  },
  logsModalContent: {
    padding: 20,
    borderRadius: 10,
    width: '95%',
    height: '80%',
    alignItems: 'center',
  },
  logsScrollView: {
    width: '100%',
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  logsText: {
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  logsButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  logsActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    justifyContent: 'center',
  },
  logsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

/**
 * Composant racine de l'application avec SafeAreaProvider
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}