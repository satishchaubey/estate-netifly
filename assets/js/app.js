const FALLBACK_LISTINGS = [
  {
    id: "BP-001",
    title: "Appartement moderne - Triangle d'Or",
    zone: "Casablanca",
    type: "Appartement",
    operation: "Location",
    price_mad: 13500,
    meuble: true,
    charges_incluses: true,
    dispo: true,
    bedrooms: 2,
    bathrooms: 2,
    surface_m2: 92,
    images: ["assets/img/BP-001.jpg"],
    highlights: ["Residence securisee", "Parking", "Proche commodites"],
  },
  {
    id: "BP-002",
    title: "Villa premium - Dar Bouazza",
    zone: "Dar Bouazza",
    type: "Villa",
    operation: "Location",
    price_mad: 32000,
    meuble: false,
    charges_incluses: false,
    dispo: true,
    bedrooms: 4,
    bathrooms: 3,
    surface_m2: 280,
    images: ["assets/img/BP-002.jpg"],
    highlights: ["Jardin", "Residence securisee", "Quartier recherche"],
  },
  {
    id: "BP-003",
    title: "Appartement fonctionnel - Bouskoura",
    zone: "Bouskoura",
    type: "Appartement",
    operation: "Location",
    price_mad: 9000,
    meuble: false,
    charges_incluses: true,
    dispo: false,
    bedrooms: 2,
    bathrooms: 1,
    surface_m2: 78,
    images: ["assets/img/BP-003.jpg"],
    highlights: ["Residence verte", "Acces rapide", "Bon rapport qualite/prix"],
  },
  {
    id: "BP-004",
    title: "Villa contemporaine - Benslimane",
    zone: "Benslimane",
    type: "Villa",
    operation: "Vente",
    price_mad: 3450000,
    meuble: false,
    charges_incluses: false,
    dispo: true,
    bedrooms: 5,
    bathrooms: 4,
    surface_m2: 360,
    images: ["assets/img/BP-004.jpg"],
    highlights: ["Volumes", "Calme", "Potentiel investissement"],
  },
  {
    id: "BP-005",
    title: "Studio meuble - Centre-ville",
    zone: "Casablanca",
    type: "Studio",
    operation: "Location",
    price_mad: 6500,
    meuble: true,
    charges_incluses: true,
    dispo: true,
    bedrooms: 1,
    bathrooms: 1,
    surface_m2: 42,
    images: ["assets/img/BP-005.jpg"],
    highlights: ["Pret a vivre", "Wifi inclus", "Ideal mobilite"],
  },
  {
    id: "BP-006",
    title: "Appartement familial - Racine",
    zone: "Casablanca",
    type: "Appartement",
    operation: "Vente",
    price_mad: 2200000,
    meuble: false,
    charges_incluses: false,
    dispo: false,
    bedrooms: 3,
    bathrooms: 2,
    surface_m2: 140,
    images: ["assets/img/BP-006.jpg"],
    highlights: ["Quartier premium", "Lumineux", "Bonne distribution"],
  },
];

const ZONE_LABEL = {
  casablanca: "Casablanca",
  "dar-bouazza": "Dar Bouazza",
  bouskoura: "Bouskoura",
  benslimane: "Benslimane",
};

const TYPE_LABEL = {
  appartement: "Appartement",
  villa: "Villa",
  studio: "Studio",
  terrain: "Terrain",
  bureau: "Bureau",
};

let PROPERTIES = [];

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (["1", "true", "yes", "oui"].includes(v)) return true;
    if (["0", "false", "no", "non"].includes(v)) return false;
  }
  return fallback;
}

function toInt(value, fallback = 0) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeOperation(value) {
  const v = toSlug(value);
  return v === "location" ? "location" : "vente";
}

function normalizeType(value) {
  const slug = toSlug(value);
  if (TYPE_LABEL[slug]) return slug;
  return "appartement";
}

function normalizeZone(value) {
  const slug = toSlug(value);
  if (ZONE_LABEL[slug]) return slug;
  return "casablanca";
}

function normalizeListing(raw) {
  const operation = normalizeOperation(raw.operation);
  const price = toInt(raw.price_mad ?? raw.price, 0);
  const zone = normalizeZone(raw.zone);
  const type = normalizeType(raw.type);
  const images = Array.isArray(raw.images) ? raw.images : [];
  const image = raw.image || images[0] || "assets/img/hero.jpg";

  return {
    id: String(raw.id || "").trim() || `BP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    title: String(raw.title || "Bien immobilier"),
    operation,
    type,
    zone,
    price,
    currency: "MAD",
    period: operation === "location" ? "/mois" : "",
    area: toInt(raw.surface_m2 ?? raw.area, 0),
    beds: toInt(raw.bedrooms ?? raw.beds, 0),
    baths: toInt(raw.bathrooms ?? raw.baths, 0),
    meuble: toBool(raw.meuble, false),
    charges: toBool(raw.charges_incluses ?? raw.charges, false),
    dispo: toBool(raw.dispo, true),
    image,
    highlights: Array.isArray(raw.highlights) ? raw.highlights.filter(Boolean).map(String) : [],
    chargesDetails: {
      wifi: false,
      eau: false,
      electricite: false,
      syndic: false,
    },
  };
}

function normalizeListings(data) {
  const rawItems = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
  const normalized = rawItems.map(normalizeListing);
  return normalized.filter((item) => item.id && item.title);
}

async function loadListings() {
  try {
    const res = await fetch("content/listings.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`bad status: ${res.status}`);
    const json = await res.json();
    const list = normalizeListings(json);
    if (list.length) return list;
    throw new Error("empty listing payload");
  } catch (error) {
    console.warn("Using fallback listings", error);
    return normalizeListings(FALLBACK_LISTINGS);
  }
}

function formatMoney(n) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function badgeHTML(p) {
  const badges = [];
  badges.push(
    p.meuble
      ? '<span class="badge badge-meuble">MEUBLE</span>'
      : '<span class="badge badge-nonmeuble">NON MEUBLE</span>'
  );
  badges.push(
    p.charges
      ? '<span class="badge badge-charges">CHARGES INCLUSES</span>'
      : '<span class="badge badge-standard">STANDARD</span>'
  );
  badges.push(
    p.dispo
      ? '<span class="badge badge-dispo">DISPONIBLE</span>'
      : '<span class="badge badge-indispo">INDISPONIBLE</span>'
  );
  return badges.join("");
}

function listingCard(p) {
  return `
  <article class="listing" data-id="${p.id}">
    <div class="thumb" style="background-image:url('${p.image}')">
      <div class="badges">${badgeHTML(p)}</div>
    </div>
    <div class="l-body">
      <div class="price">
        <strong>${formatMoney(p.price)} ${p.currency}</strong>
        <span>${p.period}</span>
      </div>
      <div class="l-title">${p.title}</div>
      <div class="meta">
        <span><b>${ZONE_LABEL[p.zone] || p.zone}</b></span>
        <span>${p.area} m2</span>
        <span>${p.beds} ch</span>
        <span>${p.baths} sdb</span>
        <span class="small">Ref: ${p.id}</span>
      </div>
      <div class="l-actions">
        <a class="btn btn-ghost" href="property.html?id=${encodeURIComponent(p.id)}">Details</a>
        <a class="btn btn-primary" data-wa="1" href="#">WhatsApp</a>
      </div>
    </div>
  </article>`;
}

function getPropertyById(id) {
  return PROPERTIES.find((p) => p.id === id) || null;
}

function openWhatsApp(message) {
  const phone = window.BAYAN_WHATSAPP || "212600000000";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

function renderListings(targetId, limit = null, filter = null) {
  const el = document.getElementById(targetId);
  if (!el) return;

  let items = [...PROPERTIES];
  if (typeof filter === "function") items = items.filter(filter);
  if (Number.isInteger(limit) && limit > 0) items = items.slice(0, limit);

  el.innerHTML = items.map(listingCard).join("");

  el.querySelectorAll('[data-wa="1"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const card = e.target.closest(".listing");
      const id = card?.dataset?.id || "";
      const p = getPropertyById(id);
      if (!p) return;
      const msg = `Bonjour Bayan Properties, je suis interesse(e) par le bien Ref: ${p.id}. Pouvez-vous me proposer une visite ? Merci.`;
      openWhatsApp(msg);
    });
  });
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function bindGlobalWhatsApp() {
  document.querySelectorAll('[data-wa-global="1"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const msg =
        "Bonjour Bayan Properties, je souhaite des informations et une visite. Voici mon besoin : [Location/Vente], [Zone], [Budget], [Meuble Oui/Non], [Charges incluses Oui/Non].";
      openWhatsApp(msg);
    });
  });
}

function bindOwnerWhatsApp() {
  const msg =
    "Bonjour Bayan Properties, j'ai un bien a proposer.\nType: ...\nOperation: (Location/Vente)\nVille/Quartier: ...\nPrix: ...\nMeuble: Oui/Non\nCharges: Incluses/Standard\nPhotos: (je les envoie ici)\nPouvez-vous me proposer un rendez-vous ? Merci.";

  document.querySelectorAll('[data-wa-owner="1"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openWhatsApp(msg);
    });
  });
}

function bindMobileMenu() {
  const btn = document.getElementById("burgerBtn");
  const drawer = document.getElementById("mobileDrawer");
  if (!btn || !drawer) return;

  const close = () => {
    drawer.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  };

  const open = () => {
    drawer.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
  };

  btn.addEventListener("click", () => {
    if (drawer.classList.contains("is-open")) close();
    else open();
  });

  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", close);
  });

  document.addEventListener("click", (e) => {
    if (!drawer.classList.contains("is-open")) return;
    if (btn.contains(e.target) || drawer.contains(e.target)) return;
    close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function bindFilters() {
  const form = document.getElementById("filtersForm");
  if (!form) return;

  const getVal = (id) => (document.getElementById(id)?.value || "");
  const toNum = (value) => {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
  };

  const apply = () => {
    const operation = getVal("f_operation");
    const type = getVal("f_type");
    const zone = getVal("f_zone");
    const meuble = getVal("f_meuble");
    const charges = getVal("f_charges");
    const dispo = getVal("f_dispo");
    const min = toNum(getVal("f_min"));
    const max = toNum(getVal("f_max"));

    const filter = (p) => {
      if (operation && p.operation !== operation) return false;
      if (type && p.type !== type) return false;
      if (zone && p.zone !== zone) return false;
      if (meuble && p.meuble !== (meuble === "oui")) return false;
      if (charges && p.charges !== (charges === "oui")) return false;
      if (dispo && p.dispo !== (dispo === "oui")) return false;
      if (min !== null && p.price < min) return false;
      if (max !== null && p.price > max) return false;
      return true;
    };

    renderListings("listingsGrid", null, filter);
  };

  form.addEventListener("change", apply);
  form.addEventListener("input", (e) => {
    if (["f_min", "f_max"].includes(e.target.id)) apply();
  });

  document.getElementById("f_reset")?.addEventListener("click", (e) => {
    e.preventDefault();
    form.reset();
    apply();
  });

  apply();
}

function renderPropertyDetail() {
  const wrap = document.getElementById("propertyDetail");
  if (!wrap) return;

  const id = getParam("id");
  const p = getPropertyById(id);
  if (!p) {
    wrap.innerHTML = '<section class="section"><div class="container"><div class="card"><h2>Bien introuvable</h2><p>La reference demandee n\'existe pas.</p></div></div></section>';
    return;
  }

  const highlights = p.highlights.length
    ? `<ul>${p.highlights.map((point) => `<li>${point}</li>`).join("")}</ul>`
    : "<p>Plus de details disponibles sur demande.</p>";

  const chargesBlock = p.charges
    ? `<p><b>Charges:</b> incluses (details exacts confirmes lors de la visite).</p>`
    : "<p><b>Charges:</b> standard (selon consommation et residence).</p>";

  wrap.innerHTML = `
  <section class="section">
    <div class="container">
      <div class="row" style="align-items:flex-start">
        <div style="flex:1.5;min-width:320px">
          <div class="listing" style="border-radius:22px">
            <div class="thumb" style="aspect-ratio:16/9;background-image:url('${p.image}')">
              <div class="badges">${badgeHTML(p)}</div>
            </div>
            <div class="l-body">
              <div class="price">
                <strong>${formatMoney(p.price)} ${p.currency}</strong>
                <span>${p.period}</span>
              </div>
              <div class="l-title" style="font-size:18px">${p.title}</div>
              <div class="meta">
                <span><b>${ZONE_LABEL[p.zone] || p.zone}</b></span>
                <span>${p.area} m2</span>
                <span>${p.beds} ch</span>
                <span>${p.baths} sdb</span>
                <span class="small">Ref: ${p.id}</span>
              </div>
              <div class="l-actions">
                <a class="btn btn-primary" id="waProperty" href="#">WhatsApp - Visite</a>
                <a class="btn btn-secondary" href="listings.html">Retour aux biens</a>
              </div>
            </div>
          </div>
        </div>

        <div style="flex:1;min-width:300px">
          <div class="card" style="border-radius:22px">
            <h2 style="margin-top:0">Caracteristiques</h2>
            <p class="sub" style="margin-top:-6px">Informations cles pour une visite efficace.</p>
            <div class="row" style="gap:10px">
              <div class="kpi" style="flex:1"><strong>${p.area} m2</strong><span>Surface</span></div>
              <div class="kpi" style="flex:1"><strong>${p.beds}</strong><span>Chambres</span></div>
              <div class="kpi" style="flex:1"><strong>${p.baths}</strong><span>Salles de bain</span></div>
            </div>
            <hr style="border:none;border-top:1px solid var(--line);margin:14px 0">
            <h3 style="margin:0 0 8px;color:var(--navy)">Disponibilite</h3>
            <p style="margin:0"><b>${p.dispo ? "Disponible" : "Indisponible"}</b> - ${p.dispo ? "Visites possibles sur rendez-vous." : "Ce bien n'est plus disponible pour le moment."}</p>
            <hr style="border:none;border-top:1px solid var(--line);margin:14px 0">
            <h3 style="margin:0 0 8px;color:var(--navy)">Charges</h3>
            ${chargesBlock}
            <hr style="border:none;border-top:1px solid var(--line);margin:14px 0">
            <h3 style="margin:0 0 8px;color:var(--navy)">Points forts</h3>
            ${highlights}
          </div>
        </div>
      </div>
    </div>
  </section>`;

  document.getElementById("waProperty")?.addEventListener("click", (e) => {
    e.preventDefault();
    const msg = `Bonjour Bayan Properties, je suis interesse(e) par le bien Ref: ${p.id}. Pouvez-vous me proposer une visite ? Merci.`;
    openWhatsApp(msg);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  PROPERTIES = await loadListings();

  bindMobileMenu();
  bindGlobalWhatsApp();
  bindOwnerWhatsApp();

  renderListings("featuredGrid", 6);
  renderListings("listingsGrid", null);

  bindFilters();
  renderPropertyDetail();
});