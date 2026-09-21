import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function realEstateScraperPlugin(): Plugin {
  return {
    name: 'real-estate-scraper-api',
    configureServer(server) {
      server.middlewares.use('/api/realestate/scrape-live', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const query = JSON.parse(body || '{}');
            const country = query.country || 'PT';
            const city = (query.city || 'Lisboa').trim();
            const zoneOrDistrict = (query.zoneOrDistrict || '').trim();
            const propertyType = query.propertyType || '';
            const isRent = String(query.transactionType || '').toUpperCase() === 'RENT' || 
                           String(query.transactionType || '').toLowerCase().includes('alug') ||
                           String(query.transactionType || '').toLowerCase().includes('arrend');
            const transTypeLabel = isRent ? 'RENT' : 'SALE';

            const normalizeText = (s: string) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const normCity = normalizeText(city);
            const normZone = normalizeText(zoneOrDistrict);

            // Geographic validator to prevent out-of-region ads (e.g., Albufeira when searching Oeiras/Paço de Arcos)
            const isGeoMatch = (itemLoc: { county?: string; parish?: string; district?: string; text?: string; title?: string; body?: string }) => {
              const combined = normalizeText([
                itemLoc.county,
                itemLoc.parish,
                itemLoc.district,
                itemLoc.text,
                itemLoc.title
              ].filter(Boolean).join(' '));

              // Specialized Oeiras & Paço de Arcos concelho matcher
              const isOeirasArea = normCity.includes('oeiras') || normZone.includes('paco de arcos') || normZone.includes('paco') || normZone.includes('caxias') || normZone.includes('alges') || normZone.includes('carnaxide') || normZone.includes('porto salvo') || normZone.includes('barcarena');
              if (isOeirasArea) {
                const distantLocations = ['albufeira', 'faro', 'portimao', 'lagos', 'loule', 'tavira', 'quarteira', 'braga', 'porto', 'amarante', 'coimbra', 'leiria', 'viseu', 'chamusca', 'melides', 'setubal', 'santarem', 'evora', 'beja', 'guimaraes', 'alcobaca', 'peniche', 'fervenca', 'torres vedras', 'lourinha'];
                for (const dist of distantLocations) {
                  if (combined.includes(dist) && !combined.includes('oeiras') && !combined.includes('paco de arcos')) {
                    return false;
                  }
                }
                const oeirasKeywords = ['oeiras', 'paco de arcos', 'caxias', 'alges', 'linda-a-velha', 'cruz quebrada', 'dafundo', 'carnaxide', 'queijas', 'porto salvo', 'barcarena', 'sao juliao da barra', 'miraflores'];
                return oeirasKeywords.some(k => combined.includes(k));
              }

              // Specialized Cascais concelho matcher
              if (normCity.includes('cascais') || normZone.includes('estoril') || normZone.includes('carcavelos') || normZone.includes('parede')) {
                const distant = ['albufeira', 'faro', 'braga', 'porto', 'coimbra', 'setubal', 'amarante'];
                if (distant.some(d => combined.includes(d) && !combined.includes('cascais'))) return false;
                const cascaisKeywords = ['cascais', 'estoril', 'carcavelos', 'parede', 'sao domingos de rana', 'alcabideche', 'marianas'];
                return cascaisKeywords.some(k => combined.includes(k));
              }

              // Specialized Sintra concelho matcher
              if (normCity.includes('sintra') || normZone.includes('queluz') || normZone.includes('cacem') || normZone.includes('mem martins')) {
                const distant = ['albufeira', 'faro', 'braga', 'porto', 'setubal'];
                if (distant.some(d => combined.includes(d) && !combined.includes('sintra'))) return false;
                const sintraKeywords = ['sintra', 'queluz', 'belas', 'massama', 'cacem', 'sao marcos', 'rio de mouro', 'algueirao', 'mem martins', 'agualva', 'colares', 'casal de cambra'];
                return sintraKeywords.some(k => combined.includes(k));
              }

              // General Zone check
              if (normZone && normZone.length > 2) {
                if (combined.includes(normZone)) return true;
              }

              // General City check
              if (normCity && normCity.length > 2) {
                if (combined.includes(normCity)) return true;
              }

              // If specific city was asked and item shows a completely different city
              if (normCity && !combined.includes(normCity)) {
                return false;
              }

              return true;
            };

            const results: Array<{
              portal: string;
              portalSource: string;
              url: string;
              title: string;
              snippet: string;
              price: string;
              city: string;
              transactionType: 'SALE' | 'RENT';
              photoUrl?: string;
            }> = [];

            // 1. OLX Portugal Live Scrape (Apenas Particulares com filtro estrito de Venda vs Arrendar e Geo-Fencing)
            if (country === 'PT') {
              try {
                const olxAction = isRent ? 'arrendar' : 'venda';
                const searchKeywords = [normCity, normZone].filter(Boolean).join(' ');
                const olxUrl = `https://www.olx.pt/imoveis/q-${encodeURIComponent(searchKeywords)}-${olxAction}/?search%5Bprivate_business%5D=private&search%5Border%5D=created_at%3Adesc`;
                const olxRes = await fetch(olxUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8'
                  }
                });

                if (olxRes.ok) {
                  const html = await olxRes.text();
                  const cards = html.split('data-cy="l-card"');
                  
                  for (let i = 1; i < cards.length; i++) {
                    const chunk = cards[i].slice(0, 4000);
                    const linkMatch = chunk.match(/href="([^"]*\/d\/anuncio\/[^"]*)"/i) || chunk.match(/href="([^"]+)"/i);
                    if (!linkMatch) continue;

                    const rawHref = linkMatch[1];
                    const cleanUrl = rawHref.startsWith('http') ? rawHref.split('?')[0] : `https://www.olx.pt${rawHref.split('?')[0]}`;
                    
                    const titleMatch = chunk.match(/<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/i);
                    let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
                    if (!title && cleanUrl.includes('/d/anuncio/')) {
                      const slug = cleanUrl.split('/d/anuncio/')[1]?.split('-ID')[0]?.replace(/-/g, ' ');
                      if (slug) title = slug.charAt(0).toUpperCase() + slug.slice(1);
                    }

                    const priceMatch = chunk.match(/<p[^>]*data-testid="ad-price"[^>]*>([\s\S]*?)<\/p>/i) || chunk.match(/(\d[\d\.\s]*\s*€|\d[\d\.\s]*\s*EUR)/i);
                    let price = priceMatch ? (typeof priceMatch === 'string' ? priceMatch : (priceMatch[1] || priceMatch[0])).replace(/<[^>]+>/g, '').trim() : 'Sob consulta';
                    price = price.replace(/\.css-[^{]+{[^}]+}/g, '').replace(/<[^>]+>/g, '').trim();
                    if (price.includes('Negociável')) {
                      price = price.replace(/Negociável/g, '').trim() + ' (Negociável)';
                    }
                    
                    const locMatch = chunk.match(/<p[^>]*data-testid="location-date"[^>]*>([\s\S]*?)<\/p>/i);
                    const locInfo = locMatch ? locMatch[1].replace(/<[^>]+>/g, '').trim() : '';
                    
                    const imgMatch = chunk.match(/<img[^>]+src="([^">]+)"/i);
                    const photoUrl = imgMatch ? imgMatch[1] : undefined;

                    // Validação geográfica estrita (rejeita anúncios fora da zona/cidade solicitada)
                    if (!isGeoMatch({ text: locInfo, title })) {
                      continue;
                    }

                    // Validação de tipo de transação pelo título e preço
                    const lowerTitle = title.toLowerCase();
                    if (isRent) {
                      if (lowerTitle.startsWith('vende-se moradia') || lowerTitle.startsWith('venda de')) continue;
                    } else {
                      if (lowerTitle.includes('quarto para arrendar') || lowerTitle.includes('aluguer de quarto') || lowerTitle.includes('aluga-se quarto') || lowerTitle.includes('arrenda-se quarto')) continue;
                    }

                    if (title && cleanUrl.includes('/d/anuncio/') && !results.some(r => r.url === cleanUrl)) {
                      results.push({
                        portal: 'OLX Portugal',
                        portalSource: 'olx',
                        url: cleanUrl,
                        title,
                        snippet: `Anúncio de ${isRent ? 'Arrendamento' : 'Venda'} de proprietário particular no OLX Portugal em ${query.city || city}. ${locInfo}. Preço: ${price}`,
                        price,
                        city: query.city || city,
                        transactionType: transTypeLabel,
                        photoUrl
                      });
                    }
                  }
                }
              } catch (olxErr) {
                console.warn('OLX PT scrape error:', olxErr);
              }
            }

            // 2. CustoJusto Live Scrape (Filtrado estritamente por Concelho/Distrito + Categoria Venda vs Arrendar)
            if (country === 'PT') {
              try {
                const cjCategory = isRent ? 'arrendar-apartamentos-casas' : 'comprar-apartamentos-casas';
                
                // Concelho URL detection para Lisboa, Porto, etc.
                let cjUrls: string[] = [];
                if (normCity.includes('oeiras') || normZone.includes('paco de arcos')) {
                  cjUrls.push(`https://www.custojusto.pt/lisboa/oeiras/imobiliario?f=p&o=1`);
                  cjUrls.push(`https://www.custojusto.pt/lisboa/imobiliario/${cjCategory}?f=p&o=1&q=oeiras`);
                } else if (normCity.includes('cascais')) {
                  cjUrls.push(`https://www.custojusto.pt/lisboa/cascais/imobiliario?f=p&o=1`);
                } else if (normCity.includes('sintra')) {
                  cjUrls.push(`https://www.custojusto.pt/lisboa/sintra/imobiliario?f=p&o=1`);
                } else if (normCity.includes('lisboa')) {
                  cjUrls.push(`https://www.custojusto.pt/lisboa/imobiliario/${cjCategory}?f=p&o=1&q=${encodeURIComponent(normZone || normCity)}`);
                } else if (normCity.includes('porto')) {
                  cjUrls.push(`https://www.custojusto.pt/porto/imobiliario/${cjCategory}?f=p&o=1&q=${encodeURIComponent(normZone || normCity)}`);
                } else if (normCity.includes('faro') || normCity.includes('albufeira') || normCity.includes('algarve')) {
                  cjUrls.push(`https://www.custojusto.pt/faro/imobiliario/${cjCategory}?f=p&o=1&q=${encodeURIComponent(normZone || normCity)}`);
                } else {
                  cjUrls.push(`https://www.custojusto.pt/portugal/imobiliario/${cjCategory}?f=p&o=1&q=${encodeURIComponent([normCity, normZone].filter(Boolean).join(' '))}`);
                }

                for (const cjUrl of cjUrls) {
                  const cjRes = await fetch(cjUrl, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                      'Accept': 'text/html,application/xhtml+xml',
                      'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8'
                    }
                  });

                  if (cjRes.ok) {
                    const html = await cjRes.text();
                    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
                    
                    if (nextDataMatch) {
                      try {
                        const nextData = JSON.parse(nextDataMatch[1]);
                        const listItems = nextData.props?.pageProps?.listItems || [];
                        
                        for (const item of listItems) {
                          if (item.companyAd) continue; // Apenas particulares!
                          
                          // Validação estrita do tipo no CustoJusto ('sell' = venda, 'let' = arrendamento)
                          if (isRent && item.type === 'sell') continue;
                          if (!isRent && item.type === 'let') continue;

                          // Validação geográfica estrita por concelho e freguesia
                          const locObj = {
                            county: item.locationNames?.county,
                            parish: item.locationNames?.parish,
                            district: item.locationNames?.district,
                            title: item.title,
                            body: item.body
                          };
                          if (!isGeoMatch(locObj)) {
                            continue;
                          }

                          const itemUrl = item.url ? (item.url.startsWith('http') ? item.url : `https://www.custojusto.pt${item.url.startsWith('/') ? item.url : '/' + item.url}`) : '';
                          if (!itemUrl || results.some(r => r.url === itemUrl)) continue;

                          const itemPrice = item.price ? `€ ${Number(item.price).toLocaleString('pt-PT')}${isRent ? '/mês' : ''}` : 'Sob consulta';
                          const parish = item.locationNames?.parish || item.locationNames?.county || city;
                          const owner = item.name || 'Proprietário Particular';

                          results.push({
                            portal: 'CustoJusto Portugal',
                            portalSource: 'custojusto',
                            url: itemUrl,
                            title: item.title || 'Imóvel Particular CustoJusto',
                            snippet: `${item.body || 'Anúncio direto de particular no CustoJusto.'} Finalidade: ${isRent ? 'Arrendamento' : 'Venda'}. Local: ${parish}. Anunciante: ${owner}. Preço: ${itemPrice}`,
                            price: itemPrice,
                            city: item.locationNames?.county || query.city || city,
                            transactionType: transTypeLabel,
                            photoUrl: item.imageFullURL || undefined
                          });
                        }
                      } catch (pErr) {
                        console.warn('Erro ao processar __NEXT_DATA__ do CustoJusto:', pErr);
                      }
                    }
                  }
                }
              } catch (cjErr) {
                console.warn('CustoJusto scrape error:', cjErr);
              }
            }

            // 2. DuckDuckGo Deep Web Portal Crawler (For OLX, Idealista, Fotocasa, Zap, VivaReal)
            const ddgQueries: string[] = [];
            if (country === 'PT') {
              ddgQueries.push(`site:olx.pt/d/anuncio imoveis particular ${city} ${zoneOrDistrict}`);
              ddgQueries.push(`site:custojusto.pt imobiliario particular ${city}`);
              ddgQueries.push(`site:idealista.pt/imovel particular ${city} ${zoneOrDistrict}`);
            } else if (country === 'ES') {
              ddgQueries.push(`site:idealista.com/inmueble particular ${city} ${zoneOrDistrict}`);
              ddgQueries.push(`site:fotocasa.es particular ${city}`);
              ddgQueries.push(`site:milanuncios.com inmobiliaria particular ${city}`);
              ddgQueries.push(`site:pisos.com particular ${city}`);
            } else {
              ddgQueries.push(`site:olx.com.br/imoveis "particular" ${city} ${zoneOrDistrict}`);
              ddgQueries.push(`site:zapimoveis.com.br "direto com proprietario" ${city}`);
              ddgQueries.push(`site:vivareal.com.br "direto com proprietario" ${city}`);
            }

            for (const q of ddgQueries) {
              if (results.length >= 16) break;
              try {
                const encodedQ = encodeURIComponent(q);
                const ddgRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodedQ}`, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'pt-PT,pt;q=0.9,es;q=0.8,en;q=0.7'
                  }
                });

                if (ddgRes.ok) {
                  const html = await ddgRes.text();
                  const snippets = [...html.matchAll(/<a[^>]*class="result__snippet"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

                  for (const s of snippets) {
                    const rawHref = s[1];
                    const decodedUrlMatch = rawHref.match(/uddg=([^&]+)/);
                    const realUrl = decodedUrlMatch ? decodeURIComponent(decodedUrlMatch[1]) : rawHref;
                    const text = s[2].replace(/<[^>]+>/g, '').trim();

                    let portalLabel = 'Portal Imobiliário';
                    let portalSource = 'olx';

                    if (realUrl.includes('olx.pt') || realUrl.includes('olx.com.br')) {
                      portalLabel = country === 'PT' ? 'OLX Portugal' : 'OLX Brasil';
                      portalSource = 'olx';
                    } else if (realUrl.includes('idealista.pt') || realUrl.includes('idealista.com') || realUrl.includes('idealista.it')) {
                      portalLabel = country === 'PT' ? 'Idealista Portugal' : 'Idealista España';
                      portalSource = 'idealista';
                    } else if (realUrl.includes('custojusto.pt')) {
                      portalLabel = 'CustoJusto Portugal';
                      portalSource = 'custojusto';
                    } else if (realUrl.includes('fotocasa.es')) {
                      portalLabel = 'Fotocasa España';
                      portalSource = 'fotocasa';
                    } else if (realUrl.includes('zapimoveis.com.br')) {
                      portalLabel = 'ZAP Imóveis';
                      portalSource = 'zap_imoveis';
                    } else if (realUrl.includes('vivareal.com.br')) {
                      portalLabel = 'VivaReal';
                      portalSource = 'vivareal';
                    }

                    // Extract title from slug or snippet
                    let title = '';
                    if (realUrl.includes('/d/anuncio/')) {
                      const slug = realUrl.split('/d/anuncio/')[1]?.split('-ID')[0]?.replace(/-/g, ' ') || '';
                      if (slug) title = slug.charAt(0).toUpperCase() + slug.slice(1);
                    } else if (realUrl.includes('/inmueble/') || realUrl.includes('/imovel/')) {
                      const parts = realUrl.split('/');
                      const lastPart = parts[parts.length - 1] || parts[parts.length - 2] || '';
                      const slug = lastPart.replace(/-/g, ' ').replace(/\.html/g, '');
                      if (slug) title = slug.charAt(0).toUpperCase() + slug.slice(1);
                    }

                    if (!title) {
                      title = text.split('.')[0]?.slice(0, 70) || `Imóvel Particular em ${query.city || city}`;
                    }

                    // Extract price
                    const priceMatch = text.match(/(\d[\d\.\s]*\s*€|R\$\s*[\d\.\s]+|\d[\d\.\s]*\s*EUR)/i);
                    const price = priceMatch ? priceMatch[1].trim() : 'Sob consulta';

                    if (realUrl.startsWith('http') && !results.some(r => r.url === realUrl)) {
                      results.push({
                        portal: portalLabel,
                        portalSource,
                        url: realUrl,
                        title,
                        snippet: text,
                        price,
                        city: query.city || city
                      });
                    }
                  }
                }
              } catch (ddgErr) {
                console.warn('DuckDuckGo query error:', ddgErr);
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              totalScraped: results.length,
              results
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              error: err.message || 'Scraper server error',
              results: []
            }));
          }
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        realEstateScraperPlugin()
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

