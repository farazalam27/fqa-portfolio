#!/bin/bash

# Update Chat Context
# This script helps manage context files for the chatbot

echo "📝 Chat Context Manager"
echo "====================="

CONTEXT_DIR="../chat_context"

# Function to display menu
show_menu() {
    echo ""
    echo "What would you like to update?"
    echo "1) Resume (PDF)"
    echo "2) Anime Recommendations"
    echo "3) One Piece Theories"
    echo "4) Add Spotify Recommendations"
    echo "5) View current context files"
    echo "6) Exit"
}

# Function to open file in default editor
edit_file() {
    if command -v code &> /dev/null; then
        code "$1"
    elif command -v nano &> /dev/null; then
        nano "$1"
    else
        vi "$1"
    fi
}

while true; do
    show_menu
    read -p "Enter your choice (1-6): " choice

    case $choice in
        1)
            echo "Place your resume PDF in: $CONTEXT_DIR/resume/"
            echo "Name it: faraz_resume.pdf"
            open "$CONTEXT_DIR/resume/" 2>/dev/null || echo "Please manually navigate to the folder"
            ;;
        2)
            edit_file "$CONTEXT_DIR/personal/anime_recommendations.json"
            ;;
        3)
            edit_file "$CONTEXT_DIR/personal/one_piece_theories.md"
            ;;
        4)
            if [ ! -f "$CONTEXT_DIR/personal/spotify_recommendations.json" ]; then
                echo '{"playlists": [], "favorite_artists": [], "genres": []}' > "$CONTEXT_DIR/personal/spotify_recommendations.json"
            fi
            edit_file "$CONTEXT_DIR/personal/spotify_recommendations.json"
            ;;
        5)
            echo "Current context files:"
            find "$CONTEXT_DIR" -type f -name "*.json" -o -name "*.md" -o -name "*.pdf" | sort
            ;;
        6)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            ;;
    esac
done