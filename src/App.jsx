import { useState, useRef, useCallback, useEffect } from "react";

const CATEGORIES = ["Tops", "Bottoms", "Shoes", "Outerwear", "Accessories", "Dresses"];

const CATEGORY_ICONS = {
  Tops: "👕", Bottoms: "👖", Shoes: "👟",
  Outerwear: "🧥", Accessories: "👜", Dresses: "👗",
};

const CATEGORY_COLORS = {
  Tops:        { bg: "#FFF0F5", badge: "#FF6B9D", text: "#c2185b" },
  Bottoms:     { bg: "#EEF2FF", badge: "#818CF8", text: "#4338ca" },
  Shoes:       { bg: "#FFF7ED", badge: "#FB923C", text: "#c2410c" },
  Outerwear:   { bg: "#F0FDF4", badge: "#4ADE80", text: "#15803d" },
  Accessories: { bg: "#FEFCE8", badge: "#FACC15", text: "#a16207" },
  Dresses:     { bg: "#FDF4FF", badge: "#E879F9", text: "#a21caf" },
};

const OUTFIT_COMBOS = [
  ["Tops", "Bottoms", "Shoes", "Outerwear", "Accessories"],
  ["Tops", "Bottoms", "Shoes", "Accessories"],
  ["Tops", "Bottoms", "Shoes", "Outerwear"],
  ["Tops", "Bottoms", "Shoes"],
  ["Dresses", "Shoes", "Accessories"],
  ["Dresses", "Shoes"],
  ["Tops", "Bottoms"],
  ["Dresses"],
  ["Tops"],
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function loadFromStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { console.warn("localStorage save failed:", e); }
}

export default function DigitalCloset() {
  const [clothes, setClothes]           = useState(() => loadFromStorage("vetuu_clothes", []));
  const [savedOutfits, setSavedOutfits] = useState(() => loadFromStorage("vetuu_saved_outfits", []));
  const [activeTab, setActiveTab]       = useState("closet");
  const [filterCat, setFilterCat]       = useState("All");
  const [outfit, setOutfit]             = useState(null);
  const [outfitMsg, setOutfitMsg]       = useState("");
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadName, setUploadName]     = useState("");
  const [uploadCat, setUploadCat]       = useState(CATEGORIES[0]);
  const [uploadTags, setUploadTags]     = useState("");
  const [dragOver, setDragOver]         = useState(false);
  const [savedFlash, setSavedFlash]     = useState(false);
  const fileRef = useRef();

  useEffect(() => { saveToStorage("vetuu_clothes", clothes); }, [clothes]);
  useEffect(() => { saveToStorage("vetuu_saved_outfits", savedOutfits); }, [savedOutfits]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setUploadPreview(e.target.result);
    reader.readAsDataURL(file);
    setUploadName(file.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const addClothing = () => {
    if (!uploadPreview || !uploadName.trim()) return;
    const tags = uploadTags.split(",").map((t) => t.trim()).filter(Boolean);
    setClothes((prev) => [
      ...prev,
      { id: Date.now(), name: uploadName, category: uploadCat, image: uploadPreview, tags },
    ]);
    setUploadPreview(null);
    setUploadName("");
    setUploadCat(CATEGORIES[0]);
    setUploadTags("");
    setActiveTab("closet");
  };

  const removeClothing = (id) => setClothes((prev) => prev.filter((c) => c.id !== id));

  const generateOutfit = () => {
    setOutfitMsg("");
    if (clothes.length === 0) {
      setOutfitMsg("Your closet is empty — add some clothes first!");
      setOutfit(null);
      setActiveTab("outfit");
      return;
    }
    const byCat = {};
    clothes.forEach((c) => {
      byCat[c.category] = byCat[c.category] ? [...byCat[c.category], c] : [c];
    });
    const matched = OUTFIT_COMBOS.find((combo) =>
      combo.every((cat) => byCat[cat] && byCat[cat].length > 0)
    );
    if (matched) {
      setOutfit(matched.map((cat) => pickRandom(byCat[cat])));
    } else {
      setOutfit(Object.values(byCat).map((items) => pickRandom(items)));
    }
    setActiveTab("outfit");
  };

  const saveOutfit = () => {
    if (!outfit) return;
    setSavedOutfits((prev) => [
      { id: Date.now(), items: outfit, date: new Date().toLocaleDateString() },
      ...prev,
    ]);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const deleteOutfit = (id) => setSavedOutfits((prev) => prev.filter((o) => o.id !== id));

  const filtered  = filterCat === "All" ? clothes : clothes.filter((c) => c.category === filterCat);
  const catCounts = {};
  clothes.forEach((c) => { catCounts[c.category] = (catCounts[c.category] || 0) + 1; });

  const NAV_TABS = [
    { id: "closet", icon: "🪞", label: "My Closet" },
    { id: "upload", icon: "📸", label: "Add Item" },
    { id: "outfit", icon: "✨", label: "Outfit" },
    { id: "saved",  icon: "🔖", label: "Saved" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body, #root {
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #FBF8F5;
        }

        .app-canvas {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
        }
        .soft-circle { position: absolute; border-radius: 50%; animation: softDrift 18s ease-in-out infinite alternate; }
        .sc1 { width: 600px; height: 600px; background: radial-gradient(circle, #FDDDE6 0%, transparent 70%); top: -180px; left: -140px; animation-delay: 0s; }
        .sc2 { width: 500px; height: 500px; background: radial-gradient(circle, #E0E7FF 0%, transparent 70%); top: 15%; right: -140px; animation-delay: 5s; }
        .sc3 { width: 450px; height: 450px; background: radial-gradient(circle, #D1FAE5 0%, transparent 70%); bottom: -120px; left: 20%; animation-delay: 10s; }
        .sc4 { width: 320px; height: 320px; background: radial-gradient(circle, #FEF3C7 0%, transparent 70%); bottom: 18%; right: 8%; animation-delay: 7s; }
        @keyframes softDrift {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(20px,18px) scale(1.06); }
        }

        .app { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 0 20px 80px; }

        /* HEADER */
        .header {
          padding: 36px 0 26px;
          display: flex; align-items: flex-end; justify-content: space-between;
          flex-wrap: wrap; gap: 20px; margin-bottom: 26px;
          border-bottom: 1.5px solid #EDE8E3;
        }
        .header-brand { display: flex; align-items: center; gap: 16px; }
        .header-logo {
          width: 58px; height: 58px; border-radius: 20px;
          background: linear-gradient(145deg, #FFB5CB, #C7B8FA);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; box-shadow: 0 6px 24px rgba(199,184,250,.45); flex-shrink: 0;
        }
        .header-text h1 {
          font-family: 'Cormorant Garamond', serif; font-size: 2.4rem; font-weight: 700;
          color: #2D2017; letter-spacing: -0.5px; line-height: 1;
        }
        .header-text p { font-size: .8rem; color: #AFA298; margin-top: 3px; }
        .storage-badge {
          display: inline-flex; align-items: center; gap: 4px; margin-top: 6px;
          background: #F0FDF4; border: 1px solid #BBF7D0; color: #16A34A;
          border-radius: 50px; padding: 3px 10px; font-size: .67rem; font-weight: 600;
        }
        .header-stats { display: flex; gap: 10px; }
        .stat-pill {
          background: #fff; border: 1.5px solid #EDE8E3; border-radius: 18px;
          padding: 12px 22px; text-align: center; box-shadow: 0 2px 12px rgba(45,32,23,.05);
        }
        .stat-pill .num { font-family:'Cormorant Garamond',serif; font-size:1.7rem; font-weight:700; color:#2D2017; line-height:1; }
        .stat-pill .lbl { font-size:.65rem; color:#C2B5AC; text-transform:uppercase; letter-spacing:1.2px; margin-top:2px; }

        /* NAV */
        .nav { display:flex; gap:6px; margin-bottom:28px; flex-wrap:wrap; }
        .nav-btn {
          flex:1; min-width:110px; border:1.5px solid #EDE8E3; background:#fff;
          border-radius:50px; padding:10px 18px; font-family:'Plus Jakarta Sans',sans-serif;
          font-size:.82rem; font-weight:600; color:#AFA298; cursor:pointer; transition:all .2s;
          display:flex; align-items:center; justify-content:center; gap:6px;
          box-shadow:0 2px 8px rgba(45,32,23,.04);
        }
        .nav-btn.active { background:#2D2017; color:#fff; border-color:#2D2017; box-shadow:0 4px 18px rgba(45,32,23,.22); }
        .nav-btn:hover:not(.active) { border-color:#C2B5AC; color:#6B5344; background:#FDFAF8; }

        /* FILTERS */
        .filter-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:22px; }
        .fpill {
          border:1.5px solid transparent; border-radius:50px; padding:6px 16px;
          font-size:.78rem; font-weight:600; cursor:pointer; transition:all .2s;
          font-family:'Plus Jakarta Sans',sans-serif;
        }

        /* GRID */
        .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(155px,1fr)); gap:14px; }
        .cloth-card {
          border-radius:22px; overflow:hidden; background:#fff;
          border:1.5px solid #EDE8E3; box-shadow:0 3px 14px rgba(45,32,23,.07);
          transition:transform .22s,box-shadow .22s; position:relative;
        }
        .cloth-card:hover { transform:translateY(-5px); box-shadow:0 12px 32px rgba(45,32,23,.13); }
        .cloth-card:hover .del-btn { opacity:1; }
        .cloth-img { width:100%; height:150px; object-fit:cover; display:block; }
        .cloth-info { padding:10px 12px 13px; }
        .cloth-name { font-weight:600; font-size:.82rem; color:#2D2017; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .cat-badge { display:inline-block; font-size:.69rem; padding:3px 10px; border-radius:50px; font-weight:600; }
        .tags-row { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
        .tag-chip { background:#F5F0EC; color:#AFA298; border-radius:50px; font-size:.67rem; padding:2px 8px; font-weight:500; }
        .del-btn {
          position:absolute; top:8px; right:8px;
          background:rgba(255,255,255,.92); border:1.5px solid #EDE8E3; color:#AFA298;
          border-radius:50%; width:26px; height:26px; font-size:.72rem;
          cursor:pointer; opacity:0; transition:all .18s;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 2px 8px rgba(45,32,23,.1);
        }
        .del-btn:hover { background:#FFF0F0; border-color:#FFCDD2; color:#E53935; }

        /* PANELS */
        .panel {
          background:#fff; border:1.5px solid #EDE8E3; border-radius:24px; padding:26px;
          box-shadow:0 4px 20px rgba(45,32,23,.06);
        }
        .panel-title { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:700; color:#2D2017; margin-bottom:18px; }

        /* DROP ZONE */
        .drop-zone {
          border:2px dashed #D9D0C8; border-radius:18px; background:#FDFAF8;
          transition:all .22s; cursor:pointer; min-height:165px;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; overflow:hidden;
        }
        .drop-zone.drag-active { border-color:#C7B8FA; background:#F5F0FF; transform:scale(1.01); }
        .drop-zone img { width:100%; height:200px; object-fit:cover; border-radius:14px; }
        .dz-icon { font-size:2.4rem; }
        .dz-text { font-weight:600; color:#AFA298; font-size:.88rem; }
        .dz-sub  { font-size:.76rem; color:#C2B5AC; }

        /* FORM */
        .flabel { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.9px; color:#C2B5AC; margin-bottom:6px; display:block; }
        .finput,.fselect {
          width:100%; border:1.5px solid #E8E1D9; border-radius:12px;
          padding:10px 14px; font-family:'Plus Jakarta Sans',sans-serif; font-size:.86rem;
          color:#2D2017; outline:none; transition:border-color .2s,box-shadow .2s; background:#FDFAF8;
        }
        .finput::placeholder { color:#C2B5AC; }
        .finput:focus,.fselect:focus { border-color:#C7B8FA; box-shadow:0 0 0 3px rgba(199,184,250,.15); background:#fff; }

        .btn-add {
          width:100%; background:linear-gradient(135deg,#FFB5CB,#C7B8FA);
          color:#2D2017; border:none; border-radius:14px; padding:13px;
          font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:.9rem;
          cursor:pointer; transition:all .22s; margin-top:4px;
          box-shadow:0 4px 18px rgba(199,184,250,.4);
        }
        .btn-add:hover { transform:translateY(-2px); box-shadow:0 8px 26px rgba(199,184,250,.55); }
        .btn-add:disabled { background:#F0EBE6; box-shadow:none; cursor:not-allowed; transform:none; color:#C2B5AC; }

        /* OUTFIT PANEL */
        .outfit-panel {
          background:linear-gradient(145deg,#FFF5F8,#F5F0FF,#F0FDF9);
          border:1.5px solid #EDE8E3; border-radius:28px; padding:32px; margin-bottom:22px;
          box-shadow:0 6px 32px rgba(45,32,23,.07);
        }
        .outfit-panel h2 { font-family:'Cormorant Garamond',serif; font-size:1.8rem; font-weight:700; color:#2D2017; margin-bottom:4px; }
        .outfit-panel > p { font-size:.8rem; color:#AFA298; margin-bottom:28px; }

        .outfit-grid { display:flex; gap:14px; flex-wrap:wrap; justify-content:center; margin-bottom:28px; }
        .oitem {
          background:#fff; border:1.5px solid #EDE8E3;
          border-radius:20px; overflow:hidden; width:148px;
          box-shadow:0 3px 14px rgba(45,32,23,.08); transition:transform .22s,box-shadow .22s;
        }
        .oitem:hover { transform:scale(1.05) rotate(-1deg); box-shadow:0 10px 28px rgba(45,32,23,.14); }
        .oitem img { width:100%; height:138px; object-fit:cover; display:block; }
        .oitem-info { padding:10px 11px; }
        .oitem-cat { font-size:.67rem; color:#C2B5AC; text-transform:uppercase; letter-spacing:1px; margin-bottom:3px; }
        .oitem-name { font-size:.8rem; font-weight:600; color:#2D2017; }

        .outfit-actions { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }

        .btn-gen {
          background:#2D2017; color:#fff; border:none; border-radius:50px; padding:12px 28px;
          font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:.88rem;
          cursor:pointer; transition:all .22s; box-shadow:0 4px 18px rgba(45,32,23,.25);
        }
        .btn-gen:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(45,32,23,.35); background:#3D2E22; }

        .btn-sav {
          background:#fff; border:1.5px solid #EDE8E3; color:#6B5344;
          border-radius:50px; padding:12px 28px;
          font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:.88rem;
          cursor:pointer; transition:all .22s; box-shadow:0 2px 10px rgba(45,32,23,.07);
        }
        .btn-sav:hover { border-color:#C2B5AC; transform:translateY(-2px); }
        .btn-sav.flash { background:#D1FAE5; border-color:#6EE7B7; color:#065F46; }

        /* GEN BANNER */
        .gen-banner {
          margin-top:28px; background:linear-gradient(135deg,#FFF5F8,#F5F0FF);
          border:1.5px solid #EDE8E3; border-radius:22px; padding:22px 28px;
          display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px;
          box-shadow:0 3px 16px rgba(45,32,23,.06);
        }
        .gen-banner-text { color:#6B5344; font-size:.88rem; font-weight:500; }
        .gen-banner-text strong { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:700; color:#2D2017; display:block; margin-bottom:2px; }

        /* SAVED CARDS */
        .saved-card {
          background:#fff; border:1.5px solid #EDE8E3; border-radius:22px; padding:22px;
          box-shadow:0 3px 14px rgba(45,32,23,.06); margin-bottom:14px; transition:border-color .2s,box-shadow .2s;
        }
        .saved-card:hover { border-color:#C7B8FA; box-shadow:0 6px 24px rgba(45,32,23,.1); }
        .saved-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
        .saved-head-title { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:700; color:#2D2017; }
        .saved-head-right { display:flex; align-items:center; gap:10px; }
        .saved-head-date { font-size:.74rem; color:#C2B5AC; }
        .saved-del-btn { background:none; border:none; color:#D9D0C8; font-size:.85rem; cursor:pointer; transition:all .18s; padding:4px 8px; border-radius:8px; }
        .saved-del-btn:hover { color:#E53935; background:#FFF0F0; }
        .saved-items { display:flex; gap:12px; flex-wrap:wrap; }
        .sitem { width:82px; text-align:center; }
        .sitem img { width:82px; height:82px; object-fit:cover; border-radius:14px; margin-bottom:4px; display:block; border:1.5px solid #EDE8E3; }
        .sitem-name { font-size:.68rem; color:#AFA298; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        /* EMPTY */
        .empty { text-align:center; padding:64px 24px; }
        .empty-icon  { font-size:3.5rem; margin-bottom:14px; }
        .empty-title { font-family:'Cormorant Garamond',serif; font-size:1.4rem; font-weight:700; color:#6B5344; margin-bottom:6px; }
        .empty p { font-size:.84rem; color:#AFA298; }

        /* ERROR */
        .err-msg {
          background:#FFF5F5; border:1.5px solid #FFCDD2; color:#C62828;
          border-radius:14px; padding:12px 16px; font-size:.84rem;
          margin-bottom:16px; text-align:center; font-weight:500;
        }

        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
        .form-gap { display:flex; flex-direction:column; gap:14px; }
        .small-link { background:none; border:none; color:#C2B5AC; font-size:.78rem; cursor:pointer; margin-top:8px; font-family:'Plus Jakarta Sans',sans-serif; transition:color .18s; }
        .small-link:hover { color:#AFA298; }

        @media(max-width:640px){
          .header { flex-direction:column; align-items:flex-start; }
          .two-col { grid-template-columns:1fr; }
          .nav-btn { font-size:.76rem; padding:9px 10px; }
        }
      `}</style>

      <div className="app-canvas">
        <div className="soft-circle sc1" /><div className="soft-circle sc2" />
        <div className="soft-circle sc3" /><div className="soft-circle sc4" />
      </div>

      <div className="app">

        {/* HEADER */}
        <div className="header">
          <div className="header-brand">
            <div className="header-logo">✨</div>
            <div className="header-text">
              <h1>OutfitCheck</h1>
              <p>Your wardrobe, curated.</p>
              <div className="storage-badge">💾 Auto-saved to your browser</div>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-pill"><div className="num">{clothes.length}</div><div className="lbl">Items</div></div>
            <div className="stat-pill"><div className="num">{Object.keys(catCounts).length}</div><div className="lbl">Categories</div></div>
            <div className="stat-pill"><div className="num">{savedOutfits.length}</div><div className="lbl">Saved</div></div>
          </div>
        </div>

        {/* NAV */}
        <div className="nav">
          {NAV_TABS.map((t) => (
            <button key={t.id} className={`nav-btn ${activeTab===t.id?"active":""}`} onClick={() => setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* CLOSET */}
        {activeTab === "closet" && (
          <div>
            <div className="filter-row">
              <button className="fpill"
                style={filterCat==="All"
                  ? {background:"#2D2017",color:"#fff",borderColor:"#2D2017"}
                  : {background:"#fff",color:"#AFA298",borderColor:"#EDE8E3"}}
                onClick={() => setFilterCat("All")}>
                All ({clothes.length})
              </button>
              {CATEGORIES.filter((c) => catCounts[c]).map((cat) => (
                <button key={cat} className="fpill"
                  style={filterCat===cat
                    ? {background:CATEGORY_COLORS[cat].bg,color:CATEGORY_COLORS[cat].text,borderColor:CATEGORY_COLORS[cat].badge+"55",boxShadow:`0 3px 12px ${CATEGORY_COLORS[cat].badge}25`}
                    : {background:"#fff",color:"#AFA298",borderColor:"#EDE8E3"}}
                  onClick={() => setFilterCat(cat)}>
                  {CATEGORY_ICONS[cat]} {cat} ({catCounts[cat]})
                </button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">👚</div>
                <div className="empty-title">Your closet is empty</div>
                <p>Add some clothes to get started!</p>
                <button className="btn-gen" style={{marginTop:20}} onClick={() => setActiveTab("upload")}>+ Add First Item</button>
              </div>
            ) : (
              <>
                <div className="grid">
                  {filtered.map((item) => (
                    <div key={item.id} className="cloth-card">
                      <img src={item.image} alt={item.name} className="cloth-img" />
                      <button className="del-btn" onClick={() => removeClothing(item.id)}>✕</button>
                      <div className="cloth-info">
                        <div className="cloth-name">{item.name}</div>
                        <span className="cat-badge" style={{background:CATEGORY_COLORS[item.category]?.bg,color:CATEGORY_COLORS[item.category]?.text}}>
                          {CATEGORY_ICONS[item.category]} {item.category}
                        </span>
                        {item.tags.length > 0 && (
                          <div className="tags-row">
                            {item.tags.slice(0,3).map((tag,i) => <span key={i} className="tag-chip">#{tag}</span>)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="gen-banner">
                  <div className="gen-banner-text">
                    <strong>Ready to style? 🎨</strong>
                    Let us mix & match your pieces into a perfect look.
                  </div>
                  <button className="btn-gen" onClick={generateOutfit}>🎲 Generate Outfit</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* UPLOAD */}
        {activeTab === "upload" && (
          <div className="two-col">
            <div className="panel">
              <div className="panel-title">📸 Upload Photo</div>
              <div className={`drop-zone ${dragOver?"drag-active":""}`}
                onClick={() => fileRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}>
                {uploadPreview
                  ? <img src={uploadPreview} alt="preview" />
                  : <div style={{textAlign:"center",padding:26}}>
                      <div className="dz-icon">📸</div>
                      <div className="dz-text">Drop photo here</div>
                      <div className="dz-sub">or click to browse</div>
                    </div>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
                onChange={(e) => handleFile(e.target.files[0])} />
              {uploadPreview && <button className="small-link" onClick={() => setUploadPreview(null)}>✕ Remove photo</button>}
            </div>
            <div className="panel">
              <div className="panel-title">🏷️ Item Details</div>
              <div className="form-gap">
                <div>
                  <label className="flabel">Item Name *</label>
                  <input className="finput" placeholder="e.g. White Linen Shirt" value={uploadName} onChange={(e) => setUploadName(e.target.value)} />
                </div>
                <div>
                  <label className="flabel">Category *</label>
                  <select className="fselect" value={uploadCat} onChange={(e) => setUploadCat(e.target.value)}>
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flabel">Tags (comma-separated)</label>
                  <input className="finput" placeholder="e.g. casual, summer, blue" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} />
                </div>
                <button className="btn-add" disabled={!uploadPreview||!uploadName.trim()} onClick={addClothing}>+ Add to Closet</button>
              </div>
            </div>
          </div>
        )}

        {/* OUTFIT */}
        {activeTab === "outfit" && (
          <div>
            {outfitMsg && <div className="err-msg">⚠️ {outfitMsg}</div>}
            <div className="outfit-panel">
              <h2>Today's Look ✨</h2>
              <p>{outfit ? `${outfit.length}-piece outfit — click regenerate for a new combo` : "Hit generate to style your outfit"}</p>
              {outfit ? (
                <div className="outfit-grid">
                  {outfit.map((item) => (
                    <div key={item.id} className="oitem">
                      <img src={item.image} alt={item.name} />
                      <div className="oitem-info">
                        <div className="oitem-cat">{CATEGORY_ICONS[item.category]} {item.category}</div>
                        <div className="oitem-name">{item.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign:"center",padding:"40px 0",fontSize:"3.5rem",opacity:.2}}>👗</div>
              )}
              <div className="outfit-actions">
                <button className="btn-gen" onClick={generateOutfit}>🎲 {outfit?"Regenerate":"Generate Outfit"}</button>
                {outfit && (
                  <button className={`btn-sav ${savedFlash?"flash":""}`} onClick={saveOutfit}>
                    {savedFlash ? "✓ Saved!" : "🔖 Save Outfit"}
                  </button>
                )}
              </div>
            </div>
            {clothes.length === 0 && (
              <div className="empty">
                <div className="empty-icon">🧺</div>
                <div className="empty-title">No clothes yet</div>
                <p>Add items to your closet first</p>
                <button className="btn-gen" style={{marginTop:20}} onClick={() => setActiveTab("upload")}>+ Add Clothes</button>
              </div>
            )}
          </div>
        )}

        {/* SAVED */}
        {activeTab === "saved" && (
          <div>
            {savedOutfits.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🔖</div>
                <div className="empty-title">No saved outfits yet</div>
                <p>Generate an outfit and save it to see it here</p>
                <button className="btn-gen" style={{marginTop:20}} onClick={generateOutfit}>Generate Outfit</button>
              </div>
            ) : (
              savedOutfits.map((saved, idx) => (
                <div key={saved.id} className="saved-card">
                  <div className="saved-head">
                    <div className="saved-head-title">✨ Outfit #{savedOutfits.length - idx}</div>
                    <div className="saved-head-right">
                      <div className="saved-head-date">📅 {saved.date}</div>
                      <button className="saved-del-btn" onClick={() => deleteOutfit(saved.id)} title="Delete outfit">🗑️</button>
                    </div>
                  </div>
                  <div className="saved-items">
                    {saved.items.map((item) => (
                      <div key={item.id} className="sitem">
                        <img src={item.image} alt={item.name} />
                        <div className="sitem-name">{item.name}</div>
                        <span className="cat-badge" style={{fontSize:".63rem",background:CATEGORY_COLORS[item.category]?.bg,color:CATEGORY_COLORS[item.category]?.text,padding:"2px 7px"}}>
                          {CATEGORY_ICONS[item.category]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </>
  );
}