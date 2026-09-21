import {
  CURRENCIES,
  DEFAULT_COUNTRY,
  DEFAULT_BUSINESS_PROFILE,
  DEFAULT_HIGH_TICKET_NICHES,
  HIGH_TICKET_NICHES_BY_COUNTRY
} from "../constants";
import { BusinessProfile, CurrencyConfig, HighTicketNicheRecommendation } from "../types";

const COUNTRY_STORAGE_KEY = 'architect_country_v1';

export function getSavedCountry(): string {
  try {
    const raw = localStorage.getItem(COUNTRY_STORAGE_KEY);
    if (raw && CURRENCIES[raw]) return raw;
  } catch (e) {
    console.error("Failed to load country", e);
  }
  return DEFAULT_COUNTRY;
}

export function hasSavedCountryChoice(): boolean {
  try {
    const raw = localStorage.getItem(COUNTRY_STORAGE_KEY);
    return !!raw && !!CURRENCIES[raw];
  } catch (e) {
    return false;
  }
}

export function saveCountry(country: string) {
  if (!CURRENCIES[country]) return;
  try {
    localStorage.setItem(COUNTRY_STORAGE_KEY, country);
  } catch (e) {
    console.error("Failed to save country", e);
  }
}

export function getCurrencyConfig(country: string): CurrencyConfig {
  return CURRENCIES[country] || CURRENCIES[DEFAULT_COUNTRY];
}

export function formatCurrencyValue(value: number, country: string): string {
  const config = getCurrencyConfig(country);
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      maximumFractionDigits: 0
    }).format(value);
  } catch (e) {
    return `${config.symbol} ${value.toLocaleString('pt-BR')}`;
  }
}

export function formatCurrencySymbol(country: string): string {
  return getCurrencyConfig(country).symbol;
}

function adaptNichesToCurrency(niches: HighTicketNicheRecommendation[], symbol: string): HighTicketNicheRecommendation[] {
  return niches.map(n => ({
    ...n,
    tag: n.tag.replace(/R\$|US\$|£|€/g, symbol),
    estimatedTicket: n.estimatedTicket.replace(/R\$|US\$|£|€/g, symbol)
  }));
}

export function getHighTicketNichesForCountry(country: string): HighTicketNicheRecommendation[] {
  if (HIGH_TICKET_NICHES_BY_COUNTRY[country]) {
    return HIGH_TICKET_NICHES_BY_COUNTRY[country];
  }
  const config = getCurrencyConfig(country);
  return adaptNichesToCurrency(DEFAULT_HIGH_TICKET_NICHES, config.symbol);
}

const COUNTRY_DEFAULT_TICKETS: Record<string, string> = {
  "Portugal": "€5.000 - €25.000 / projeto (ou MRR de €2.500/mês)",
  "Espanha": "€6.000 - €28.000 / proyecto (o MRR de €2.500/mes)",
  "Estados Unidos": "$15,000 - $50,000 / project (or $5,000/mo MRR)",
  "Reino Unido": "£12,000 - £40,000 / project (or £3,500/mo MRR)",
  "França": "€6.000 - €28.000 / projet (ou MRR de €2.500/mois)",
  "Alemanha": "€6.000 - €30.000 / Projekt (oder €2.500/Monat MRR)",
  "Itália": "€6.000 - €28.000 / progetto (o MRR di €2.500/mese)",
  "Países Baixos": "€6.000 - €30.000 / project (of €2.500/maand MRR)",
  "México": "$150,000 - $700,000 MXN / proyecto",
  "Chile": "$5.000.000 - $25.000.000 CLP / proyecto",
  "Colômbia": "$20.000.000 - $100.000.000 COP / proyecto"
};

export function getBusinessProfileForCountry(country: string): BusinessProfile {
  const base = DEFAULT_BUSINESS_PROFILE;
  return {
    ...base,
    websiteUrl: country === 'Brasil' ? base.websiteUrl : 'https://meusite.pt',
    ticketMedio: COUNTRY_DEFAULT_TICKETS[country] || base.ticketMedio,
    recommendedHighTicketNiches: getHighTicketNichesForCountry(country)
  };
}