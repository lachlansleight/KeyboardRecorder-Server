# KeyboardRecorder Server

This is the server and front-end website for a device that I'm building that automatically records everything I play on my piano. The repository for the device's firmware can be found [here](https://github.com/lachlansleight/MidiRecorder-Firmware)

## Getting Started

This is just a quick rundown, if anyone actually wants to try and get it running, let me know and I'll write up some proper instructions for you!

1. Set up a Firebase project with realtime database and email/password authentication. Create a user and note its uid for the next step
2. Add the following security rules to the realtime database:

```json
{
    "rules": {
        "recordings": {
            ".read": true,
            ".write": "auth.uid == '[YOUR_UID]'"
        },
        "recordingList": {
            ".read": true,
            ".write": "auth.uid == '[YOUR_UID]'"
        },
        "errors": {
            ".read": "auth.uid == '[YOUR_UID]'",
            ".write": "auth.uid == '[YOUR_UID]'"
        }
    }
}
```

3. Fork this repository, clone it, then run `npm install` and create a .env file with the following information (filling in the variables with your firebase config):

```
NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

NEXT_PUBLIC_DEVICE_MAC_ADDRESS=... [this is the MAC address of your ESP32, which is printed out to serial each time the firmware starts]

FB_EMAIL=... [the email address of your manually-created firebase user]
FB_PASSWORD=... [the password of your manually-created firebase user]
```

4. Create a new vercel project and link it to your fork of this repo. Populate all the necessary environment variables with variables that match your .env file
5. Make sure your vercel app deploys - note down its URL and replace the default URL of the firmware device with it, to ensure your recordings get sent to the right place
