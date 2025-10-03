React Native Audio Recorder :

A simple React Native audio recorder app built with native modules.
It lets you record, pause, resume, stop, play back, and manage audio recordings with a smooth UI and animations.

Features :

1.Start, pause, resume, and stop audio recordings
2.Play back saved recordings
3.Displays elapsed recording time with live updates
4.Pulse animation for the mic button while recording
5.Saves recordings with name, duration, and timestamp
6.List of saved recordings (persistent between sessions)
7.Handles microphone permissions gracefully

Platform Support :

Android (fully functional)
iOS (not yet implemented, planned for future release)

Installation :

Clone the repository:

git clone https://github.com/CallMeArunkumar/rn_audio_recorder.git
cd rn-audio-recorder


Install dependencies:

npm install
# or
yarn install


Run on Android:

npx react-native run-android


Run on iOS:

Not yet supported.


Permissions :
Android

Make sure you add these to AndroidManifest.xml:

<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

iOS

Not yet supported.


Tech Stack :

React Native
TypeScript
Animated API (for mic pulse effect)
Native Modules for audio recording


License
MIT License © 2025 Arunkumar