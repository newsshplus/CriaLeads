/**
 * Scraper Robot Service
 * Fornece a arquitetura completa de Scraping do Google Maps (Playwright, BeautifulSoup4, Difflib e Requests)
 * Integrando:
 * 1. Google Maps Scraper (Playwright Stealth + DOM + Fotos + Redes Sociais)
 * 2. Engine de Cruzamento de Dados (Fuzzy Match Difflib > 85% + Domínio Limpo)
 * 3. Módulo de Rastreio em Bases Fiscais Públicas (Brasil CNPJ.ws, Portugal NIF.pt, Espanha BORME/Informa)
 * 4. Pipeline Completo Executável com Exportação JSON
 */

export interface ScraperScriptConfig {
  query: string;
  city: string;
  country: string;
  maxResults: number;
  useProxies: boolean;
  extractPhotos: boolean;
  extractSocials: boolean;
}

/**
 * Gera o Pipeline Completo em Python com os 4 Módulos
 */
export function generateUnifiedPipelinePythonScript(config: ScraperScriptConfig): string {
  const isPortugal = config.country.toLowerCase().includes('portugal') || config.city.toLowerCase().includes('lisboa') || config.city.toLowerCase().includes('porto');
  const isSpain = config.country.toLowerCase().includes('espan') || config.city.toLowerCase().includes('madrid') || config.city.toLowerCase().includes('barcelona');
  
  const fiscalMethod = isPortugal 
    ? `lead["fiscal_data"] = fiscal_scraper.scrape_portugal_nif(company_name)`
    : isSpain
    ? `lead["fiscal_data"] = fiscal_scraper.scrape_spain_cif(company_name)`
    : `lead["fiscal_data"] = fiscal_scraper.fetch_brazil_cnpj("34567890000123")  # Exemplo ou busca por nome`;

  return `"""
=============================================================================
PIPELINE COMPLETO DE PROSPECÇÃO B2B (GOOGLE MAPS + APOLLO + BASES FISCAIS)
Desenvolvido em Python com Playwright, BeautifulSoup4, Difflib e Requests
Sem dependência de APIs pagas do Google Maps
=============================================================================

Dependências Necessárias:
pip install playwright beautifulsoup4 requests lxml
playwright install chromium
"""

import asyncio
import re
import json
import difflib
from urllib.parse import quote
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import requests

# =============================================================================
# 1. SCRAPER DO GOOGLE MAPS & MÓDULO REDES SOCIAIS
# =============================================================================

class GoogleMapsScraper:
    def __init__(self, headless=True):
        self.headless = headless

    async def scrape_search(self, query: str, max_results: int = ${config.maxResults}):
        async with async_playwright() as p:
            # Lança o Chromium em modo Stealth / Simulação humana
            browser = await p.chromium.launch(
                headless=self.headless,
                args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
            )
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            )
            page = await context.new_page()

            search_url = f"https://www.google.com/maps/search/{quote(query)}"
            print(f"[+] Acessando Google Maps: {search_url}")
            await page.goto(search_url, wait_until="networkidle")

            # Aceita banners de cookies (EU/BR)
            try:
                accept_button = page.locator('button:has-text("Aceitar tudo"), button:has-text("Accept all"), button:has-text("Acepto")')
                if await accept_button.count() > 0:
                    await accept_button.first.click()
                    await page.wait_for_timeout(2000)
            except Exception:
                pass

            scrollable_div = 'div[role="feed"]'
            results = []
            
            try:
                await page.wait_for_selector(scrollable_div, timeout=10000)
            except Exception:
                print("[-] Painel de resultados não localizado ou apenas 1 resultado direto retornado.")

            # Scroll no painel lateral para carregar múltiplos resultados
            place_links = set()
            for _ in range(max_results // 3 + 1):
                links = await page.locator('a[href*="/maps/place/"]').all()
                for link in links:
                    url = await link.get_attribute('href')
                    if url and url not in place_links:
                        place_links.add(url)
                
                await page.evaluate(f'''
                    let feed = document.querySelector('{scrollable_div}');
                    if (feed) feed.scrollTop += 1000;
                ''')
                await page.wait_for_timeout(1500)
                if len(place_links) >= max_results:
                    break

            print(f"[+] Total de locais identificados: {len(place_links)}")

            # Visita cada local para raspar detalhes, fotos e website
            for place_url in list(place_links)[:max_results]:
                details = await self._scrape_place_details(page, place_url)
                if details:
                    results.append(details)

            await browser.close()
            return results

    async def _scrape_place_details(self, page, url: str):
        try:
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_timeout(2000)

            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')

            # Nome do Local
            name_el = soup.find('h1')
            name = name_el.text.strip() if name_el else "N/A"

            # Avaliações & Rating
            rating_el = soup.find('span', class_=re.compile(r'ceRating|ce-rating'))
            rating = rating_el.text.strip() if rating_el else None

            # Endereço, Telefone e Website
            address = self._extract_by_data_tooltip(soup, ["Endereço", "Address", "Endereço:", "Dirección"])
            phone = self._extract_by_data_tooltip(soup, ["Telefone", "Phone", "Copiar número de telefone", "Teléfono"])
            website = self._extract_website(soup)

            # Extração de URLs de fotos do local
            photos = []
            photo_imgs = soup.find_all('img', src=re.compile(r'googleusercontent\\.com/p/'))
            for img in photo_imgs[:5]:
                photos.append(img['src'])

            # Rastreamento de Redes Sociais acessando a Landing Page (Website)
            social_links = {}
            if website:
                social_links = await self._scrape_website_socials(page, website)

            return {
                "name": name,
                "rating": rating,
                "address": address,
                "phone": phone,
                "website": website,
                "social_media": social_links,
                "photos": photos,
                "maps_url": url
            }
        except Exception as e:
            print(f"[-] Erro ao raspar detalhe ({url}): {e}")
            return None

    def _extract_by_data_tooltip(self, soup, keywords):
        for kw in keywords:
            btn = soup.find('button', {'aria-label': re.compile(kw, re.I)})
            if btn:
                return btn.text.strip()
        return "N/A"

    def _extract_website(self, soup):
        link = soup.find('a', {'data-tooltip': re.compile(r'Website|website|Abrir website|Sitio web', re.I)})
        if link and 'href' in link.attrs:
            return link['href']
        return None

    async def _scrape_website_socials(self, page, website_url: str):
        socials = {}
        try:
            await page.goto(website_url, timeout=12000, wait_until="domcontentloaded")
            content = await page.content()
            
            patterns = {
                "instagram": r'https?://(?:www\\.)?instagram\\.com/[A-Za-z0-9_.-]+',
                "facebook": r'https?://(?:www\\.)?facebook\\.com/[A-Za-z0-9_.-]+',
                "linkedin": r'https?://(?:www\\.)?linkedin\\.com/(?:company|in)/[A-Za-z0-9_.-]+',
                "twitter": r'https?://(?:www\\.)?(?:twitter|x)\\.com/[A-Za-z0-9_.-]+'
            }

            for net, regex in patterns.items():
                match = re.search(regex, content)
                if match:
                    socials[net] = match.group(0)

        except Exception:
            pass
        return socials


# =============================================================================
# 2. ENGINE DE CRUZAMENTO DE DADOS (APOLLO + GOOGLE MAPS)
# =============================================================================

def normalize_domain(url):
    if not url: return ""
    domain = re.sub(r'https?://(www\\.)?', '', url.lower())
    return domain.split('/')[0]

def cross_match_apollo_and_maps(apollo_leads: list, maps_leads: list) -> list:
    unified_leads = []

    for a_lead in apollo_leads:
        a_domain = normalize_domain(a_lead.get("website_url"))
        a_name = a_lead.get("organization_name", "").lower()
        
        matched_maps = None

        for m_lead in maps_leads:
            m_domain = normalize_domain(m_lead.get("website"))
            m_name = m_lead.get("name", "").lower()

            # 1. Cruzamento por Domínio idêntico (Confiabilidade: 98%)
            if a_domain and m_domain and a_domain == m_domain:
                matched_maps = m_lead
                break

            # 2. Match por Fuzzy String do Nome (> 85% de similaridade)
            similarity = difflib.SequenceMatcher(None, a_name, m_name).ratio()
            if similarity > 0.85:
                matched_maps = m_lead
                break

        # Estrutura do lead unificado
        combined = {
            "company_name": a_lead.get("organization_name") or (matched_maps.get("name") if matched_maps else None),
            "website": a_lead.get("website_url") or (matched_maps.get("website") if matched_maps else None),
            "apollo_id": a_lead.get("id"),
            "apollo_contacts": a_lead.get("contacts", []),
            "google_maps": {
                "rating": matched_maps.get("rating") if matched_maps else None,
                "address": matched_maps.get("address") if matched_maps else None,
                "phone": matched_maps.get("phone") if matched_maps else None,
                "photos": matched_maps.get("photos", []) if matched_maps else [],
                "social_media": matched_maps.get("social_media", {}) if matched_maps else {}
            }
        }
        unified_leads.append(combined)

    return unified_leads


# =============================================================================
# 3. MÓDULO DE RASTREIO EM BASES PÚBLICAS/FISCAIS (BR, PT, ES)
# =============================================================================

class PublicFiscalScraper:
    
    @staticmethod
    def fetch_brazil_cnpj(cnpj: str):
        """Consulta pública da base de CNPJ (Brasil)"""
        clean_cnpj = re.sub(r'\\D', '', cnpj)
        url = f"https://publica.cnpj.ws/cnpj/{clean_cnpj}"
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "country": "BR",
                    "tax_id": data.get("cnpj"),
                    "legal_name": data.get("razao_social"),
                    "trade_name": data.get("estabelecimento", {}).get("nome_fantasia"),
                    "status": data.get("estabelecimento", {}).get("situacao_cadastral"),
                    "capital_social": data.get("capital_social"),
                    "partners": [p.get("nome") for p in data.get("socios", [])],
                    "cnae_main": data.get("estabelecimento", {}).get("atividade_principal", {}).get("descricao")
                }
        except Exception as e:
            print(f"[-] Erro ao buscar CNPJ BR: {e}")
        return None

    @staticmethod
    def scrape_portugal_nif(nif_or_name: str):
        """Scraping de dados fiscais públicos de Portugal (NIF.pt)"""
        search_url = f"https://www.nif.pt/?q={quote(nif_or_name)}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        try:
            resp = requests.get(search_url, headers=headers, timeout=10)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                title = soup.find('h1', class_='page-title')
                nif_val = soup.find('span', class_='nif-value')
                cae_val = soup.find(string=re.compile(r'CAE', re.I))
                
                return {
                    "country": "PT",
                    "tax_id": nif_val.text.strip() if nif_val else "N/A",
                    "legal_name": title.text.strip() if title else nif_or_name,
                    "cae_activity": cae_val.find_next('span').text.strip() if cae_val and hasattr(cae_val, 'find_next') else "N/A"
                }
        except Exception as e:
            print(f"[-] Erro ao raspar NIF PT: {e}")
        return None

    @staticmethod
    def scrape_spain_cif(cif_or_name: str):
        """Scraping de dados fiscais/mercantis da Espanha (BORME / Informa)"""
        search_url = f"https://www.informa.es/buscar/empresas?q={quote(cif_or_name)}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        try:
            resp = requests.get(search_url, headers=headers, timeout=10)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                first_row = soup.find('tr', class_='empresa-row')
                if first_row:
                    cols = first_row.find_all('td')
                    return {
                        "country": "ES",
                        "legal_name": cols[0].text.strip(),
                        "tax_id": cols[1].text.strip(),
                        "province": cols[2].text.strip(),
                        "status": "Activa"
                    }
        except Exception as e:
            print(f"[-] Erro ao raspar CIF ES: {e}")
        return None


# =============================================================================
# 4. PIPELINE COMPLETO EXECUTÁVEL
# =============================================================================

async def main():
    SEARCH_QUERY = "${config.query} em ${config.city}"
    print(f"=== INICIANDO PIPELINE DE PROSPECÇÃO B2B ===")
    print(f"Alvo: {SEARCH_QUERY} ({config.country})")
    
    # 1. Raspagem sem API do Google Maps
    maps_scraper = GoogleMapsScraper(headless=True)
    maps_results = await maps_scraper.scrape_search(SEARCH_QUERY, max_results=${config.maxResults})

    # 2. Exemplo de dados extraídos de decisores (Apollo / LinkedIn)
    mock_apollo_leads = [
        {
            "id": "ap_982",
            "organization_name": "${config.query.split(' ')[0]} Premium",
            "website_url": "https://exemplo-empresa.com",
            "contacts": [{"name": "Carlos Silva", "title": "Sócio-Diretor", "email": "carlos@exemplo-empresa.com"}]
        }
    ]

    # 3. Cruzamento dos universos Apollo + Google Maps
    unified_pipeline = cross_match_apollo_and_maps(mock_apollo_leads, maps_results)

    # 4. Enriquecimento Fiscal Público
    fiscal_scraper = PublicFiscalScraper()
    for lead in unified_pipeline:
        company_name = lead["company_name"]
        ${fiscalMethod}

    # Salva resultado final consolidado em arquivo JSON
    with open("leads_prospeccao_unificados.json", "w", encoding="utf-8") as f:
        json.dump(unified_pipeline, f, indent=2, ensure_ascii=False)

    print(f"\\n[★] Pipeline finalizado com sucesso! {len(unified_pipeline)} leads gravados em 'leads_prospeccao_unificados.json'")
    print(json.dumps(unified_pipeline[:2], indent=2, ensure_ascii=False))

if __name__ == "__main__":
    asyncio.run(main())
`;
}

export function generatePlaywrightPythonScript(config: ScraperScriptConfig): string {
  return generateUnifiedPipelinePythonScript(config);
}

export function generatePuppeteerNodeScript(config: ScraperScriptConfig): string {
  return `/**
 * Google Maps Scraper (Puppeteer Extra Stealth + Social Parser)
 * Rodar com: node maps_scraper.js
 */
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

puppeteer.use(StealthPlugin());

const SEARCH_QUERY = "${config.query} em ${config.city}, ${config.country}";

async function extractSocials(url) {
  if (!url || !url.startsWith('http')) return {};
  try {
    const { data } = await axios.get(url, { timeout: 6000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    const socials = {};
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href.includes('instagram.com/')) socials.instagram = href;
      if (href.includes('facebook.com/')) socials.facebook = href;
      if (href.includes('linkedin.com/company/')) socials.linkedin = href;
      if (href.includes('tiktok.com/@')) socials.tiktok = href;
      if (href.includes('x.com/') || href.includes('twitter.com/')) socials.twitter = href;
    });
    return socials;
  } catch {
    return {};
  }
}

async function run() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log(\`Buscando no Google Maps: \${SEARCH_QUERY}\`);
  await page.goto('https://www.google.com/maps?hl=pt-BR');
  
  await page.type('#searchboxinput', SEARCH_QUERY, { delay: 50 });
  await page.keyboard.press('Enter');
  await page.waitForSelector('div[role="feed"]', { timeout: 10000 });

  // Scroll Infinito
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => {
      const feed = document.querySelector('div[role="feed"]');
      if (feed) feed.scrollBy(0, 1000);
    });
    await new Promise(r => setTimeout(r, 1200));
  }

  const results = [];
  const cards = await page.$$('div[role="article"]');
  console.log(\`Encontrados \${cards.length} estabelecimentos.\`);

  for (let card of cards.slice(0, ${config.maxResults})) {
    try {
      await card.click();
      await new Promise(r => setTimeout(r, 1500));

      const name = await page.$eval('h1.DUwDvf', el => el.innerText).catch(() => 'N/A');
      const phone = await page.$eval('button[data-item-id*="phone:"]', el => el.innerText).catch(() => '');
      const website = await page.$eval('a[data-item-id="authority"]', el => el.href).catch(() => '');
      const address = await page.$eval('button[data-item-id="address"]', el => el.innerText).catch(() => '');

      const socials = await extractSocials(website);

      results.push({ name, phone, website, address, socials, city: "${config.city}" });
      console.log(\`[+] Extraído: \${name} | \${phone} | Web: \${website}\`);
    } catch (e) {
      continue;
    }
  }

  fs.writeFileSync('leads_extraidos.json', JSON.stringify(results, null, 2));
  console.log('Finalizado! Salvo em leads_extraidos.json');
  await browser.close();
}

run();
`;
}

/**
 * Script em Python para Download Oficial dos Dados Abertos do CNPJ (Receita Federal do Brasil)
 */
export function generateRfbDadosAbertosDownloaderScript(): string {
  return `"""
=============================================================================
DOWNLOAD AUTOMÁTICO DE DADOS ABERTOS DO CNPJ (RECEITA FEDERAL DO BRASIL)
Repositório Público Oficial de Empresas, Sócios (QSA) e Estabelecimentos
=============================================================================

Dependências:
pip install requests beautifulsoup4
"""

import os
import requests
from bs4 import BeautifulSoup

# URL oficial do repositório de Dados Abertos da Receita Federal
URL_DADOS_ABERTOS = "https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj"
BASE_URL_FILES = "https://arquivos.receitafederal.gov.br/dados/cnpj/datos_abertos_cnpj/"

def listar_e_baixar_arquivos(diretorio_destino="./dados_cnpj"):
    """
    Cria a pasta local e baixa os arquivos de Empresas e Sócios do repositório público.
    """
    if not os.path.exists(diretorio_destino):
        os.makedirs(diretorio_destino)
        print(f"Diretório '{diretorio_destino}' criado.")

    # Arquivos padrão das partições disponibilizadas mensalmente pela RFB:
    # - Empresas0.zip: Razão Social, Porte e Ramo de Atividade (CNAE).
    # - Socios0.zip: Nome dos Sócios, Qualificação e Representante Legal (QSA).
    # - Estabelecimentos0.zip: Nome Fantasia, Telefone, E-mail cadastrado e Endereço.
    
    arquivos_alvo = [
        "Empresas0.zip",
        "Socios0.zip",
        "Estabelecimentos0.zip"
    ]

    for arquivo in arquivos_alvo:
        url_download = f"{BASE_URL_FILES}{arquivo}"
        caminho_local = os.path.join(diretorio_destino, arquivo)
        
        print(f"\\n[+] Iniciando download em stream de: {url_download}")
        try:
            response = requests.get(url_download, stream=True, timeout=60)
            if response.status_code == 200:
                total_bytes = 0
                with open(caminho_local, "wb") as f:
                    for chunk in response.iter_content(chunk_size=1024 * 1024):  # Blocos de 1MB
                        if chunk:
                            f.write(chunk)
                            total_bytes += len(chunk)
                            print(f"\\r    Baixados: {total_bytes / (1024*1024):.2f} MB...", end="")
                print(f"\\n[✓] Download concluído com sucesso: {arquivo}")
            else:
                print(f"[-] Falha ao baixar {arquivo}. Status code: {response.status_code}")
        except Exception as e:
            print(f"[-] Erro durante o download de {arquivo}: {e}")

if __name__ == "__main__":
    # Para executar o download das bases abertas
    print("Iniciando rotina de download das bases oficiais da Receita Federal...")
    listar_e_baixar_arquivos()
`;
}

/**
 * Script em Python para Leitura Direta de ZIPs e Cruzamento de Sócios e Empresas via Pandas
 */
export function generateRfbPandasProcessorScript(): string {
  return `"""
=============================================================================
PROCESSAMENTO E CRUZAMENTO DE DADOS ABERTOS DO CNPJ VIA PANDAS
Leitura de dentro dos arquivos ZIP sem necessidade de descompactação em disco
Layout oficial da Receita Federal do Brasil (RFB)
=============================================================================

Dependências:
pip install pandas
"""

import pandas as pd
import zipfile
import os

def ler_dados_socios_e_empresas(caminho_zip_empresa="./dados_cnpj/Empresas0.zip", caminho_zip_socios="./dados_cnpj/Socios0.zip"):
    """
    Lê os arquivos ZIP oficiais da Receita Federal e unifica os Sócios à Razão Social.
    """
    # Definindo os layouts fixos dos arquivos CSV da Receita Federal (separados por ';')
    colunas_empresas = [
        "cnpj_basico", "razao_social", "natureza_juridica", 
        "qualificacao_responsavel", "capital_social", "porte", "ente_federativo"
    ]
    colunas_socios = [
        "cnpj_basico", "identificador_socio", "nome_socio", 
        "cnpj_cpf_socio", "qualificacao_socio", "data_entrada", 
        "pais", "representante_legal", "nome_representante", 
        "qualificacao_representante", "faixa_etaria"
    ]

    print("[+] Lendo partição de Empresas do ZIP...")
    with zipfile.ZipFile(caminho_zip_empresa) as z_emp:
        nome_csv_emp = z_emp.namelist()[0]
        df_empresas = pd.read_csv(
            z_emp.open(nome_csv_emp), 
            sep=";", 
            header=None, 
            names=colunas_empresas, 
            encoding="latin1", 
            dtype=str
        )
    print(f"    Total de Empresas carregadas: {len(df_empresas)}")

    print("[+] Lendo partição de Sócios (QSA) do ZIP...")
    with zipfile.ZipFile(caminho_zip_socios) as z_soc:
        nome_csv_soc = z_soc.namelist()[0]
        df_socios = pd.read_csv(
            z_soc.open(nome_csv_soc), 
            sep=";", 
            header=None, 
            names=colunas_socios, 
            encoding="latin1", 
            dtype=str
        )
    print(f"    Total de Sócios carregados: {len(df_socios)}")

    # Junção das bases pelo CNPJ Básico (primeiros 8 dígitos do CNPJ)
    print("[+] Cruzando Empresas e Sócios pelo CNPJ Básico...")
    df_consolidado = pd.merge(df_empresas, df_socios, on="cnpj_basico", how="inner")
    
    print(f"[✓] Base Consolidada gerada com sucesso! Total de vínculos: {len(df_consolidado)}")
    return df_consolidado[["cnpj_basico", "razao_social", "nome_socio", "qualificacao_socio", "capital_social"]]

if __name__ == "__main__":
    if os.path.exists("./dados_cnpj/Empresas0.zip") and os.path.exists("./dados_cnpj/Socios0.zip"):
        resultado = ler_dados_socios_e_empresas()
        print("\\n=== AMOSTRA DOS DADOS PROCESSADOS (HEAD 10) ===")
        print(resultado.head(10))
        
        # Exporta amostra para CSV limpo
        resultado.head(1000).to_csv("amostra_socios_empresas.csv", index=False, sep=";")
        print("\\n[✓] Amostra de 1.000 registros exportada para 'amostra_socios_empresas.csv'")
    else:
        print("[-] Arquivos ZIP não encontrados em './dados_cnpj'. Execute primeiro o script de download.")
`;
}

/**
 * Informações Legais & Panorama de Bases Públicas por País (GDPR x LGPD)
 */
export const COUNTRY_PRIVACY_FISCAL_GUIDE = [
  {
    country: "Brasil",
    code: "BR",
    flag: "🇧🇷",
    legislation: "LGPD (Lei Geral de Proteção de Dados)",
    availability: "Gratuita, Completa e Aberta",
    statusColor: "emerald",
    sourceName: "Receita Federal do Brasil (Dados Abertos)",
    sourceUrl: "https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj",
    rawFilesUrl: "https://arquivos.receitafederal.gov.br/dados/cnpj/datos_abertos_cnpj/",
    description: "A Receita Federal disponibiliza uma base completa e gratuita de Dados Abertos do CNPJ em arquivos compactados (.zip/.csv). Ela contém Razão Social, CNAE (ramo de atividade), dados de contato cadastrados e a relação de Sócios/Proprietários (Quadro de Sócios e Administradores - QSA).",
    features: [
      "Download livre em lotes mensais (Empresas0 a 9, Socios0 a 9, Estabelecimentos0 a 9)",
      "Quadro de Sócios e Administradores (QSA) com nome e qualificação",
      "Capital Social e Porte Empresarial (ME, EPP, Demais)",
      "CNAE Primário e Secundários"
    ]
  },
  {
    country: "Portugal",
    code: "PT",
    flag: "🇵🇹",
    legislation: "GDPR (Regulamento Geral sobre a Proteção de Dados - UE)",
    availability: "Agregados Abertos + Certidão Permanente Paga / Consultas NIF.pt",
    statusColor: "amber",
    sourceName: "Portal de Dados Abertos (dados.gov.pt) & IRN / NIF.pt",
    sourceUrl: "https://dados.gov.pt/",
    rawFilesUrl: "https://www.nif.pt/",
    description: "O Portal de Dados Abertos e o Registo Comercial (IRN) publicam agregados e listagens parciais. Por questões de proteção de dados (GDPR), o nome de proprietários/sócios e e-mails diretos não são consolidados em um arquivo aberto gratuito centralizado, sendo necessário realizar consultas na certidão permanente ou usar scrapers em agregadores como NIF.pt e Racius.",
    features: [
      "Consulta individual gratuita de NIF, Denominação e CAE no NIF.pt",
      "Atos societários publicados no Portal do Cidadão / IRN",
      "Relatórios financeiros e balanços detalhados disponíveis na SABI / Racius",
      "Conformidade estrita com o Artigo 6º do GDPR para dados de pessoas singulares"
    ]
  },
  {
    country: "Espanha",
    code: "ES",
    flag: "🇪🇸",
    legislation: "GDPR (RGPD UE) & LOPDGDD",
    availability: "Diário Oficial BORME Aberto + Consultas Informa.es / Registro Mercantil",
    statusColor: "sky",
    sourceName: "Boletín Oficial del Registro Mercantil (BORME) & datos.gob.es",
    sourceUrl: "https://datos.gob.es/",
    rawFilesUrl: "https://www.boe.es/diario_borme/",
    description: "O Boletín Oficial del Registro Mercantil (BORME) publica atos constitutivos, nomeações e alterações societárias diariamente em formato de dados abertos. No entanto, não há um arquivo único e gratuito pronto para download que associe diretamente todos os e-mails e sócios de todas as empresas registradas.",
    features: [
      "Publicações diárias de constituição e alterações societárias no BORME",
      "Consultas públicas pontuais de CIF e Razão Social no Informa.es",
      "Acesso ao Registro Mercantil Central (RMC) para certidões de denominação",
      "Proteção de dados pessoais de administradores sob a normativa da AEPD"
    ]
  }
];

