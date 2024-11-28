$(function(){
    const socket = io();
    let autoScroll = true; // Variable pour suivre l'état du défilement automatique

    // Fonction pour générer un pseudo aléatoire
    function generatePseudo() {
        const adjectives = ["Rapide", "Cool", "Drôle", "Fou", "Sérieux", "Lumineux"];
        const nouns = ["Tigre", "Aigle", "Renard", "Panda", "Loup", "Dauphin"];
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${randomAdjective}${randomNoun}${Math.floor(Math.random() * 100)}`;
    }

    // Fonction pour lire/écrire un cookie
    function getOrCreatePseudo() {
        const cookieMatch = document.cookie.match(/pseudo=([^;]+)/);
        if (cookieMatch) {
            return cookieMatch[1];
        } else {
            const newPseudo = generatePseudo();
            document.cookie = `pseudo=${newPseudo}; path=/; max-age=31536000`; // Cookie pour 1 an
            return newPseudo;
        }
    }

    // Fonction pour faire défiler la barre vers le bas
    function scrollToBottom() {
        if (autoScroll) {
            const messagesDiv = $("#messages");
            messagesDiv.scrollTop(messagesDiv.prop("scrollHeight"));
        }
    }

    // Fonction pour limiter les messages affichés
    function limitMessages(maxMessages) {
        const messages = $("#messages p");
        if (messages.length > maxMessages) {
            messages.first().remove(); // Supprimer le message le plus ancien
        }
    }

    // Récupération ou création du pseudo
    const pseudo = getOrCreatePseudo();
    $("#pseudo").text(`Pseudo : ${pseudo}`);

    // Envoyer le pseudo au serveur lors de la connexion
    socket.emit('set pseudo', pseudo);

    // Charger et afficher les messages précédents
    socket.on('load messages', function(messages){
        messages.forEach(function(msg){
            const messageParts = msg.split(": "); // Décomposer pour obtenir le pseudo et le texte
            if (messageParts[0] === pseudo) {
                $("#messages").append($("<p>").addClass("own").text(`Vous : ${messageParts[1]}`));
            } else {
                $("#messages").append($("<p>").text(`${messageParts[0]} : ${messageParts[1]}`));
            }
        });
        scrollToBottom(); // Dérouler automatiquement au chargement des messages
    });

    // Envoi des messages
    $('form').submit(function(e){
        e.preventDefault();

        const message = $("#msg").val();
        if (message.trim()) {
            socket.emit("chat message", { pseudo, text: message });
            $("#msg").val("");
        }
        return false;
    });

    // Réception et affichage des messages
    socket.on("chat message", function(messageData){
        if (messageData.pseudo === pseudo) {
            $("#messages").append($("<p>").addClass("own").text(`Vous : ${messageData.text}`));
        } else {
            $("#messages").append($("<p>").text(`${messageData.pseudo} : ${messageData.text}`));
        }
        limitMessages(50); // Limiter à 50 messages
        scrollToBottom();  // Scroller vers le bas si autoScroll est activé
    });

    // Gérer l'événement du bouton de défilement automatique
    $("#toggleScroll").click(function() {
        autoScroll = !autoScroll; // Inverser l'état du défilement automatique
        $(this).text(autoScroll ? "Désactiver le défilement automatique" : "Activer le défilement automatique");
    });

    // Afficher les utilisateurs connectés
    socket.on('connected users', function(message){
        console.log('Utilisateurs connectés :', message); // Log pour voir si les utilisateurs sont envoyés
        $('#users').text(`Utilisateurs connectés: ${message.count} - ${message.users.join(', ')}`);
    });

});
