# PWA Test Checklist

## Installability
- [ ] Chrome shows install button in address bar (laptop)
- [ ] Android Chrome shows "Add to Home Screen" banner
- [ ] App icon appears correctly on Android home screen
- [ ] App icon appears correctly on desktop
- [ ] Splash screen shows on Android launch
- [ ] display: standalone — no browser chrome visible when launched

## Offline
- [ ] App loads with no internet connection
- [ ] Chart rendering works offline
- [ ] File upload/CSV parsing works offline
- [ ] Gemini AI features show offline message gracefully
- [ ] Video export works offline
- [ ] PNG export works offline

## Service Worker
- [ ] SW registers successfully (DevTools > Application > Service Workers)
- [ ] All app assets are precached (Application > Cache Storage)
- [ ] Update notification appears after new deployment
- [ ] "Update Now" successfully reloads with new version

## Data Persistence
- [ ] Auto-save works (data survives page refresh)
- [ ] Saved charts appear in panel
- [ ] Load saved chart restores chart type + data + colors
- [ ] Settings persist across sessions

## Android Specific
- [ ] Share a CSV from Files app TO RaceGraph — file loads automatically
- [ ] .webm video export downloads to Downloads folder
- [ ] App works on low-memory Android (512MB RAM test)
- [ ] Touch targets are large enough (no mis-taps)

## Desktop PWA
- [ ] Install from Chrome on Windows — appears in Start Menu
- [ ] Install from Edge on Windows — appears in taskbar
- [ ] Open CSV file with RaceGraph from Explorer right-click
- [ ] Window Controls Overlay shows app title in native title bar
- [ ] Uninstall works cleanly

## Lighthouse Score Targets
- Performance: >85
- PWA: 100
- Accessibility: >90
- Best Practices: >90
- SEO: >80
