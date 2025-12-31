#!/bin/bash

# Photo Slideshow - Docker wrapper script
# Usage: ./run.sh [start|stop|restart|logs|status|build]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

CONTAINER_NAME="photo-slideshow"

# Read port from settings.json
PORT=$(grep -oP '"port"\s*:\s*\K\d+' settings.json)
if [ -z "$PORT" ]; then
  PORT=3000
fi

case "$1" in
  start)
    echo "Starting Photo Slideshow..."
    docker compose up -d
    echo ""
    echo "Slideshow started! Open http://localhost:$PORT in your browser"
    echo "Press 'F' for fullscreen mode"
    ;;
    
  stop)
    echo "Stopping Photo Slideshow..."
    docker compose down
    echo "Slideshow stopped."
    ;;
    
  restart)
    echo "Restarting Photo Slideshow..."
    docker compose restart
    echo "Slideshow restarted! Open http://localhost:$PORT"
    ;;
    
  logs)
    docker compose logs -f
    ;;
    
  status)
    echo "Container status:"
    docker compose ps
    ;;
    
  build)
    echo "Building Photo Slideshow..."
    docker compose build --no-cache
    echo "Build complete."
    ;;
    
  *)
    echo "Photo Slideshow - Docker Control Script"
    echo ""
    echo "Usage: $0 {start|stop|restart|logs|status|build}"
    echo ""
    echo "Commands:"
    echo "  start   - Build and start the slideshow"
    echo "  stop    - Stop the slideshow"
    echo "  restart - Restart the slideshow"
    echo "  logs    - View container logs"
    echo "  status  - Show container status"
    echo "  build   - Rebuild the container without starting"
    echo ""
    echo "Configuration: Edit settings.json to change:"
    echo "  - gridColumns/gridRows: Number of panels in the grid"
    echo "  - minDuration/maxDuration: Time range for image changes (seconds)"
    echo "  - transitionDuration: Crossfade animation duration (seconds)"
    echo "  - port: Server port (default 3000)"
    echo ""
    echo "Photos: Place your photos and videos in the 'photos/' folder"
    exit 1
    ;;
esac
