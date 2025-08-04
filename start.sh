#!/bin/bash
# Script de démarrage pour Kaspa Ecosystem

echo "🚀 Démarrage de Kaspa Ecosystem"

# Menu de sélection
PS3='Que voulez-vous faire ? '
options=("Lancer le Backend" "Ouvrir le Frontend" "Voir les logs" "Arrêter le Backend" "Quitter")
select opt in "${options[@]}"
do
    case $opt in
        "Lancer le Backend")
            cd backend
            echo "Démarrage du backend..."
            npm start
            break
            ;;
        "Ouvrir le Frontend")
            cd frontend
            echo "Ouverture du frontend..."
            if command -v python3 &> /dev/null; then
                python3 -m http.server 8000
            else
                echo "Ouvrez index.html dans votre navigateur"
            fi
            break
            ;;
        "Voir les logs")
            cd backend
            if [ -f logs/out.log ]; then
                tail -f logs/out.log
            else
                echo "Aucun log trouvé. Lancez d'abord le backend."
            fi
            break
            ;;
        "Arrêter le Backend")
            cd backend
            pkill -f "node kaspa-backend.js"
            echo "Backend arrêté"
            break
            ;;
        "Quitter")
            break
            ;;
        *) echo "Option invalide $REPLY";;
    esac
done
