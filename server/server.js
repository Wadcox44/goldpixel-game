const express = require('express'); // On appelle Express pour créer le portail de jeu
const http = require('http'); // On utilise le protocole HTTP pour le transfert
const { Server } = require('socket.io'); // On active Socket.io pour le multijoueur en direct
const path = require('path'); // Module pour gérer les chemins de fichiers sans erreur

const app = express(); // Initialisation de l'application
const server = http.createServer(app); // Création du serveur physique (La Forteresse)
const io = new Server(server, { 
    cors: { origin: "*" } // Autorise ton portail JeuxVideo.Pi à se connecter au jeu
});

// Indique au serveur que les fichiers visuels (index.html) sont dans le dossier "client"
app.use(express.static(path.join(__dirname, '../client')));

const TAILLE = 512; // Taille de la grille (512x512 pixels)
const memoirePixels = new Uint8Array(TAILLE * TAILLE * 3).fill(255); // Grille blanche au départ

io.on('connection', (socket) => { // Dès qu'un joueur se connecte au serveur Render
    console.log('Un joueur rejoint la Forteresse !');

    // On lui envoie la grille actuelle dès sa connexion
    socket.emit('init_canvas', Array.from(memoirePixels));

    // Quand le serveur reçoit un clic d'un joueur pour poser un pixel
    socket.on('claim_pixel', (donnees) => {
        const { x, y, color } = donnees; // Récupère X, Y et la couleur
        if (x >= 0 && x < TAILLE && y >= 0 && y < TAILLE) { // Vérifie qu'on est dans la grille
            const index = (y * TAILLE + x) * 3;
            memoirePixels[index] = color[0]; // Stockage Rouge
            memoirePixels[index + 1] = color[1]; // Stockage Vert
            memoirePixels[index + 2] = color[2]; // Stockage Bleu
            
            // LA SENTINELLE : On diffuse le pixel à TOUT LE MONDE immédiatement
            io.emit('pixel_update', { x, y, color });
        }
    });
});

// Port dynamique pour Render ou 3000 par défaut
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Le serveur de Gold Pixel tourne sur le port ${PORT}`);
});
