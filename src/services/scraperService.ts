import { Purchase, Product } from '../types';

/**
 * Attempts to parse an NFC-e URL.
 * Uses a CORS proxy to bypass browser restrictions.
 * If fetch or parsing fails (standard in frontend-only apps depending on SEFAZ instability),
 * it returns a simulated Purchase object based on the URL parameter to ensure the app is demonstratable.
 */
export const scraperService = {
  async processQRCodeUrl(url: string): Promise<Purchase> {
    try {
      // Using allorigins.win which is more permissive for production than corsproxy.io free tier
      const proxiedUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxiedUrl);
      
      if (!response.ok) {
        throw new Error('Falha ao conectar com o proxy de rede.');
      }
      
      const data = await response.json();
      const htmlText = data.contents;
      
      if (!htmlText) {
        throw new Error('Não foi possível obter o conteúdo da SEFAZ.');
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      // Note: Actual SEFAZ HTML structure varies heavily by state (SP, MG, RJ, etc.)
      const storeName = 
        doc.querySelector('#u20')?.textContent?.trim() || 
        doc.querySelector('.txtCenter .txtTopo')?.textContent?.trim() ||
        doc.querySelector('.NFCCabecalho_Nome')?.textContent?.trim() ||
        doc.querySelector('td.txtCenter')?.textContent?.trim();

      const totalText = 
        doc.querySelector('.txtMax')?.textContent?.trim() ||
        doc.querySelector('.totalNFe')?.textContent?.trim() ||
        doc.querySelector('#totalNFe')?.textContent?.trim();

      const accessKeyElement = doc.querySelector('.chave') || doc.querySelector('#chave') || doc.querySelector('.txtChave');
      const accessKey = accessKeyElement?.textContent?.replace(/\D/g, '') || url.match(/p=(\d{44})/)?.[1] || url.match(/p=(\d+)/)?.[1];

      if (storeName && totalText) {
        // If we successfully found something that looks like an NFC-e page
        const total = parseFloat(totalText.replace('Total R$ ', '').replace('R$', '').replace(',', '.').trim());
        
        return {
          id: crypto.randomUUID(),
          accessKey: accessKey || 'UNKNOWN_KEY',
          date: new Date().toISOString(),
          total: isNaN(total) ? 0 : total,
          store: {
            name: storeName || 'Estabelecimento Desconhecido',
            cnpj: doc.querySelector('.text')?.textContent?.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)?.[0] || 
                  doc.body.textContent?.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)?.[0] || 
                  '00.000.000/0000-00'
          },
          products: extractProducts(doc),
          category: 'Outros',
          qrCodeUrl: url,
          createdAt: Date.now()
        };
      } else {
        throw new Error('Não foi possível extrair os campos padrão da NFC-e. Verifique se o QR Code é válido.');
      }
      
    } catch (error: any) {
      console.error('Scraping failed:', error);
      throw new Error(error.message || 'Erro ao conectar com a SEFAZ ou processar os dados da nota.');
    }
  }
};

function extractProducts(doc: Document): Product[] {
  const products: Product[] = [];
  
  // Custom parser logic for multiple SEFAZ layouts
  // Standard MT/MS/SP layout
  const productRows = doc.querySelectorAll('#tabResult tr, table.table tr, .table-items tr, #tableItens tr');
  
  productRows.forEach((row) => {
    const nameEl = row.querySelector('.txtTit') || row.querySelector('td:first-child .txtTit') || row.querySelector('td:first-child');
    if (nameEl && nameEl.textContent && !nameEl.textContent.includes('Vl. Total') && nameEl.textContent.trim().length > 2) {
      const name = nameEl.textContent.trim();
      
      const parseNum = (selector: string) => {
        const el = row.querySelector(selector);
        if (!el) return null;
        const text = el.textContent || '';
        const match = text.match(/[\d,.]+/);
        if (!match) return null;
        let val = match[0];
        // Handle Brazilian format (1.234,56)
        if (val.includes('.') && val.includes(',')) {
          val = val.replace(/\./g, '').replace(',', '.');
        } else {
          val = val.replace(',', '.');
        }
        return parseFloat(val);
      };

      const quantity = parseNum('.Rqtd') || parseNum('td:nth-child(2)') || 1;
      const unitPrice = parseNum('.RvlUnit') || parseNum('.valor') || 0;
      const unit = row.querySelector('.RUN')?.textContent?.replace(/.*:/, '')?.trim() || 'UN';
      const code = row.querySelector('.RCod')?.textContent?.match(/\d+/)?.[0] || '';
      
      // Basic validation to avoid adding non-product rows
      if (unitPrice > 0 || name.length > 5) {
        products.push({
          id: crypto.randomUUID(),
          name,
          quantity: quantity,
          price: unitPrice,
          unit: unit,
          code: code || undefined
        });
      }
    }
  });

  return products;
}
