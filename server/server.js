const WebSocket = require('ws'); // Importe la bibliothèque pour la communication temps réel
const http = require('http'); // Importe le module HTTP pour créer le serveur de base
const fs = require('fs'); // Importe le module de système de fichiers pour sauvegarder les données

const PORT = 3000; // Définit le port de communication du serveur
const server = http.createServer(); // Crée le serveur HTTP
const wss = new WebSocket.Server({ server }); // Initialise le serveur WebSocket sur le serveur HTTP

const CANVAS_WIDTH = 3200; // Largeur du champ de bataille Gold Pixel
const CANVAS_HEIGHT = 1800; // Hauteur du champ de bataille
const canvasData = new Uint32Array(CANVAS_WIDTH * CANVAS_HEIGHT); // Stocke les couleurs des pixels en mémoire vive (4 octets par pixel)
const ownerData = new Map(); // Associe chaque coordonnée X,Y au pseudo du dernier soldat
const protectionData = new Map(); // Stocke le timestamp de pose pour la protection de 30 secondes

// Charge les données sauvegardées au démarrage pour éviter le reset après un crash
if (fs.existsSync('canvas_save.bin')) {
    const buffer = fs.readFileSync('canvas_save.bin'); // Lit le fichier binaire de sauvegarde
    for (let i = 0; i < canvasData.length; i++) canvasData[i] = buffer.readUInt32LE(i * 4); // Restaure les pixels
}

// Fonction de sauvegarde automatique toutes les 5 minutes
setInterval(() => {
    fs.writeFileSync('canvas_save.bin', Buffer.from(canvasData.buffer)); // Écrit le canvas sur le disque
    console.log("💾 Grand Nettoyage préparé : Sauvegarde auto effectuée."); // Log de passionné
}, 300000);

wss.on('connection', (ws) => { // S'exécute quand un nouveau soldat se connecte
    console.log("🎖 Nouveau soldat au rapport !"); // Log de connexion

    // Envoie l'état actuel du canvas au nouveau joueur (Bulk transfert)
    ws.send(JSON.stringify({ type: 'bulk', data: Array.from(canvasData) }));

    ws.on('message', (message) => { // Reçoit une action du client
        const msg = JSON.parse(message); // Décode le format JSON

        if (msg.type === 'pixel') { // Si le joueur pose un pixel
            const { x, y, color, owner } = msg; // Extrait les données de la pose
            const index = y * CANVAS_WIDTH + x; // Calcule la position linéaire
            const now = Date.now(); // Temps actuel

            // Vérification de la protection "Bouclier" de 30 secondes
            const lastTime = protectionData.get(index) || 0;
            if (now - lastTime < 30000 && ownerData.get(index) !== owner) {
                return; // Bloque la pose si le pixel est encore invulnérable
            }

            canvasData[index] = parseInt(color.replace('#', '0x'), 16); // Enregistre la couleur en hexa
            ownerData.set(index, owner); // Met à jour le propriétaire
            protectionData.set(index, now); // Réinitialise le délai de protection

            // Diffuse la pose à tous les autres joueurs connectés
            const broadcastMsg = JSON.stringify({ type: 'pixel', x, y, color, owner });
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) client.send(broadcastMsg);
            });
        }

        if (msg.type === 'purchase') { // Log des achats Boutique (Dômes, Chargers)
            console.log(`💰 Achat confirmé : ${msg.item} par ${msg.uid}`);
            // Ici, on pourrait ajouter une vérification de transaction Pi côté serveur
        }
    });
});

server.listen(PORT, () => { // Démarre officiellement le serveur
    console.log(`🚀 Gold Pixel Engine opérationnel sur le port ${PORT}`);
});
