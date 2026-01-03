# Cockpit Monitoring Guide

## Overview
Cockpit provides a web-based interface for monitoring and managing your Podman containers running in rootless mode.

## Accessing Cockpit

### URL
```
https://your-vps-ip:9090
```

### Login Credentials
Use your Ubuntu user credentials (the user with sudo privileges, NOT `erp_user`).

## Initial Setup

### 1. First Login
1. Navigate to `https://your-vps-ip:9090`
2. Accept the self-signed certificate warning (or configure your own certificate)
3. Login with your Ubuntu admin user
4. You'll see the Cockpit dashboard

### 2. Enable Podman Plugin
The Podman plugin should be automatically available if installed via `ubuntu_hardening.sh`.

Navigate to: **Podman Containers** (in the left sidebar)

## Monitoring ERP Containers

### View Running Containers
In the **Podman Containers** section, you'll see all containers:
- `erp_db` - PostgreSQL database
- `erp_redis` - Redis cache
- `erp_backend` - Django API
- `erp_frontend` - Next.js frontend
- `erp_celery_worker` - Background tasks
- `erp_celery_beat` - Task scheduler
- `erp_caddy` - Reverse proxy

### Container Actions
For each container, you can:
- **Start/Stop/Restart** - Control container lifecycle
- **View Logs** - Real-time log streaming
- **Inspect** - View container configuration
- **Delete** - Remove container (use with caution)

### Viewing Logs
1. Click on a container name (e.g., `erp_backend`)
2. Click the **Logs** tab
3. Logs will stream in real-time
4. Use the search box to filter logs

### Resource Monitoring
1. Go to **System** in the left sidebar
2. View:
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network traffic

### Container Details
Click on any container to see:
- **Details**: Image, command, ports, volumes
- **Integration**: Systemd service status
- **Logs**: Real-time log output
- **Console**: Attach to container terminal

## Security Best Practices

### Restrict Cockpit Access
By default, Cockpit is accessible on port 9090. To restrict access:

#### Option 1: UFW Firewall Rule (IP Whitelist)
```bash
# Remove general rule
sudo ufw delete allow 9090/tcp

# Add specific IP
sudo ufw allow from YOUR_IP_ADDRESS to any port 9090 proto tcp
```

#### Option 2: SSH Tunnel (Recommended)
Instead of exposing port 9090, use SSH tunneling:

```bash
# On your local machine
ssh -L 9090:localhost:9090 user@your-vps-ip

# Then access Cockpit at:
# https://localhost:9090
```

#### Option 3: Disable Remote Access
```bash
# Edit Cockpit configuration
sudo nano /etc/cockpit/cockpit.conf

# Add:
[WebService]
Origins = https://localhost:9090 http://localhost:9090
ProtocolHeader = X-Forwarded-Proto
AllowUnencrypted = false
```

### Enable Two-Factor Authentication
Cockpit supports PAM-based 2FA:

```bash
# Install Google Authenticator
sudo apt-get install libpam-google-authenticator

# Configure for your user
google-authenticator

# Edit PAM configuration
sudo nano /etc/pam.d/cockpit

# Add at the top:
auth required pam_google_authenticator.so
```

## Troubleshooting

### Cockpit Won't Start
```bash
# Check service status
sudo systemctl status cockpit.socket

# Restart service
sudo systemctl restart cockpit.socket

# View logs
sudo journalctl -u cockpit.socket
```

### Can't See Podman Containers
```bash
# Verify cockpit-podman is installed
dpkg -l | grep cockpit-podman

# Reinstall if needed
sudo apt-get install --reinstall cockpit-podman

# Restart Cockpit
sudo systemctl restart cockpit.socket
```

### Permission Issues
Cockpit runs as the logged-in user. To manage `erp_user` containers:

1. You need to be logged in as a user with sudo privileges
2. Cockpit will show system-wide containers
3. For user-specific containers, you may need to switch context

## Advanced Features

### Custom Dashboards
You can create custom monitoring dashboards using Cockpit's plugin system.

### Integration with Systemd
Cockpit shows the Systemd status of containers if they're managed by Systemd units (generated via `generate_systemd.sh`).

### Performance Metrics
Navigate to **System → Performance Metrics** for detailed graphs:
- CPU usage over time
- Memory consumption
- Disk I/O rates
- Network throughput

## Alternatives to Cockpit

If you prefer command-line monitoring:

### Podman Commands
```bash
# View all containers
podman ps -a

# View logs
podman logs -f erp_backend

# Resource usage
podman stats

# Inspect container
podman inspect erp_backend
```

### Systemd Commands
```bash
# View all ERP services
systemctl --user list-units 'container-erp_*'

# View service logs
journalctl --user -u container-erp_backend.service -f

# Service status
systemctl --user status container-erp_backend.service
```

## Monitoring Best Practices

1. **Regular Checks**: Review container status daily
2. **Log Rotation**: Ensure logs don't fill up disk space
3. **Resource Alerts**: Set up alerts for high CPU/memory usage
4. **Backup Monitoring**: Verify backups are running successfully
5. **Security Updates**: Keep Cockpit and plugins updated

## Additional Resources
- [Cockpit Documentation](https://cockpit-project.org/guide/latest/)
- [Cockpit Podman Plugin](https://github.com/cockpit-project/cockpit-podman)
- [Podman Documentation](https://docs.podman.io/)
