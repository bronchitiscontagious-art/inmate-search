// server.js - OFFICIAL SEDGWICK COUNTY (NO CAPTCHA)
const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');

// Add stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Search endpoint - OFFICIAL SEDGWICK COUNTY SITE
app.post('/api/search', async (req, res) => {
    const { firstName, lastName } = req.body;
    
    console.log(`🔍 Searching for: ${firstName} ${lastName}`);
    
    // Validation
    if (!firstName || !lastName) {
        return res.status(400).json({ 
            success: false,
            error: 'First name and last name are required' 
        });
    }
    
    let browser;
    
    try {
        console.log('🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-blink-features=AutomationControlled'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set realistic viewport and user agent
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Navigate to OFFICIAL Sedgwick County Inmate Search
        const searchUrl = 'https://ssc.sedgwickcounty.org/inmatesearch/';
        
        console.log(`📍 Navigating to: ${searchUrl}`);
        
        await page.goto(searchUrl, { 
            waitUntil: 'domcontentloaded', // Changed from networkidle2 for faster load
            timeout: 60000  // Increased to 60 seconds
        });
        
        console.log('⏳ Waiting for form to load...');
        
        // Wait for search form with longer timeout
        await page.waitForTimeout(5000); // Give page time to fully render
        
        // Check for input fields
        const hasInputs = await page.evaluate(() => {
            return document.querySelectorAll('input[type="text"]').length > 0;
        });
        
        if (!hasInputs) {
            throw new Error('Search form not found on page');
        }
        
        console.log('📝 Filling form...');
        
        // Find and fill input fields
        await page.evaluate((firstName, lastName) => {
            const inputs = document.querySelectorAll('input[type="text"]');
            
            // Try to find inputs by label or placeholder
            let firstNameInput = null;
            let lastNameInput = null;
            
            inputs.forEach(input => {
                const placeholder = (input.placeholder || '').toLowerCase();
                const name = (input.name || '').toLowerCase();
                const id = (input.id || '').toLowerCase();
                
                if (placeholder.includes('first') || name.includes('first') || id.includes('first')) {
                    firstNameInput = input;
                } else if (placeholder.includes('last') || name.includes('last') || id.includes('last')) {
                    lastNameInput = input;
                }
            });
            
            // Fallback: use first two inputs
            if (!firstNameInput && inputs.length >= 2) {
                firstNameInput = inputs[0];
                lastNameInput = inputs[1];
            }
            
            if (firstNameInput && lastNameInput) {
                firstNameInput.value = firstName;
                lastNameInput.value = lastName;
                
                // Trigger events
                firstNameInput.dispatchEvent(new Event('input', { bubbles: true }));
                lastNameInput.dispatchEvent(new Event('input', { bubbles: true }));
                firstNameInput.dispatchEvent(new Event('change', { bubbles: true }));
                lastNameInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                return true;
            }
            return false;
        }, firstName, lastName);
        
        console.log('🔎 Submitting search...');
        
        // Click search button
        await page.evaluate(() => {
            // Try multiple selectors
            const button = document.querySelector('button[type="submit"]') ||
                          document.querySelector('input[type="submit"]') ||
                          document.querySelector('button:contains("Search")') ||
                          document.querySelector('[value*="Search"]');
            
            if (button) {
                button.click();
                return true;
            }
            
            // Fallback: submit form
            const form = document.querySelector('form');
            if (form) {
                form.submit();
                return true;
            }
            
            return false;
        });
        
        console.log('⏳ Waiting for results...');
        
        // Wait for results to load
        await page.waitForTimeout(5000);
        
        const finalUrl = page.url();
        console.log(`📄 Final URL: ${finalUrl}`);
        
        // Take screenshot for debugging
        try {
            await page.screenshot({ path: '/tmp/sedgwick-results.png', fullPage: true });
            console.log('📸 Screenshot saved');
        } catch (e) {
            console.log('⚠️ Could not save screenshot:', e.message);
        }
        
        // Extract results
        const results = await page.evaluate(() => {
            const data = [];
            
            // Method 1: Look for results table
            const tables = document.querySelectorAll('table');
            
            if (tables.length > 0) {
                console.log('✅ Found table');
                
                tables.forEach(table => {
                    const rows = table.querySelectorAll('tbody tr, tr');
                    
                    rows.forEach((row, index) => {
                        // Skip header rows
                        if (row.querySelector('th')) return;
                        
                        const cells = row.querySelectorAll('td');
                        
                        if (cells.length >= 3) {
                            const rowData = {
                                name: cells[0]?.innerText.trim() || '',
                                bookingNumber: cells[1]?.innerText.trim() || '',
                                bookingDate: cells[2]?.innerText.trim() || '',
                                charges: cells[3]?.innerText.trim() || '',
                                bond: cells[4]?.innerText.trim() || '',
                                location: cells[5]?.innerText.trim() || '',
                                status: cells[6]?.innerText.trim() || ''
                            };
                            
                            // Only add if has meaningful data
                            if (rowData.name && rowData.name.length > 2) {
                                data.push(rowData);
                            }
                        }
                    });
                });
            }
            
            // Method 2: Look for result cards/divs
            if (data.length === 0) {
                const resultElements = document.querySelectorAll('[class*="inmate"], [class*="result"], [class*="record"], .result-row, .inmate-row');
                
                resultElements.forEach(element => {
                    const text = element.innerText.trim();
                    if (text && text.length > 20) {
                        data.push({
                            content: text
                        });
                    }
                });
            }
            
            // Method 3: Check for "no results" message
            const bodyText = document.body.innerText.toLowerCase();
            if (bodyText.includes('no results') || 
                bodyText.includes('no inmates found') || 
                bodyText.includes('no records') ||
                bodyText.includes('no matches')) {
                return [];
            }
            
            // Method 4: Get page content as fallback (for debugging)
            if (data.length === 0) {
                const mainContent = document.querySelector('main, #content, .content, .main') || document.body;
                data.push({
                    pageText: mainContent.innerText.substring(0, 3000),
                    note: 'Could not parse structured data - showing page content'
                });
            }
            
            return data;
        });
        
        console.log(`✅ Extraction complete! Found ${results.length} items`);
        
        await browser.close();
        
        // Send response
        res.json({
            success: true,
            searchQuery: {
                firstName,
                lastName
            },
            searchUrl,
            finalUrl,
            resultsCount: results.length,
            results: results,
            source: 'Official Sedgwick County Sheriff'
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
                lastName
            },
            note: 'Check server logs for details'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running - Official Sedgwick County Scraper',
        version: '2.0.0',
        captchaRequired: false,
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`🚀 Sedgwick County Inmate Search Server`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🏠 Frontend: http://localhost:${PORT}`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Source: Official Sedgwick County Sheriff (ssc.sedgwickcounty.org)`);
    console.log(`⚡ No CAPTCHA required - Fast & Free!`);
    console.log('='.repeat(60));
});
