// On appelle les outils pour créer le serveur temps réel
const express = require('express');
const http = require('http');
const { Server } = require('socket.io'); // Socket.io permet le multijoueur
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Autorise ton index.html à parler au serveur sans blocage
});

// Sert les fichiers du dossier client (ton index.html)
app.use(express.static(path.join(__dirname, '../client')));

// CONFIGURATION DE LA GRILLE (512x512 pixels)
const TAILLE = 512;
// Mémoire vive : stocke les couleurs (RVB) de chaque pixel
const memoirePixels = new Uint8Array(TAILLE * TAILLE * 3).fill(20); 

io.on('connection', (socket) => {
  console.log('Un joueur rejoint Gold Pixel !');

  // Envoi de la grille complète au nouveau joueur qui se connecte
  socket.emit('init_canvas', Array.from(memoirePixels));

  // Quand un joueur pose un pixel (clic sur le canevas)
  socket.on('claim_pixel', (donnees) => {
    const { x, y, color } = donnees;

    // Vérification de sécurité pour ne pas sortir de la grille
    if (x >= 0 && x < TAILLE && y >= 0 && y < TAILLE) {
      
      // Calcul de la position exacte dans la mémoire du serveur
      const index = (y * TAILLE + x) * 3;
      memoirePixels[index] = color[0];     // Composante Rouge
      memoirePixels[index + 1] = color[1]; // Composante Verte
      memoirePixels[index + 2] = color[2]; // Composante Bleue

      // DIFFUSION : On renvoie le pixel mis à jour à TOUS les joueurs connectés
      io.emit('pixel_update', { x, y, color });
    }
  });
});

// Le serveur écoute sur le port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`La Forteresse Gold Pixel est prête sur le port ${PORT}`);
});
