# ✨FitOutfit — Digital Closet App

> **Your wardrobe, curated.**

Vêtu is a luxury-styled digital closet web app built with **React** and **Vite**. Upload your clothing photos, organise them by category, generate random outfit combinations in one click, and save your favourite looks — all stored persistently in your browser.

🔗 **Live Demo:** 

---

## 🚀 Features

- 📂 **Upload Clothes** — Drag & drop or browse to upload clothing photos
- 🏷️ **Tag & Categorise** — Organise items into Tops, Bottoms, Shoes, Outerwear, Accessories, Dresses
- 🎲 **Random Outfit Generator** — Generates smart outfit combinations from your wardrobe
- 💾 **Save Outfits** — Save your favourite looks with date stamps
- 🔁 **Persistent Storage** — All data auto-saved to localStorage, survives page refresh
- 🗑️ **Delete Items** — Remove clothes or saved outfits anytime
- 📱 **Responsive Design** — Works on desktop and mobile

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI & State Management |
| Vite | Build tool & Dev server |
| localStorage | Persistent browser storage |
| CSS (custom) | Styling & animations |
| Google Fonts | Playfair Display + DM Sans |

---

## 📖 How to Use

1. **Add Item** — Go to the `Add Item` tab, upload a photo, enter the name, select a category, and optionally add tags
2. **My Closet** — View all your clothes, filter by category, hover over an item to delete it
3. **Outfit** — Click `Generate Random Outfit` to get a styled combination from your closet. Hit `Regenerate` for a new one
4. **Saved** — All outfits you save appear here with the date. Delete any you no longer want

---

## 💡 How Outfit Generation Works

Vêtu uses a smart combo-matching system:

1. Tries the best full combos first (e.g. `Tops + Bottoms + Shoes + Accessories`)
2. Falls back to smaller combos if needed (e.g. `Dresses + Shoes`)
3. If no combo fully matches, picks one item from every available category

This means **an outfit is always generated** no matter how few items you have.

---

## 🗄️ Data Storage

All your clothes and saved outfits are stored in **localStorage** as base64-encoded images. Data persists across:
- ✅ Page refreshes
- ✅ Tab closes
- ✅ Browser restarts

## 👩‍💻 Author

**Sakshi Malkar**
- GitHub: [@sakshimalkar](https://github.com/sakshimalkar)
- LinkedIn: [linkedin.com/in/sakshi-malkar](https://www.linkedin.com/in/sakshi-malkar/)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Made with ❤️ by Sakshi Malkar</p>
