/* ============================================================================
   phone-country.js — international phone input with country flags
   ----------------------------------------------------------------------------
   Reusable across projects. No dependencies, no build step, no network calls.

   Markup:
     <div class="phone-field" data-phone-field
          data-default="GR"
          data-frequent="GB,DE,NL,IT,FR">
       <input type="tel" id="phone" autocomplete="tel-national">
       <input type="hidden" name="phone">
     </div>

   Behaviour:
     - builds the country <select> itself (flag + name + dial code)
     - preselects from the browser locale, falling back to data-default
     - keeps the hidden input in sync as "+30 6972207370" so the form
       receives one clean, dialable number
     - if the visitor types a number starting with "+", their input wins
       and the selector follows it

   Flags are emoji built from the ISO code, so there are no image assets.
   Windows desktop renders them as the two-letter code instead of a flag —
   still readable, and every other platform shows the flag.
   ========================================================================= */
(function () {
  "use strict";

  /* iso2, name, dial code */
  var COUNTRIES = [
    ["AF","Afghanistan","93"],["AL","Albania","355"],["DZ","Algeria","213"],
    ["AD","Andorra","376"],["AO","Angola","244"],["AG","Antigua & Barbuda","1268"],
    ["AR","Argentina","54"],["AM","Armenia","374"],["AW","Aruba","297"],
    ["AU","Australia","61"],["AT","Austria","43"],["AZ","Azerbaijan","994"],
    ["BS","Bahamas","1242"],["BH","Bahrain","973"],["BD","Bangladesh","880"],
    ["BB","Barbados","1246"],["BY","Belarus","375"],["BE","Belgium","32"],
    ["BZ","Belize","501"],["BJ","Benin","229"],["BM","Bermuda","1441"],
    ["BT","Bhutan","975"],["BO","Bolivia","591"],["BA","Bosnia & Herzegovina","387"],
    ["BW","Botswana","267"],["BR","Brazil","55"],["BN","Brunei","673"],
    ["BG","Bulgaria","359"],["BF","Burkina Faso","226"],["BI","Burundi","257"],
    ["KH","Cambodia","855"],["CM","Cameroon","237"],["CA","Canada","1"],
    ["CV","Cape Verde","238"],["KY","Cayman Islands","1345"],["CF","Central African Rep.","236"],
    ["TD","Chad","235"],["CL","Chile","56"],["CN","China","86"],
    ["CO","Colombia","57"],["KM","Comoros","269"],["CG","Congo","242"],
    ["CD","Congo (DRC)","243"],["CR","Costa Rica","506"],["CI","Côte d'Ivoire","225"],
    ["HR","Croatia","385"],["CU","Cuba","53"],["CW","Curaçao","599"],
    ["CY","Cyprus","357"],["CZ","Czechia","420"],["DK","Denmark","45"],
    ["DJ","Djibouti","253"],["DM","Dominica","1767"],["DO","Dominican Republic","1809"],
    ["EC","Ecuador","593"],["EG","Egypt","20"],["SV","El Salvador","503"],
    ["GQ","Equatorial Guinea","240"],["ER","Eritrea","291"],["EE","Estonia","372"],
    ["SZ","Eswatini","268"],["ET","Ethiopia","251"],["FO","Faroe Islands","298"],
    ["FJ","Fiji","679"],["FI","Finland","358"],["FR","France","33"],
    ["GF","French Guiana","594"],["PF","French Polynesia","689"],["GA","Gabon","241"],
    ["GM","Gambia","220"],["GE","Georgia","995"],["DE","Germany","49"],
    ["GH","Ghana","233"],["GI","Gibraltar","350"],["GR","Greece","30"],
    ["GL","Greenland","299"],["GD","Grenada","1473"],["GP","Guadeloupe","590"],
    ["GU","Guam","1671"],["GT","Guatemala","502"],["GG","Guernsey","44"],
    ["GN","Guinea","224"],["GW","Guinea-Bissau","245"],["GY","Guyana","592"],
    ["HT","Haiti","509"],["HN","Honduras","504"],["HK","Hong Kong","852"],
    ["HU","Hungary","36"],["IS","Iceland","354"],["IN","India","91"],
    ["ID","Indonesia","62"],["IR","Iran","98"],["IQ","Iraq","964"],
    ["IE","Ireland","353"],["IM","Isle of Man","44"],["IL","Israel","972"],
    ["IT","Italy","39"],["JM","Jamaica","1876"],["JP","Japan","81"],
    ["JE","Jersey","44"],["JO","Jordan","962"],["KZ","Kazakhstan","7"],
    ["KE","Kenya","254"],["KI","Kiribati","686"],["XK","Kosovo","383"],
    ["KW","Kuwait","965"],["KG","Kyrgyzstan","996"],["LA","Laos","856"],
    ["LV","Latvia","371"],["LB","Lebanon","961"],["LS","Lesotho","266"],
    ["LR","Liberia","231"],["LY","Libya","218"],["LI","Liechtenstein","423"],
    ["LT","Lithuania","370"],["LU","Luxembourg","352"],["MO","Macau","853"],
    ["MG","Madagascar","261"],["MW","Malawi","265"],["MY","Malaysia","60"],
    ["MV","Maldives","960"],["ML","Mali","223"],["MT","Malta","356"],
    ["MQ","Martinique","596"],["MR","Mauritania","222"],["MU","Mauritius","230"],
    ["MX","Mexico","52"],["MD","Moldova","373"],["MC","Monaco","377"],
    ["MN","Mongolia","976"],["ME","Montenegro","382"],["MA","Morocco","212"],
    ["MZ","Mozambique","258"],["MM","Myanmar","95"],["NA","Namibia","264"],
    ["NP","Nepal","977"],["NL","Netherlands","31"],["NC","New Caledonia","687"],
    ["NZ","New Zealand","64"],["NI","Nicaragua","505"],["NE","Niger","227"],
    ["NG","Nigeria","234"],["MK","North Macedonia","389"],["NO","Norway","47"],
    ["OM","Oman","968"],["PK","Pakistan","92"],["PS","Palestine","970"],
    ["PA","Panama","507"],["PG","Papua New Guinea","675"],["PY","Paraguay","595"],
    ["PE","Peru","51"],["PH","Philippines","63"],["PL","Poland","48"],
    ["PT","Portugal","351"],["PR","Puerto Rico","1787"],["QA","Qatar","974"],
    ["RE","Réunion","262"],["RO","Romania","40"],["RU","Russia","7"],
    ["RW","Rwanda","250"],["KN","Saint Kitts & Nevis","1869"],["LC","Saint Lucia","1758"],
    ["VC","Saint Vincent","1784"],["WS","Samoa","685"],["SM","San Marino","378"],
    ["SA","Saudi Arabia","966"],["SN","Senegal","221"],["RS","Serbia","381"],
    ["SC","Seychelles","248"],["SL","Sierra Leone","232"],["SG","Singapore","65"],
    ["SK","Slovakia","421"],["SI","Slovenia","386"],["SB","Solomon Islands","677"],
    ["SO","Somalia","252"],["ZA","South Africa","27"],["KR","South Korea","82"],
    ["ES","Spain","34"],["LK","Sri Lanka","94"],["SD","Sudan","249"],
    ["SR","Suriname","597"],["SE","Sweden","46"],["CH","Switzerland","41"],
    ["SY","Syria","963"],["TW","Taiwan","886"],["TJ","Tajikistan","992"],
    ["TZ","Tanzania","255"],["TH","Thailand","66"],["TL","Timor-Leste","670"],
    ["TG","Togo","228"],["TO","Tonga","676"],["TT","Trinidad & Tobago","1868"],
    ["TN","Tunisia","216"],["TR","Türkiye","90"],["TM","Turkmenistan","993"],
    ["UG","Uganda","256"],["UA","Ukraine","380"],["AE","United Arab Emirates","971"],
    ["GB","United Kingdom","44"],["US","United States","1"],["UY","Uruguay","598"],
    ["UZ","Uzbekistan","998"],["VU","Vanuatu","678"],["VA","Vatican City","39"],
    ["VE","Venezuela","58"],["VN","Vietnam","84"],["YE","Yemen","967"],
    ["ZM","Zambia","260"],["ZW","Zimbabwe","263"]
  ];

  function flag(iso) {
    return String.fromCodePoint(
      0x1f1e6 + iso.charCodeAt(0) - 65,
      0x1f1e6 + iso.charCodeAt(1) - 65
    );
  }

  /* Best guess at the visitor's country from the browser locale. */
  function guessIso() {
    var langs = (navigator.languages && navigator.languages.length)
      ? navigator.languages : [navigator.language || ""];
    for (var i = 0; i < langs.length; i++) {
      var m = /[-_]([A-Za-z]{2})$/.exec(langs[i]);
      if (m) {
        var iso = m[1].toUpperCase();
        for (var j = 0; j < COUNTRIES.length; j++) {
          if (COUNTRIES[j][0] === iso) return iso;
        }
      }
    }
    return null;
  }

  function byIso(iso) {
    for (var i = 0; i < COUNTRIES.length; i++) {
      if (COUNTRIES[i][0] === iso) return COUNTRIES[i];
    }
    return null;
  }

  function build(wrap) {
    var input = wrap.querySelector('input[type="tel"]');
    var hidden = wrap.querySelector('input[type="hidden"]');
    if (!input || !hidden) return;

    var fallback = (wrap.dataset.default || "GR").toUpperCase();
    var frequent = (wrap.dataset.frequent || "")
      .split(",").map(function (s) { return s.trim().toUpperCase(); })
      .filter(Boolean);

    /* ---- control ---- */
    var cc = document.createElement("div");
    cc.className = "phone-field__cc";

    var display = document.createElement("span");
    display.className = "phone-field__display";
    display.setAttribute("aria-hidden", "true");

    var select = document.createElement("select");
    select.className = "phone-field__select";
    select.setAttribute("aria-label", "Country dialling code");

    function option(c) {
      var o = document.createElement("option");
      o.value = c[0];
      o.dataset.dial = c[2];
      o.textContent = flag(c[0]) + "  " + c[1] + "  +" + c[2];
      return o;
    }

    if (frequent.length) {
      var gTop = document.createElement("optgroup");
      gTop.label = "Frequently booked from";
      frequent.forEach(function (iso) {
        var c = byIso(iso);
        if (c) gTop.appendChild(option(c));
      });
      if (gTop.children.length) select.appendChild(gTop);
    }
    var gAll = document.createElement("optgroup");
    gAll.label = "All countries";
    COUNTRIES.forEach(function (c) { gAll.appendChild(option(c)); });
    select.appendChild(gAll);

    cc.appendChild(display);
    cc.appendChild(select);
    wrap.insertBefore(cc, input);

    /* ---- state ---- */
    function currentDial() {
      var o = select.options[select.selectedIndex];
      return o ? o.dataset.dial : "";
    }

    function paint() {
      var iso = select.value;
      display.innerHTML =
        '<span class="phone-field__flag">' + flag(iso) + "</span>" +
        '<span class="phone-field__dial">+' + currentDial() + "</span>";
    }

    function sync() {
      var typed = input.value.trim();
      if (!typed) { hidden.value = ""; return; }
      /* visitor typed their own international prefix — respect it */
      hidden.value = typed.charAt(0) === "+"
        ? typed
        : "+" + currentDial() + " " + typed.replace(/^0+/, "");
    }

    function selectIso(iso) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === iso) { select.selectedIndex = i; return true; }
      }
      return false;
    }

    selectIso(guessIso() || fallback) || selectIso(fallback);
    paint();
    sync();

    select.addEventListener("change", function () { paint(); sync(); });
    input.addEventListener("input", sync);
    input.addEventListener("blur", sync);

    /* keep the hidden value fresh even if the form is submitted
       programmatically without a preceding blur */
    var form = wrap.closest("form");
    if (form) form.addEventListener("submit", sync, true);
  }

  function init() {
    document.querySelectorAll("[data-phone-field]").forEach(build);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
