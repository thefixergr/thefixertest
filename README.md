# the fixer — LAB 3D

Πειραματικό concept του thefixer.gr με **3D UI** και έντονη κίνηση.
Δεν είναι το live site — είναι δοκιμαστικό (noindex παντού).

## Τι έχει μέσα

| Στοιχείο | Τι κάνει |
|---|---|
| **WebGL hero** | Το **πραγματικό logo mark** σε 3D: διαβάζουμε το `mark-gold.svg`, χτίζουμε signed distance field στη CPU (Felzenszwalb EDT) και το κάνουμε extrude μέσα στον shader. Χαλκός με fresnel, ambient occlusion, faux environment reflection. Καθαρό GLSL, **καμία βιβλιοθήκη**. Αντιδρά σε ποντίκι και scroll. |
| **Split headline** | Κάθε λέξη μπαίνει με rotateX 3D reveal. |
| **Floating panels** | Γυάλινα 3D πάνελ με parallax σε 3 βάθη. |
| **Tilt cards** | Οι κάρτες υπηρεσιών γέρνουν στο ποντίκι με πραγματικό perspective + glare που ακολουθεί τον κέρσορα. |
| **3D ring carousel** | Οι δουλειές σε κύλινδρο 3D — σύρσιμο, βελάκια, και περιστροφή με το scroll. |
| **Pinned deck** | Το «πώς δουλεύουμε» καρφιτσώνεται και οι κάρτες φεύγουν σε 3D καθώς κατεβαίνεις. |
| **Statement** | Οι λέξεις ανάβουν μία-μία με το scroll. |
| **Custom cursor** | Δαχτυλίδι με blend mode, αλλάζει σε «δες» / «σύρε». |
| **Magnetic buttons** | Τα κουμπιά τραβάνε τον κέρσορα. |
| **Counters** | Τα νούμερα του MEGAWATT ανεβαίνουν όταν μπουν στην οθόνη. |
| **Title card** | Η πρώτη φόρτωση ανοίγει σαν ταινία: μαύρο, το λογότυπο έρχεται σε φόκους από θόλωση, timecode στα 24fps, και μετά η οθόνη ανοίγει σαν κουρτίνα από τη μέση. Μία φορά ανά session. |
| **Φιλμικά στρώματα** | Κινούμενο film grain (SVG turbulence, `overlay`), βινιέτα, και color grade `soft-light` — ψυχρές σκιές, ζεστά φώτα. |
| **Anamorphic flare** | Ο shader ρίχνει οριζόντια μπλε λάμψη στο ύψος του σήματος, bloom γύρω του, διασπορά φακού και βινιέτα στις άκρες — όπως φακός σινεμασκόπ. |
| **Viewfinder** | Γωνιακά σημάδια κάδρου, timecode που τρέχει και ένδειξη REC στο hero. |
| **Fade to black** | Η πλοήγηση ανάμεσα στις σελίδες σβήνει στο μαύρο και ανοίγει στη νέα σκηνή. |
| **Ken Burns** | Τα καρέ του portfolio κάνουν αργό zoom, με διαφορετικό ρυθμό το καθένα. |
| **Κουμπί «Κίνηση»** | Πάνω δεξιά, και μέσα στο μενού του κινητού. Η κίνηση **αγνοεί επίτηδες** το `prefers-reduced-motion` του λειτουργικού — είναι το ίδιο το προϊόν αυτής της σελίδας. Όποιος τη θέλει σβηστή πατάει το κουμπί και η επιλογή θυμάται. |

## Σελίδες

`/` · `/work/` · `/services/` · `/about/` · `/contact/` · `404.html`

Παράγονται από το `build.py` (μόνο stdlib Python) με βάση τα `_src/*.html` και τη
λίστα projects μέσα στο ίδιο το script:

```bash
python3 build.py
```

Το output είναι committed, οπότε το Netlify δεν χρειάζεται build step.

## Τεχνικά

- Καθαρό HTML/CSS/JS. Μηδέν dependencies, μηδέν build.
- Fonts: Barlow self-hosted. Logo: τα κανονικά SVG από το brand kit.
- Portfolio: 10 πραγματικά projects, τα 8 online — τα screenshots είναι από τα live sites.
- Φόρμα επικοινωνίας: Netlify Forms + country-code selector με σημαίες (209 χώρες, χωρίς dependencies).
- Τα περιεχόμενα (νούμερα MEGAWATT, case studies) είναι πραγματικά.

## Deploy στο Netlify

**Α. Από GitHub** — New site from Git → διάλεξε το repo →
build command: *(κενό)*, publish directory: `.` → Deploy.

**Β. Χωρίς GitHub** — σύρε τον φάκελο στο app.netlify.com/drop.

## Τοπικά

```bash
python3 -m http.server 4400
```
