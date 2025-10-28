# Sedgwick County Inmate Search

A web application to search inmate records from Sedgwick County using web scraping.

## 🚀 Features

- ✅ Real-time inmate search
- ✅ Beautiful responsive UI
- ✅ No database required
- ✅ Direct scraping from Sedgwick County website
- ✅ Detailed inmate information display

## 📦 Files Included

1. **package.json** - Project dependencies
2. **server.js** - Backend server with web scraping
3. **public/index.html** - Frontend user interface
4. **README.md** - This file

## 🛠️ Setup Instructions

### Option 1: Local Setup (Requires Node.js)

1. **Install Node.js**
   - Download from: https://nodejs.org/
   - Install the LTS version

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run the Server**
   ```bash
   npm start
   ```

4. **Open Browser**
   - Go to: http://localhost:3000

### Option 2: Replit Setup (No Installation Required)

1. **Go to Replit**
   - Visit: https://replit.com

2. **Create New Repl**
   - Click "Create Repl"
   - Choose "Node.js" template
   - Name it: `sedgwick-inmate-search`

3. **Upload Files**
   - Delete default files
   - Upload all 3 files:
     - package.json
     - server.js
     - Create `public` folder and upload index.html inside it

4. **Run**
   - Click the "Run" button
   - Wait for dependencies to install
   - Your app will open automatically!

### Option 3: Glitch Setup

1. **Go to Glitch**
   - Visit: https://glitch.com

2. **New Project**
   - Click "New Project" → "hello-express"

3. **Replace Files**
   - Upload the 3 files
   - Your app auto-deploys!

## 📖 Usage

1. Enter **First Name**
2. Enter **Last Name**
3. Select **State** (Default: Kansas)
4. Click **"Search Inmate Records"**
5. Wait 5-10 seconds for results

## ⚠️ Important Notes

- **Legal:** This scrapes publicly available data from sedgwickcountycourt.org
- **Performance:** Each search takes 5-10 seconds (web scraping)
- **Rate Limiting:** Don't spam searches (be respectful)
- **Accuracy:** Data is pulled in real-time from public records

## 🔧 Technical Details

- **Backend:** Node.js + Express
- **Scraping:** Puppeteer (headless Chrome)
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **No Database:** Direct scraping on each request

## 🐛 Troubleshooting

### "npm not recognized" error
- Install Node.js from nodejs.org
- Restart your terminal/VS Code

### Search takes too long
- Normal! Web scraping takes 5-10 seconds
- The target website might be slow

### No results found
- Check spelling of names
- Try different variations
- The person might not be in custody

### Puppeteer installation fails
- Try: `npm install --legacy-peer-deps`
- Or use Replit/Glitch instead

## 📝 License

MIT License - Free to use and modify

## 🤝 Contributing

Feel free to improve this project!

## 💡 Future Improvements

- [ ] Add caching to speed up repeat searches
- [ ] Add more search filters
- [ ] Support multiple counties
- [ ] Add export to PDF/Excel
- [ ] Mobile app version

## 📧 Support

If you have issues, check the console logs for detailed error messages.

---

**Made with ❤️ for learning purposes**
