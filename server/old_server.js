// On appelle les outils pour créer le serveur
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Autorise ton index.html à parler au serveur
});

// CONFIGURATION DE LA GRILLE
const TAILLE = 512;
// On crée une mémoire pour stocker les couleurs des pixels (3 chiffres par pixel : Rouge, Vert, Bleu)
const memoirePixels = new Uint8Array(TAILLE * TAILLE * 3).fill(20); 

io.on('connection', (socket) => {
  console.log('Un joueur vient de se connecter !');

  // On envoie toute la grille actuelle au nouveau joueur
  socket.emit('init_canvas', Array.from(memoirePixels));

  // Quand le serveur reçoit un message "claim_pixel" depuis un index.html
  socket.on('claim_pixel', (donnees) => {
    const { x, y, color } = donnees;

    // On vérifie que le clic est bien dans la grille
    if (x >= 0 && x < TAILLE && y >= 0 && y < TAILLE) {
      
      // On enregistre la couleur dans la mémoire du serveur
      const index = (y * TAILLE + x) * 3;
      memoirePixels[index] = color[0];     // Rouge
      memoirePixels[index + 1] = color[1]; // Vert
      memoirePixels[index + 2] = color[2]; // Bleu

      // LA SENTINELLE : On renvoie le pixel à TOUT LE MONDE immédiatement
      io.emit('pixel_update', { x, y, color });
    }
  });
});

// Le serveur écoute sur la porte 3000
server.listen(3000, () => {
  console.log('La Forteresse est prête sur http://localhost:3000');
});
