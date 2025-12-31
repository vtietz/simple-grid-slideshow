# Photo Slideshow

A Node.js grid-based photo and video slideshow with smooth crossfade transitions.

## Features

- **Grid Layout**: Configurable grid of panels (default 3x2)
- **Random Transitions**: Each panel changes at random intervals
- **Smooth Crossfade**: Images blend smoothly into each other
- **Video Support**: Plays MP4, WebM, OGG, and MOV videos
- **Date Display**: Shows month and year from EXIF data or filename
- **Fullscreen Mode**: Press 'F' or click the button for fullscreen
- **Docker-based**: Easy deployment with Docker

## Supported Formats

**Images**: JPG, JPEG, PNG, GIF, WebP, BMP  
**Videos**: MP4, WebM, OGG, MOV

## Quick Start

1. Place your photos and videos in the `photos/` folder
2. Run the slideshow:
   ```bash
   ./run.sh start
   ```
3. Open http://localhost:3000 in your browser
4. Press 'F' for fullscreen mode

## Commands

```bash
./run.sh start    # Build and start the slideshow
./run.sh stop     # Stop the slideshow
./run.sh restart  # Restart the slideshow
./run.sh logs     # View container logs
./run.sh status   # Show container status
./run.sh build    # Rebuild without starting
```

## Configuration

Edit `settings.json` to customize:

```json
{
  "photosPath": "./photos",
  "gridColumns": 3,
  "gridRows": 4,
  "minDuration": 5,
  "maxDuration": 15,
  "transitionDuration": 1.5,
  "port": 3003,
  "language": "de",
  "password": ""
}
```

| Setting | Description | Default |
|---------|-------------|---------|
| `photosPath` | Path to photos folder | `./photos` |
| `gridColumns` | Number of columns in grid | `3` |
| `gridRows` | Number of rows in grid | `2` |
| `minDuration` | Minimum seconds before image change | `5` |
| `maxDuration` | Maximum seconds before image change | `15` |
| `transitionDuration` | Crossfade animation duration (seconds) | `1.5` |
| `port` | Server port | `3000` |
| `language` | Month names language: `en`, `de`, `es`, `fr`, `it` | `en` |
| `password` | Optional password protection (empty = disabled) | `""` |

## Password Protection

To enable password protection, set a password in `settings.json`:

```json
{
  "password": "your-secret-password"
}
```

When enabled:
- A login screen will appear before the slideshow
- Session is stored in browser localStorage
- To disable, set `"password": ""` or remove the setting

## Date Extraction

The slideshow displays the month and year for each photo/video in the bottom-right corner. Dates are extracted from:

1. **EXIF metadata** (for images) - DateTimeOriginal or CreateDate
2. **Filename patterns** - Supports formats like:
   - `2023-05-15_photo.jpg`
   - `IMG_20230515_123456.jpg`
   - `photo_15-05-2023.jpg`
3. **File modification date** - Used as fallback

## Requirements

- Docker
- Docker Compose
- Node.js (optional, for local development with VS Code IntelliSense)

## Development Setup

For VS Code IntelliSense and code completion, install dependencies locally:

```bash
npm install
```

This creates a local `node_modules` folder that VS Code can use for autocomplete. The Docker container uses its own isolated `node_modules`.

Note: `node_modules` and `package-lock.json` are excluded from git via `.gitignore`.

## Mounting Remote Photos via SSH (Synology NAS)

If your photos are stored on a remote server like a Synology NAS, you can mount them via SSH/SSHFS:

### Prerequisites

1. **Install SSHFS** on your slideshow host machine (not the NAS):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install sshfs
   
   # Fedora/RHEL
   sudo dnf install fuse-sshfs
   
   # macOS (using Homebrew)
   brew install macfuse sshfs
   ```

2. **Enable SSH** on your Synology NAS:
   - Control Panel → Terminal & SNMP → Enable SSH service
   - Set a port (default: 22)

### Set up SSH Key Authentication

SSH keys allow passwordless, secure connections. Set this up on your **slideshow host machine** (not the NAS):

1. **Generate SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t rsa -b 4096
   ```
   Press Enter to accept defaults (no passphrase needed for automated mounts).

2. **Copy the public key to your NAS**:
   
   **Option A: Using ssh-copy-id (if available)**
   ```bash
   ssh-copy-id username@nas-ip-address
   ```
   
   **Option B: Manual copy (for Synology or if ssh-copy-id is unavailable)**
   ```bash
   # Display your public key
   cat ~/.ssh/id_rsa.pub
   ```
   
   Copy the entire output (starts with `ssh-rsa`), then on your NAS:
   ```bash
   # SSH into your NAS
   ssh username@nas-ip-address
   
   # Create .ssh directory if it doesn't exist
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   
   # Add the public key (paste the key you copied)
   echo "ssh-rsa AAAA...your-key-here..." >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Test the connection** (should not ask for password):
   ```bash
   ssh username@nas-ip-address
   ```

### Synology-Specific Notes

On Synology NAS, some commands like `ssh-copy-id` may not be available. Additionally:

- **Home folders**: User home directories are at `/var/services/homes/username/` or `/volume1/homes/username/`
- **Photo folder**: Usually at `/volume1/photo` or `/volume1/Photos`
- **Admin access**: You may need to use an admin account or enable user homes in Control Panel → User → Advanced

### Mount the Remote Directory

1. **Create mount point**:
   ```bash
   mkdir -p ~/slideshow/photos
   ```

2. **Mount via SSHFS**:
   ```bash
   sshfs username@nas-ip-address:/volume1/photo ~/slideshow/photos \
     -o reconnect,ServerAliveInterval=15,ServerAliveCountMax=3
   ```

   Options explained:
   - `reconnect` - Auto-reconnect on connection loss
   - `ServerAliveInterval=15` - Keep connection alive
   - `ServerAliveCountMax=3` - Retry 3 times before giving up

3. **Verify the mount**:
   ```bash
   ls ~/slideshow/photos
   ```

4. **Start the slideshow**:
   ```bash
   cd ~/slideshow
   ./run.sh start
   ```

### Auto-mount on System Boot

To mount automatically on startup, add to `/etc/fstab`:

```bash
# Edit fstab (requires sudo)
sudo nano /etc/fstab

# Add this line (adjust paths and username):
username@nas-ip-address:/volume1/photo /home/your-username/slideshow/photos fuse.sshfs defaults,_netdev,reconnect,ServerAliveInterval=15,allow_other,default_permissions,IdentityFile=/home/your-username/.ssh/id_rsa 0 0
```

Then test the mount:
```bash
sudo mount -a
```

### Unmounting

To unmount the remote directory:
```bash
fusermount -u ~/slideshow/photos
# or on macOS:
umount ~/slideshow/photos
```

### Troubleshooting Remote Mounts

**Connection issues:**
- Ensure firewall allows SSH (port 22)
- Verify SSH service is running on NAS
- Check network connectivity: `ping nas-ip-address`

**Permission denied:**
- Verify user has read permissions on remote photos
- Check SSH key is properly configured
- Try mounting with `-o allow_other,default_permissions`

**Slow loading:**
- Use faster network connection
- Enable thumbnail caching on NAS
- Reduce `gridColumns` and `gridRows` in settings.json

**Photos not updating:**
- Restart the slideshow: `./run.sh restart`
- Clear browser cache: Ctrl+Shift+R
