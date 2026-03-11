// Importation des modules nécessaires
const express = require('express'); // Utilise Express pour créer le serveur web
const http = require('http'); // Utilise le module HTTP natif de Node.js
const { Server } = require('socket.io'); // Importe Socket.io pour la communication temps réel
const path = require('path'); // Gère les chemins de fichiers de manière sécurisée

const app = express(); // Initialise l'application Express
const server = http.createServer(app); // Crée le serveur HTTP en utilisant l'app Express
const io = new Server(server, { cors: { origin: "*" } }); // Active Socket.io avec autorisation pour tous

// Configuration des fichiers statiques
app.use(express.static(path.join(__dirname, '../client'))); // Sert le dossier client (index.html)

// Paramètres du jeu Gold Pixel
const TAILLE = 512; // Définit la taille de la grille à 512x512
const memoirePixels = new Uint8Array(TAILLE * TAILLE * 3).fill(255); // Crée une grille vide (blanche) en mémoire

// Gestion des connexions joueurs
io.on('connection', (socket) => { // S'exécute quand un nouveau joueur se connecte
    console.log('Un défenseur rejoint la Forteresse !'); // Log de connexion pour le suivi
    socket.emit('init_canvas', Array.from(memoirePixels)); // Envoie la grille actuelle au nouveau joueur

    // Gestion de la pose de pixel
    socket.on('claim_pixel', (donnees) => { // Ecoute l'événement de pose de pixel
        const { x, y, color } = donnees; // Récupère les coordonnées et la couleur RVB
        if (x >= 0 && x < TAILLE && y >= 0 && y < TAILLE) { // Vérifie que le clic est dans les limites
            const index = (y * TAILLE + x) * 3; // Calcule l'emplacement exact dans le tableau mémoire
            memoirePixels[index] = color[0]; // Enregistre la valeur Rouge
            memoirePixels[index + 1] = color[1]; // Enregistre la valeur Vert
            memoirePixels[index + 2] = color[2]; // Enregistre la valeur Bleu
            io.emit('pixel_update', { x, y, color }); // Diffuse le nouveau pixel à tous les joueurs en direct
        }
    });
});

// Lancement du serveur
const PORT = process.env.PORT || 10000; // Utilise le port assigné par Render (souvent 10000)
server.listen(PORT, () => { // Démarre l'écoute du serveur
    console.log(`Le serveur de Gold Pixel tourne sur le port ${PORT}`); // Message de succès final
});
