# KeyboardRecorder Server

This is the server and front-end website for a device that I'm building that automatically records everything I play on my piano. The repository for the device's firmware can be found [here](https://github.com/lachlansleight/KeyboardRecorder-Firmware)

## Getting Started

This is just a quick rundown, if anyone actually wants to try and get it running, let me know and I'll write up some proper instructions for you!

1. Set up a Firebase project with realtime database. As of the time of this writing, you'll need it to be completely unsecured, but I'll be adding authentication soon. Get the standard firebase config information, which you'll need in the next step
2. Fork this repository, clone it, then run `npm install` and create a .env file with the following information (filling in the variables with your firebase config):

```
NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

3. Create a new vercel project and link it to your fork of this repo. Populate all the necessary environment variables with variables that match your .env file
4. Make sure your vercel app deploys - note down its URL and replace the default URL of the firmware device with it, to ensure your recordings get sent to the right place

In the future, there will be two new pieces of authentication - the frontend website will require authentication to make changes (and, configurably, to view recordings), and the recording hardware will include its MAC address in POST requests, ensuring that only one specific device is allowed to upload recordings.
