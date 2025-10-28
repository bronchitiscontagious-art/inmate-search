// server.js
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

// Search endpoint
app.post('/api/search', async (req, res) => {
    const { firstName, lastName, state = 'KS' } = req.body;
    
    console.log(`🔍 Searching for: ${firstName} ${lastName} in ${state}`);
    
    // Validation
    if (!firstName || !lastName) {
        return res.status(400).json({ 
            success: false,
            error: 'First name and last name are required' 
        });
    }
    
    let browser;
    
    try {
        // Launch browser
        console.log('🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Build search URL
        const searchUrl = `https://sedgwickcountycourt.org/loading/?firstname=${encodeURIComponent(firstName)}&lastname=${encodeURIComponent(lastName)}&state=${state}&search=Search%20Now`;
        
        console.log(`📍 Navigating to: ${searchUrl}`);
        
        // Navigate to search URL
        await page.goto(searchUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        console.log('⏳ Waiting for results to load...');
        
        // Wait for page to fully load
        await page.waitForTimeout(5000);
        
        // Get final URL (might redirect)
        const finalUrl = page.url();
        console.log(`📄 Final URL: ${finalUrl}`);
        
        // Extract results from page
        const results = await page.evaluate(() => {
            const data = [];
            
            // Method 1: Try to find table
            const tables = document.querySelectorAll('table');
            
            if (tables.length > 0) {
                console.log('✅ Found table with results');
                
                tables.forEach(table => {
                    const rows = table.querySelectorAll('tbody tr, tr');
                    
                    rows.forEach((row, index) => {
                        // Skip header row
                        if (index === 0 && row.querySelector('th')) return;
                        
                        const cells = row.querySelectorAll('td');
                        
                        if (cells.length > 0) {
                            const rowData = {
                                name: cells[0]?.innerText.trim() || '',
                                bookingNumber: cells[1]?.innerText.trim() || '',
                                bookingDate: cells[2]?.innerText.trim() || '',
                                charges: cells[3]?.innerText.trim() || '',
                                bond: cells[4]?.innerText.trim() || '',
                                facility: cells[5]?.innerText.trim() || ''
                            };
                            
                            // Only add if name exists
                            if (rowData.name) {
                                data.push(rowData);
                            }
                        }
                    });
                });
            }
            
            // Method 2: Try to find result divs
            if (data.length === 0) {
                const resultDivs = document.querySelectorAll('[class*="result"], [class*="inmate"], [class*="record"]');
                
                resultDivs.forEach(div => {
                    const text = div.innerText.trim();
                    if (text && text.length > 10) {
                        data.push({
                            content: text
                        });
                    }
                });
            }
            
            // Method 3: Get page text as fallback
            if (data.length === 0) {
                const bodyText = document.body.innerText;
                
                // Check if "no results" message
                if (bodyText.toLowerCase().includes('no records found') || 
                    bodyText.toLowerCase().includes('no results') ||
                    bodyText.toLowerCase().includes('not found')) {
                    return [];
                }
                
                data.push({
                    pageText: bodyText.substring(0, 3000),
                    note: 'Could not parse structured data, returning page text'
                });
            }
            
            return data;
        });
        
        console.log(`✅ Found ${results.length} results`);
        
        await browser.close();
        
        // Send response
        res.json({
            success: true,
            searchQuery: {
                firstName,
                lastName,
                state
            },
            searchUrl,
            finalUrl,
            resultsCount: results.length,
            results: results
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        
        if (browser) {
            await browser.close();
        }
        
        res.status(500).json({
            success: false,
            error: error.message,
            searchQuery: {
                firstName,
                lastName,
                state
            }
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/search`);
    console.log(`🏠 Frontend: http://localhost:${PORT}`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(50));
});
