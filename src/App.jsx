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

// ── localStorage helpers ──────────────────────────────────────────────────
function loadFromStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage save failed:", e);
  }
}

export default function DigitalCloset() {
  // ── Load initial state from localStorage ──
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

  // ── Auto-save to localStorage whenever data changes ──
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body, #root { background: #FAF7F4; min-height: 100vh; font-family: 'DM Sans', sans-serif; }

        .app { max-width: 1100px; margin: 0 auto; padding: 0 16px 60px; }

        .header {
          background: linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);
          color: #fff; padding: 26px 32px 22px;
          border-radius: 0 0 28px 28px; margin-bottom: 22px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 14px; box-shadow: 0 8px 32px rgba(15,52,96,.18);
        }
        .header h1 { font-family:'Playfair Display',serif; font-size:1.9rem; letter-spacing:-.5px; margin-bottom:2px; }
        .header p  { font-size:.83rem; opacity:.6; font-weight:300; }
        .header-stats { display:flex; gap:14px; flex-wrap:wrap; }
        .stat-pill {
          background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.15);
          border-radius:50px; padding:7px 16px; text-align:center; backdrop-filter:blur(8px);
        }
        .stat-pill .num { font-family:'Playfair Display',serif; font-size:1.3rem; font-weight:700; line-height:1; }
        .stat-pill .lbl { font-size:.68rem; opacity:.55; text-transform:uppercase; letter-spacing:1px; }

        .nav {
          display:flex; gap:6px; background:#fff; border-radius:14px;
          padding:5px; box-shadow:0 2px 12px rgba(0,0,0,.06); margin-bottom:22px; flex-wrap:wrap;
        }
        .nav-btn {
          flex:1; min-width:110px; border:none; background:transparent; border-radius:10px;
          padding:9px 12px; font-family:'DM Sans',sans-serif; font-size:.85rem; font-weight:500;
          color:#888; cursor:pointer; transition:all .18s;
          display:flex; align-items:center; justify-content:center; gap:5px;
        }
        .nav-btn.active { background:#1a1a2e; color:#fff; box-shadow:0 2px 8px rgba(26,26,46,.25); }
        .nav-btn:hover:not(.active) { background:#f5f5f5; color:#333; }

        .filter-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; }
        .fpill {
          border:none; border-radius:50px; padding:5px 14px;
          font-size:.8rem; font-weight:500; cursor:pointer;
          transition:all .18s; font-family:'DM Sans',sans-serif;
        }

        .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(148px,1fr)); gap:12px; }
        .cloth-card {
          border-radius:16px; overflow:hidden; background:#fff;
          box-shadow:0 2px 10px rgba(0,0,0,.07);
          transition:transform .2s,box-shadow .2s; position:relative;
        }
        .cloth-card:hover { transform:translateY(-4px); box-shadow:0 8px 22px rgba(0,0,0,.13); }
        .cloth-card:hover .del-btn { opacity:1; }
        .cloth-img { width:100%; height:145px; object-fit:cover; display:block; }
        .cloth-info { padding:9px 11px; }
        .cloth-name { font-weight:500; font-size:.83rem; color:#1a1a2e; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .cat-badge { display:inline-block; font-size:.7rem; padding:2px 9px; border-radius:50px; font-weight:500; }
        .tags-row { display:flex; flex-wrap:wrap; gap:3px; margin-top:5px; }
        .tag-chip { background:#f3f3f3; color:#777; border-radius:50px; font-size:.67rem; padding:1px 7px; }
        .del-btn {
          position:absolute; top:7px; right:7px;
          background:rgba(0,0,0,.55); border:none; color:#fff;
          border-radius:50%; width:24px; height:24px; font-size:.75rem;
          cursor:pointer; opacity:0; transition:opacity .18s;
          display:flex; align-items:center; justify-content:center;
        }

        .panel { background:#fff; border-radius:18px; padding:22px; box-shadow:0 2px 12px rgba(0,0,0,.06); }
        .panel-title { font-family:'Playfair Display',serif; font-size:1.15rem; color:#1a1a2e; margin-bottom:14px; }

        .drop-zone {
          border:2px dashed #d4c5f0; border-radius:18px; background:#faf7ff;
          transition:all .2s; cursor:pointer; min-height:155px;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; overflow:hidden;
        }
        .drop-zone.drag-active { border-color:#9b59b6; background:#f3e8ff; transform:scale(1.01); }
        .drop-zone img { width:100%; height:195px; object-fit:cover; border-radius:16px; }
        .dz-icon { font-size:2.4rem; }
        .dz-text { font-weight:500; color:#666; font-size:.88rem; }
        .dz-sub  { font-size:.77rem; color:#bbb; }

        .flabel { font-size:.78rem; font-weight:600; text-transform:uppercase; letter-spacing:.7px; color:#999; margin-bottom:5px; display:block; }
        .finput,.fselect {
          width:100%; border:1.5px solid #ececec; border-radius:11px;
          padding:9px 13px; font-family:'DM Sans',sans-serif; font-size:.87rem;
          color:#1a1a2e; outline:none; transition:border-color .18s; background:#fafafa;
        }
        .finput:focus,.fselect:focus { border-color:#9b59b6; background:#fff; }

        .btn-add {
          width:100%; background:#1a1a2e; color:#fff; border:none;
          border-radius:12px; padding:12px; font-family:'DM Sans',sans-serif;
          font-weight:500; font-size:.88rem; cursor:pointer; transition:all .2s; margin-top:4px;
        }
        .btn-add:hover { background:#2d1b69; transform:translateY(-1px); }
        .btn-add:disabled { background:#ccc; cursor:not-allowed; transform:none; }

        .outfit-panel {
          background:linear-gradient(135deg,#1a1a2e 0%,#2d1b69 100%);
          border-radius:22px; padding:28px; color:#fff; margin-bottom:20px;
        }
        .outfit-panel h2 { font-family:'Playfair Display',serif; font-size:1.5rem; margin-bottom:4px; }
        .outfit-panel p  { font-size:.8rem; opacity:.5; margin-bottom:24px; }

        .outfit-grid { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; margin-bottom:24px; }
        .oitem {
          background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.13);
          border-radius:16px; overflow:hidden; width:145px;
          backdrop-filter:blur(8px); transition:transform .2s;
        }
        .oitem:hover { transform:scale(1.04); }
        .oitem img { width:100%; height:135px; object-fit:cover; display:block; }
        .oitem-info { padding:9px 10px; }
        .oitem-cat  { font-size:.68rem; opacity:.5; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px; }
        .oitem-name { font-size:.8rem; font-weight:500; }

        .outfit-actions { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
        .btn-gen {
          background:linear-gradient(135deg,#FF6B9D,#FF8E53);
          border:none; color:#fff; border-radius:50px; padding:11px 26px;
          font-family:'DM Sans',sans-serif; font-weight:500; font-size:.88rem;
          cursor:pointer; transition:all .2s; box-shadow:0 4px 16px rgba(255,107,157,.4);
        }
        .btn-gen:hover { transform:translateY(-2px); box-shadow:0 8px 22px rgba(255,107,157,.5); }
        .btn-sav {
          background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.25); color:#fff;
          border-radius:50px; padding:11px 26px; font-family:'DM Sans',sans-serif;
          font-weight:500; font-size:.88rem; cursor:pointer; transition:all .2s;
        }
        .btn-sav:hover { background:rgba(255,255,255,.2); transform:translateY(-2px); }
        .btn-sav.flash { background:#4ADE80; border-color:#4ADE80; color:#14532d; }

        .saved-card {
          background:#fff; border-radius:18px; padding:18px;
          box-shadow:0 2px 10px rgba(0,0,0,.06); margin-bottom:14px; position:relative;
        }
        .saved-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
        .saved-head-title { font-family:'Playfair Display',serif; font-size:.98rem; color:#1a1a2e; }
        .saved-head-right { display:flex; align-items:center; gap:10px; }
        .saved-head-date  { font-size:.76rem; color:#bbb; }
        .saved-del-btn {
          background:none; border:none; color:#ddd; font-size:.85rem;
          cursor:pointer; transition:color .18s; padding:2px 6px; border-radius:6px;
        }
        .saved-del-btn:hover { color:#ff4d4d; background:#fff0f0; }
        .saved-items { display:flex; gap:10px; flex-wrap:wrap; }
        .sitem { width:78px; text-align:center; }
        .sitem img { width:78px; height:78px; object-fit:cover; border-radius:11px; margin-bottom:3px; display:block; }
        .sitem-name { font-size:.68rem; color:#777; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        .empty { text-align:center; padding:52px 24px; color:#bbb; }
        .empty-icon  { font-size:3.2rem; margin-bottom:10px; }
        .empty-title { font-family:'Playfair Display',serif; font-size:1.2rem; color:#666; margin-bottom:5px; }
        .empty p { font-size:.84rem; }

        .err-msg {
          background:#fff0f5; border:1px solid #ffd6e7; color:#c2185b;
          border-radius:11px; padding:11px 15px; font-size:.84rem;
          margin-bottom:14px; text-align:center;
        }

        .storage-badge {
          display:inline-flex; align-items:center; gap:5px;
          background:rgba(74,222,128,.15); border:1px solid rgba(74,222,128,.3);
          color:#4ADE80; border-radius:50px; padding:3px 10px;
          font-size:.7rem; font-weight:500; margin-top:4px;
        }

        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
        .form-gap { display:flex; flex-direction:column; gap:13px; }
        .small-link { background:none; border:none; color:#bbb; font-size:.78rem; cursor:pointer; margin-top:7px; }
        .small-link:hover { color:#999; }

        @media(max-width:600px){
          .header { flex-direction:column; align-items:flex-start; }
          .two-col { grid-template-columns:1fr; }
          .nav-btn { font-size:.78rem; padding:8px 8px; }
        }
      `}</style>

      <div className="app">

        {/* HEADER */}
        <div className="header">
          <div>
            <h1>✨ Vêtu</h1>
            <p>Your wardrobe, curated.</p>
            <div className="storage-badge">💾 Auto-saved to your browser</div>
          </div>
          <div className="header-stats">
            <div className="stat-pill"><div className="num">{clothes.length}</div><div className="lbl">Items</div></div>
            <div className="stat-pill"><div className="num">{Object.keys(catCounts).length}</div><div className="lbl">Categories</div></div>
            <div className="stat-pill"><div className="num">{savedOutfits.length}</div><div className="lbl">Saved</div></div>
          </div>
        </div>

        {/* NAV */}
        <div className="nav">
          {[
            { id:"closet", icon:"👗", label:"My Closet" },
            { id:"upload", icon:"📸", label:"Add Item" },
            { id:"outfit", icon:"✨", label:"Outfit" },
            { id:"saved",  icon:"💾", label:"Saved" },
          ].map((t) => (
            <button key={t.id} className={`nav-btn ${activeTab===t.id?"active":""}`} onClick={() => setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══ CLOSET ══ */}
        {activeTab === "closet" && (
          <div>
            <div className="filter-row">
              <button
                className="fpill"
                style={filterCat==="All" ? {background:"#1a1a2e",color:"#fff"} : {background:"#eee",color:"#666"}}
                onClick={() => setFilterCat("All")}
              >
                All ({clothes.length})
              </button>
              {CATEGORIES.filter((c) => catCounts[c]).map((cat) => (
                <button
                  key={cat} className="fpill"
                  style={filterCat===cat
                    ? {background:CATEGORY_COLORS[cat].badge, color:"#fff"}
                    : {background:"#f0f0f0", color:"#666"}
                  }
                  onClick={() => setFilterCat(cat)}
                >
                  {CATEGORY_ICONS[cat]} {cat} ({catCounts[cat]})
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">👚</div>
                <div className="empty-title">Your closet is empty</div>
                <p>Add some clothes to get started!</p>
                <button className="btn-gen" style={{marginTop:14}} onClick={() => setActiveTab("upload")}>
                  + Add First Item
                </button>
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
                        <span className="cat-badge" style={{background:CATEGORY_COLORS[item.category]?.bg, color:CATEGORY_COLORS[item.category]?.text}}>
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
                <div style={{textAlign:"center",marginTop:26}}>
                  <button className="btn-gen" onClick={generateOutfit}>🎲 Generate Random Outfit</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ UPLOAD ══ */}
        {activeTab === "upload" && (
          <div className="two-col">
            <div className="panel">
              <div className="panel-title">📸 Upload Photo</div>
              <div
                className={`drop-zone ${dragOver ? "drag-active" : ""}`}
                onClick={() => fileRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                {uploadPreview
                  ? <img src={uploadPreview} alt="preview" />
                  : <div style={{textAlign:"center",padding:20}}>
                      <div className="dz-icon">📸</div>
                      <div className="dz-text">Drop photo here</div>
                      <div className="dz-sub">or click to browse</div>
                    </div>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
                onChange={(e) => handleFile(e.target.files[0])} />
              {uploadPreview && (
                <button className="small-link" onClick={() => setUploadPreview(null)}>✕ Remove photo</button>
              )}
            </div>

            <div className="panel">
              <div className="panel-title">🏷️ Item Details</div>
              <div className="form-gap">
                <div>
                  <label className="flabel">Item Name *</label>
                  <input className="finput" placeholder="e.g. White Linen Shirt"
                    value={uploadName} onChange={(e) => setUploadName(e.target.value)} />
                </div>
                <div>
                  <label className="flabel">Category *</label>
                  <select className="fselect" value={uploadCat} onChange={(e) => setUploadCat(e.target.value)}>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flabel">Tags (comma-separated)</label>
                  <input className="finput" placeholder="e.g. casual, summer, blue"
                    value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} />
                </div>
                <button className="btn-add" disabled={!uploadPreview || !uploadName.trim()} onClick={addClothing}>
                  + Add to Closet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ OUTFIT ══ */}
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
                <div style={{textAlign:"center",padding:"36px 0",opacity:.35,fontSize:"3rem"}}>👗</div>
              )}

              <div className="outfit-actions">
                <button className="btn-gen" onClick={generateOutfit}>
                  🎲 {outfit ? "Regenerate" : "Generate Outfit"}
                </button>
                {outfit && (
                  <button className={`btn-sav ${savedFlash?"flash":""}`} onClick={saveOutfit}>
                    {savedFlash ? "✓ Saved!" : "💾 Save Outfit"}
                  </button>
                )}
              </div>
            </div>

            {clothes.length === 0 && (
              <div className="empty">
                <div className="empty-icon">🧺</div>
                <div className="empty-title">No clothes yet</div>
                <p>Add items to your closet first</p>
                <button className="btn-gen" style={{marginTop:14}} onClick={() => setActiveTab("upload")}>
                  + Add Clothes
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ SAVED ══ */}
        {activeTab === "saved" && (
          <div>
            {savedOutfits.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">💾</div>
                <div className="empty-title">No saved outfits yet</div>
                <p>Generate an outfit and save it to see it here</p>
                <button className="btn-gen" style={{marginTop:14}} onClick={generateOutfit}>
                  Generate Outfit
                </button>
              </div>
            ) : (
              savedOutfits.map((saved, idx) => (
                <div key={saved.id} className="saved-card">
                  <div className="saved-head">
                    <div className="saved-head-title">Outfit #{savedOutfits.length - idx}</div>
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
                        <span className="cat-badge" style={{fontSize:".63rem", background:CATEGORY_COLORS[item.category]?.bg, color:CATEGORY_COLORS[item.category]?.text, padding:"1px 6px"}}>
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