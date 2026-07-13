AXIOM — Industrial AI Monitor
Real-time OPC-UA monitoring dashboard with AI-powered predictive diagnostics

# What is AXIOM?

AXIOM is a full-stack industrial IoT monitoring system that:


Reads live sensor data from OPC-UA servers (IEC 62541 standard)

Bridges OPC-UA binary protocol to WebSocket/JSON for browsers

Displays real-time dashboards with trend graphs and alarms

Uses Claude AI for predictive maintenance and anomaly detection

Deployed on AWS EC2 for permanent 24/7 access from anywhere



# ARCHITECTURE

OPC-UA Server (Python)

    ↓ OPC-UA TCP (port 4840)
    
WebSocket Bridge (Node.js)

    ↓ Cloudflare Tunnel (encrypted HTTPS)
    
AWS EC2 Web Server (Node.js + Express)

    ↓ HTTPS
    
Mentor's Browser (any device, anywhere)

# TECH STACK


Industrial Protocol - OPC-UA (IEC 62541)

OPC-UA Server - Python + asyncua

Bridge - Node.js + node-opcua

Web Server - Node.js + Express + WebSocket

AI Analysis - Claude API (Anthropic)

Cloud Hosting - AWS EC2 t3.micro

Process Manager - PM2

Tunnel - Cloudflare cloudflared

Notifications - Nodemailer + Gmail

# FEATURES

✅ Live tag cards with real-time values (500ms updates)

✅ Sparkline trend graphs with 60-point history

✅ OK / WARN / ALARM status with color coding

✅ AI Health Score + anomaly detection + root cause analysis

✅ Recommended corrective actions (IMMEDIATE / SHORT TERM / SCHEDULED)

✅ Risk matrix for all monitored tags

✅ Timestamped data log with CSV export

✅ Password protected login with session tokens

✅ Auto-reconnect on connection loss

✅ Email notification when bridge comes online

# PROJECT STRUCTURE

AXIOM AWS/ 

|-website/ -
            
            |- node_modules/
            
            |- public/

                      |-index

                      |-dashboard

            |- gitignore

            |-package

            |-package-lock

            |-procfile

            |-server.js
                      

|-bridge pc/

            |-node_modules/

            |-bridge.js

            |-cloudflare.log

            |-package

            |-package-lock

            |-server.py

            |-START_AXIOM

            |-STOP_AXIOM



# SETUP

Bridge PC (ONGC Site)

pip install asyncua

npm install

node bridge.js

AWS EC2

npm install

pm2 start server.js --name axiom

pm2 startup && pm2 save

# LIVE DEMO

URL: http://3.106.155.20:3000

Access: Contact for credentials

# Built By

Gopi Ganesh — ECE Engineering Student
Mentored by ONGC Engineer
