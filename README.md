# the fixer — LAB 3D

Πειραματικό concept του thefixer.gr με **3D UI** και έντονη κίνηση.
Δεν είναι το live site — είναι δοκιμαστικό (noindex παντού).

## Τι έχει μέσα

| Στοιχείο | Τι κάνει |
|---|---|
| **WebGL hero** | Raymarched 3D «x» (το brand mark) σε χαλκό, με fresnel, ambient occlusion, soft tonemapping. Γραμμένο σε καθαρό GLSL — **καμία βιβλιοθήκη**, ~7KB. Αντιδρά σε ποντίκι και scroll. |
| **Split headline** | Κάθε λέξη μπαίνει με rotateX 3D reveal. |
| **Floating panels** | Γυάλινα 3D πάνελ με parallax σε 3 βάθη. |
| **Tilt cards** | Οι κάρτες υπηρεσιών γέρνουν στο ποντίκι με πραγματικό perspective + glare που ακολουθεί τον κέρσορα. |
| **3D ring carousel** | Οι δουλειές σε κύλινδρο 3D — σύρσιμο, βελάκια, και περιστροφή με το scroll. |
| **Pinned deck** | Το «πώς δουλεύουμε» καρφιτσώνεται και οι κάρτες φεύγουν σε 3D καθώς κατεβαίνεις. |
| **Statement** | Οι λέξεις ανάβουν μία-μία με το scroll. |
| **Custom cursor** | Δαχτυλίδι με blend mode, αλλάζει σε «δες» / «σύρε». |
| **Magnetic buttons** | Τα κουμπιά τραβάνε τον κέρσορα. |
| **Counters** | Τα νούμερα του MEGAWATT ανεβαίνουν όταν μπουν στην οθόνη. |
| **Κουμπί «Κίνηση»** | Πάνω δεξιά. Σέβεται το `prefers-reduced-motion` του συστήματος αλλά μπορείς να το ανάψεις χειροκίνητα (θυμάται την επιλογή). |

## Τεχνικά

- Καθαρό HTML/CSS/JS. Μηδέν dependencies, μηδέν build.
- Fonts: Barlow self-hosted. Εικόνες: πραγματικά screenshots πελατών.
- Τα περιεχόμενα (νούμερα MEGAWATT, case studies) είναι πραγματικά.

## Deploy στο Netlify

**Α. Από GitHub** — New site from Git → διάλεξε το repo →
build command: *(κενό)*, publish directory: `.` → Deploy.

**Β. Χωρίς GitHub** — σύρε τον φάκελο στο app.netlify.com/drop.

## Τοπικά

```bash
python3 -m http.server 4400
```
