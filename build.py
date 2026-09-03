#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
the fixer — LAB 3D · γεννήτρια σελίδων.
Τρέξε:  python3 build.py
Γράφει index.html, services/, work/, about/, contact/, 404.html από τα _src/.
Δεν χρειάζεται τίποτα εγκατεστημένο — μόνο Python 3.
"""
import os, re, io

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.join(ROOT, "_src")

NAV = [
    ("/work/",     "Δουλειές"),
    ("/services/", "Υπηρεσίες"),
    ("/about/",    "Ποιοι είμαστε"),
    ("/contact/",  "Επικοινωνία"),
]

# ── Τα projects. url=None όσα δεν είναι ακόμη online με δικό μας domain. ──
PROJECTS = [
    dict(slug="megawatt", name="MEGAWATT", kind="Social Media · 14 καταστήματα",
         url=None, cats=["social", "content"],
         blurb="Από 16.2K σε 64.7K followers σε 12 μήνες, με 0€ διαφήμιση. "
               "1.3M προβολές σε reels. Τα σκετσάκια της αποθήκης έκαναν ×80 τα νούμερα "
               "των παρουσιάσεων προϊόντος.",
         stat="64.7K followers"),
    dict(slug="pittas-studios", name="Pittas Studios", kind="Ξενοδοχείο · Καρδάμαινα, Κως",
         url="https://www.pittasstudios.com", cats=["web"],
         blurb="Πολυσέλιδο site με απευθείας κρατήσεις, σύγκριση τιμών με τα κανάλια "
               "και δικό του blog. Το εργαστήριό μας: είναι το κατάλυμα του ιδιοκτήτη μας.",
         stat="35% direct"),
    dict(slug="elea-luxury-suites", name="Elea Luxury Suites", kind="Suites με πισίνα · Καρδάμαινα",
         url="https://elealuxurysuites.com", cats=["web"],
         blurb="Direct-booking funnel με ημερομηνίες μέσα στο hero και ζωντανή σύγκριση "
               "τιμής απέναντι σε Booking και Expedia. Τρεις γλώσσες.",
         stat="EN · DE · EL"),
    dict(slug="aegean-sunset-villas", name="Aegean Sunset Villas", kind="3 ιδιωτικές βίλες · Μαστιχάρι",
         url="https://aegeansunsetvillas.com", cats=["web", "content"],
         blurb="Hero με drone video του πελάτη, σελίδα ανά βίλα, 61 επεξεργασμένες "
               "φωτογραφίες. Έφυγε από Wix.",
         stat="7 σελίδες"),
    dict(slug="onar-villas", name="ŌNAR Villas", kind="Private pool villas · Καρδάμαινα",
         url="https://onarvillaskos.com", cats=["web"],
         blurb="Direct-first site για βίλες με ιδιωτική πισίνα. 74 φωτογραφίες σε τρεις "
               "αναλογίες, μηδέν αναφορά σε τρίτα κανάλια.",
         stat="0% προμήθειες"),
    dict(slug="starlight", name="Starlight", kind="Beach bar & rooms · Καρδάμαινα",
         url="https://www.starlightbeachbar.com", cats=["web", "brand"],
         blurb="Δύο brands κάτω από μία στέγη, 200+ πιάτα μεταγραμμένα στο χέρι, "
               "αλλαγή domain χωρίς να σπάσει κανένα παλιό link.",
         stat="Από το 1973"),
    dict(slug="louis-supermarket", name="Louis Supermarkets", kind="Super market · Μαρίνα Κω",
         url="https://supermarketlouis.com", cats=["web"],
         blurb="Παραγγελία και παράδοση στο σκάφος, χωρίς χρέωση μεταφοράς. "
               "Στημένο για κόσμο που ψάχνει provisioning από το κινητό, στη μαρίνα.",
         stat="7 μέρες ανοιχτά"),
    dict(slug="dr-kambanis", name="Dr. Ioannis Kambanis", kind="Ιατρείο · Ζηπάρι, Κως",
         url="https://drkambaniskos.com", cats=["web"],
         blurb="Γενική ιατρική για ντόπιους και επισκέπτες. Τρεις γλώσσες, τηλέφωνο και "
               "WhatsApp σε κάθε οθόνη, ωράριο που διαβάζεται με τη μία.",
         stat="EN · DE · IT"),
    dict(slug="villa-elusia", name="Villa Elusia", kind="Ιδιωτική βίλα · Κως",
         url="https://villaelusiakos.com", cats=["web"],
         blurb="Μονοσέλιδο που δουλεύει σαν φυλλάδιο πώλησης: φωτογραφίες, παροχές, "
               "απευθείας επικοινωνία. Χωρίς προμήθειες σε πλατφόρμες.",
         stat="Direct only"),
    dict(slug="philippos-studios", name="Philippos Studios", kind="19 δωμάτια · Καρδάμαινα",
         url=None, cats=["web"],
         blurb="Οικογενειακό συγκρότημα με 9.1 στο Booking. Site που δείχνει τα δωμάτια "
               "όπως είναι, χωρίς φίλτρα και χωρίς υποσχέσεις.",
         stat="9.1 στο Booking"),
]

CATS = [("all", "Όλα"), ("web", "Ιστοσελίδες"), ("social", "Social"),
        ("content", "Περιεχόμενο"), ("brand", "Branding")]

SERVICES = [
    dict(no="01", name="Social Media",
         lead="Στρατηγική, παραγωγή, community management.",
         body="Δεν ποστάρουμε για να ποστάρουμε. Ξεκινάμε από το τι πουλάει και "
              "χτίζουμε γύρω από αυτό: σενάρια, γύρισμα, μοντάζ, πρόγραμμα, απαντήσεις "
              "σε μηνύματα. Τα reels που δουλεύουν σπάνια είναι αυτά που περιμένεις.",
         items=["Πλάνο περιεχομένου ανά μήνα", "Γύρισμα και μοντάζ επιτόπου",
                "Reels, carousels, stories", "Απαντήσεις σε σχόλια και μηνύματα",
                "Αναφορά με νούμερα κάθε μήνα"]),
    dict(no="02", name="Performance Ads",
         lead="Google και Meta, με tracking που στέκει.",
         body="Πρώτα στήνουμε τη μέτρηση, μετά ξοδεύουμε. Χωρίς σωστό tracking κάθε "
              "νούμερο είναι μυθιστόρημα. Αν το budget δεν βγάζει, θα το ακούσεις από "
              "εμάς πριν το δεις στον λογαριασμό σου.",
         items=["Search, Performance Max, Demand Gen", "Meta: awareness έως conversions",
                "GA4, GTM, conversion API", "A/B σε creative και κοινά",
                "Μηνιαίο ξεκαθάρισμα σε ό,τι δεν αποδίδει"]),
    dict(no="03", name="Web Design &amp; Development",
         lead="Custom κώδικας. Όχι template, όχι WordPress.",
         body="Στατικά sites που φορτώνουν αμέσως, δεν έχουν plugin να σπάσει και δεν "
              "χρειάζονται συντήρηση κάθε μήνα για να μείνουν ασφαλή. Ο κώδικας και το "
              "περιεχόμενο είναι δικά σου από την πρώτη μέρα.",
         items=["Πολυσέλιδα sites και landing pages", "Πολυγλωσσικά με hreflang",
                "Απευθείας κρατήσεις χωρίς προμήθειες", "Τεχνικό SEO και schema",
                "Ταχύτητα που περνάει τα Core Web Vitals"]),
    dict(no="04", name="Content Production",
         lead="Φωτογράφιση, video, drone.",
         body="Το υλικό είναι το καύσιμο. Χωρίς αυτό, ούτε site ούτε διαφήμιση τρέχει. "
              "Ερχόμαστε, γυρίζουμε, παραδίδουμε έτοιμα για κάθε format — από 9:16 "
              "story μέχρι hero video πλάτους οθόνης.",
         items=["Φωτογράφιση χώρων και προϊόντων", "Video και reels", "Drone",
                "Επεξεργασία και export ανά κανάλι", "Δικαιώματα χρήσης χωρίς αστερίσκους"]),
    dict(no="05", name="Branding",
         lead="Λογότυπο, tone of voice, brand book.",
         body="Να ξέρει ο κόσμος ποιος είσαι πριν προλάβεις να μιλήσεις. Και να ξέρει "
              "ο επόμενος συνεργάτης σου τι επιτρέπεται, χωρίς να ρωτάει.",
         items=["Λογότυπο και παραλλαγές", "Χρώματα και τυπογραφία",
                "Brand book με κανόνες χρήσης", "Εφαρμογές σε έντυπο και ψηφιακό",
                "Tone of voice"]),
    dict(no="06", name="AI Solutions",
         lead="Αυτοματισμοί και ορατότητα σε AI μηχανές.",
         body="Ό,τι διαβάζει η Google το διαβάζει και το ChatGPT. Καθαρή δομή, σωστά "
              "δεδομένα, περιεχόμενο που απαντάει σε ερωτήσεις. Και εργαλεία που "
              "γλιτώνουν ώρες από τη διαχείριση.",
         items=["Δομημένα δεδομένα και llms.txt", "Περιεχόμενο που απαντάει σε ερωτήσεις",
                "Αυτοματισμοί σε κρατήσεις και ερωτήματα", "Εσωτερικά εργαλεία και dashboards",
                "Τίμια μέτρηση — καμία εγγύηση για το τι θα προτείνει ένα AI"]),
]


def nav(active):
    links = "".join(
        '<a href="%s"%s data-cursor="hover">%s</a>' %
        (href, ' aria-current="page"' if href == active else "", label)
        for href, label in NAV)
    return """<header class="nav" id="nav">
  <div class="nav__in">
    <a class="brand" href="/" data-cursor="hover" aria-label="the fixer — αρχική">
      <img src="/assets/img/logo-wordmark-gold.svg" alt="the fixer" class="brand__logo" width="150" height="38">
      <em class="brand__tag">lab</em>
    </a>
    <nav class="nav__links" aria-label="Κύρια πλοήγηση">%s</nav>
    <div class="nav__right">
      <button class="motion-toggle" id="motionToggle" type="button" aria-pressed="true" title="Κίνηση on/off">
        <span class="motion-toggle__dot"></span><span class="motion-toggle__txt">Κίνηση</span>
      </button>
      <a class="btn btn--sm" href="/contact/" data-cursor="hover"><span>Μίλα μας</span></a>
    </div>
  </div>
  <i class="nav__progress" id="navProgress"></i>
  <button class="burger" id="burger" type="button" aria-label="Μενού" aria-expanded="false">
    <span></span><span></span>
  </button>
</header>
<div class="drawer" id="drawer" hidden>
  <nav class="drawer__links" aria-label="Μενού">%s</nav>
  <a class="btn btn--solid" href="/contact/"><span>Μίλα μας</span></a>
</div>""" % (links, links)


FOOTER = """<footer class="foot">
  <div class="foot__in">
    <a class="foot__brand" href="/"><img src="/assets/img/logo-wordmark-silver.svg" alt="the fixer" width="132" height="34"><em>lab</em></a>
    <p class="foot__note">Πειραματικό concept — δεν είναι το live site.
      <a href="https://www.thefixer.gr" target="_blank" rel="noopener noreferrer" data-cursor="hover">thefixer.gr</a></p>
    <span class="foot__meta">Κως · Ελλάδα · <a href="mailto:info@thefixer.gr" data-cursor="hover">info@thefixer.gr</a></span>
  </div>
</footer>"""


def shell(title, desc, path, body, hero_class=""):
    return """<!DOCTYPE html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>%(title)s</title>
<meta name="description" content="%(desc)s">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0b0a0c">
<meta property="og:title" content="%(title)s">
<meta property="og:description" content="%(desc)s">
<meta property="og:type" content="website">
<link rel="preload" href="/assets/fonts/Barlow-Regular.ttf" as="font" type="font/ttf" crossorigin>
<link rel="preload" href="/assets/fonts/Barlow-ExtraBold.ttf" as="font" type="font/ttf" crossorigin>
<link rel="stylesheet" href="/assets/css/main.css">
</head>
<body>
<a class="skip" href="#main">Μετάβαση στο περιεχόμενο</a>

<div class="loader" id="loader" aria-hidden="true">
  <div class="loader__inner">
    <img class="loader__logo" src="/assets/img/logo-wordmark-gold.svg" alt="" width="200" height="51">
    <div class="loader__bar"><i id="loaderBar"></i></div>
    <div class="loader__num"><span id="loaderNum">0</span><em>%%</em></div>
  </div>
</div>

<div class="cursor" id="cursor" aria-hidden="true"><span class="cursor__dot"></span><span class="cursor__ring"></span><span class="cursor__label"></span></div>

%(nav)s

<main id="main">
<span id="top"></span>
%(body)s
</main>

%(footer)s

<script src="/assets/js/gl.js" defer></script>
<script src="/assets/js/app.js" defer></script>
%(extra)s
</body>
</html>
""" % dict(title=title, desc=desc, nav=nav(path), body=body, footer=FOOTER,
           extra='<script src="/assets/js/phone-country.js" defer></script>' if path == "/contact/" else "")


def page_hero(kicker, title_html, sub, cta=""):
    """Μικρό hero με τον ίδιο 3D καμβά που έχει η αρχική."""
    return """<section class="hero hero--sm" id="hero">
  <canvas class="hero__canvas" id="gl" aria-hidden="true"></canvas>
  <div class="hero__veil" aria-hidden="true"></div>
  <div class="hero__grid" aria-hidden="true"></div>
  <div class="hero__in">
    <p class="kicker reveal" data-reveal><i></i>%s</p>
    <h1 class="hero__title hero__title--sm">%s</h1>
    <p class="hero__sub reveal" data-reveal>%s</p>
    %s
  </div>
</section>""" % (kicker, title_html, sub, cta)


def split(text, cls=""):
    return " ".join('<span class="w %s" data-split>%s</span>' % (cls, w) for w in text.split(" "))


# ══════════ WORK ══════════
def work_body():
    chips = "".join(
        '<button type="button" class="chip%s" data-filter="%s" data-cursor="hover">%s</button>'
        % (" is-on" if k == "all" else "", k, label) for k, label in CATS)

    cards = []
    for p in PROJECTS:
        link_open = ('<a class="pj__link" href="%s" target="_blank" rel="noopener" data-cursor="view" '
                     'aria-label="%s — δες το site">' % (p["url"], p["name"])) if p["url"] else ""
        link_close = "</a>" if p["url"] else ""
        live = ('<span class="pj__live"><i></i>online</span>' if p["url"]
                else '<span class="pj__live pj__live--off">case study</span>')
        cards.append("""  <article class="pj tilt" data-cats="%(cats)s">
    <div class="pj__glare"></div>
    <div class="pj__shot">%(open)s<img src="/assets/img/work/%(slug)s.jpg" alt="%(name)s" loading="lazy" width="1280" height="800">%(close)s</div>
    <div class="pj__body">
      <div class="pj__top"><h2>%(name)s</h2>%(live)s</div>
      <p class="pj__kind">%(kind)s</p>
      <p class="pj__blurb">%(blurb)s</p>
      <div class="pj__foot"><span class="pj__stat">%(stat)s</span>%(cta)s</div>
    </div>
  </article>""" % dict(
            cats=" ".join(p["cats"]), slug=p["slug"], name=p["name"], kind=p["kind"],
            blurb=p["blurb"], stat=p["stat"], live=live, open=link_open, close=link_close,
            cta=('<a class="pj__go" href="%s" target="_blank" rel="noopener" data-cursor="hover">Δες το live →</a>' % p["url"])
                if p["url"] else ""))

    return page_hero(
        "Το χαρτοφυλάκιο",
        '<span class="line">%s</span><span class="line">%s</span>' % (split("Δουλειές που"), split("τρέχουν σήμερα.", "grad")),
        "Δέκα projects, τα περισσότερα online αυτή τη στιγμή. Πάτα οποιοδήποτε και δες το μόνος σου — "
        "δεν βάζουμε mockups που δεν υπάρχουν πουθενά."
    ) + """
<section class="sec work-grid">
  <div class="chips" id="chips">%s</div>
  <div class="pjs" id="pjs">
%s
  </div>
  <p class="work-grid__note reveal" data-reveal>Λείπουν επίτηδες όσα δεν έχουν βγει ακόμη στον αέρα. Όταν βγουν, μπαίνουν.</p>
</section>
%s""" % (chips, "\n".join(cards), CTA_BAND)


# ══════════ SERVICES ══════════
def services_body():
    blocks = []
    for s in SERVICES:
        items = "".join("<li>%s</li>" % i for i in s["items"])
        blocks.append("""  <article class="svc tilt">
    <div class="svc__glare"></div>
    <div class="svc__in">
      <span class="svc__no">%s</span>
      <h2>%s</h2>
      <p class="svc__lead">%s</p>
      <p class="svc__body">%s</p>
      <ul class="svc__list">%s</ul>
    </div>
  </article>""" % (s["no"], s["name"], s["lead"], s["body"], items))

    return page_hero(
        "Τι κάνουμε",
        '<span class="line">%s</span><span class="line">%s</span>' % (split("Έξι υπηρεσίες."), split("Ένας συνεργάτης.", "grad")),
        "Δεν χρειάζεται να τα πάρεις όλα. Χρειάζεται να ξέρεις τι σου λείπει — και αυτό το βρίσκουμε μαζί, δωρεάν."
    ) + """
<section class="sec svcs">
%s
</section>
<section class="sec how">
  <header class="sec__head">
    <p class="kicker reveal" data-reveal><i></i>Πώς χρεώνουμε</p>
    <h2 class="sec__title reveal" data-reveal>Χωρίς <span class="dim">ψιλά γράμματα.</span></h2>
  </header>
  <div class="how__grid">
    <div class="how__card tilt"><h3>Έργο</h3><p>Site, brand, φωτογράφιση: σταθερό ποσό, γραπτό πλάνο, ημερομηνία παράδοσης. Ξέρεις από την αρχή τι πληρώνεις.</p></div>
    <div class="how__card tilt"><h3>Μηνιαία</h3><p>Social, διαφημίσεις, συντήρηση: σταθερή συνδρομή ανά μήνα. Το budget των διαφημίσεων είναι χωριστό και πάει ολόκληρο στην πλατφόρμα.</p></div>
    <div class="how__card tilt"><h3>Ό,τι φτιάχνουμε είναι δικό σου</h3><p>Domain, κώδικας, λογαριασμοί διαφήμισης, υλικό. Στο όνομά σου. Αν φύγεις, τα παίρνεις μαζί σου.</p></div>
  </div>
</section>
%s""" % ("\n".join(blocks), CTA_BAND)


CTA_BAND = """<section class="cta">
  <div class="cta__panel tilt">
    <div class="cta__glow" aria-hidden="true"></div>
    <p class="kicker"><i></i>Επόμενο βήμα</p>
    <h2>Στείλε μου το link σου.<br><span class="grad">Θα σου πω και τα άσχημα.</span></h2>
    <p class="cta__sub">Δωρεάν πρώτη ματιά στο site, στα social ή στις διαφημίσεις σου. Χωρίς παρουσίαση 20 slides.</p>
    <div class="cta__btns">
      <a class="btn btn--solid magnet" href="/contact/" data-cursor="hover"><span>Φόρμα επικοινωνίας</span></a>
      <a class="btn btn--ghost magnet" href="https://wa.me/306942428836" target="_blank" rel="noopener" data-cursor="hover"><span>WhatsApp</span></a>
    </div>
  </div>
</section>"""


def build():
    pages = [
        ("index.html", "/", "the fixer — LAB 3D | Πειραματικό concept",
         "Πειραματική έκδοση του thefixer.gr: WebGL 3D hero, scroll-driven κίνηση, 3D UI.",
         open(os.path.join(SRC, "home.html"), encoding="utf-8").read()),
        ("work/index.html", "/work/", "Δουλειές — the fixer LAB",
         "Δέκα projects που τρέχουν σήμερα: ξενοδοχεία, βίλες, εστίαση, λιανική, ιατρείο.",
         work_body()),
        ("services/index.html", "/services/", "Υπηρεσίες — the fixer LAB",
         "Social media, performance ads, ιστοσελίδες, περιεχόμενο, branding, AI.",
         services_body()),
        ("about/index.html", "/about/", "Ποιοι είμαστε — the fixer LAB",
         "360° digital agency στην Κω από το 2018. Οι άνθρωποι, ο τρόπος, τα όρια.",
         open(os.path.join(SRC, "about.html"), encoding="utf-8").read()),
        ("contact/index.html", "/contact/", "Επικοινωνία — the fixer LAB",
         "Στείλε μας το link σου. Δωρεάν πρώτη ματιά, χωρίς παρουσίαση 20 slides.",
         open(os.path.join(SRC, "contact.html"), encoding="utf-8").read()),
        ("404.html", "", "Δεν βρέθηκε — the fixer LAB",
         "Η σελίδα δεν υπάρχει.",
         open(os.path.join(SRC, "404.html"), encoding="utf-8").read()),
    ]
    for out, path, title, desc, body in pages:
        dst = os.path.join(ROOT, out)
        os.makedirs(os.path.dirname(dst), exist_ok=True) if os.path.dirname(out) else None
        body = body.replace("<!--CTA-->", CTA_BAND)
        with io.open(dst, "w", encoding="utf-8") as f:
            f.write(shell(title, desc, path, body))
        print("→", out)


if __name__ == "__main__":
    build()
