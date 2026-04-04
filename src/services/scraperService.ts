import { Purchase, Product } from "../types";

/**
 * Attempts to parse an NFC-e URL.
 * Uses a CORS proxy to bypass browser restrictions.
 * If fetch or parsing fails (standard in frontend-only apps depending on SEFAZ instability),
 * it returns a simulated Purchase object based on the URL parameter to ensure the app is demonstratable.
 */
export const scraperService = {
  generateUrlFromAccessKey(key: string): string {
    const cleanKey = key.replace(/\D/g, "");
    if (cleanKey.length !== 44) return "";

    // Mato Grosso do Sul (UF 50) is the primary focus
    return `http://www.dfe.ms.gov.br/nfce/consulta?chNFe=${cleanKey}`;
  },

  async processQRCodeUrl(url: string): Promise<Purchase> {
    // Enforce HTTPS if possible
    const targetUrl = url.replace("http://", "https://").trim();

    const fetchWithProxy = async (
      proxyUrl: string,
      isAllOriginsGet: boolean = false,
      headers: Record<string, string> = {},
    ) => {
      const response = await fetch(proxyUrl, { headers });
      if (!response.ok) throw new Error(`Proxy error: ${response.status}`);

      if (isAllOriginsGet) {
        const data = await response.json();
        return data.contents;
      }
      return await response.text();
    };

    const proxyOptions = [
      {
        url: `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
        isAllOriginsGet: false,
      },
      {
        url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
        isAllOriginsGet: true,
      },
      {
        url: `https://proxy.cors.sh/${targetUrl}`,
        isAllOriginsGet: false,
        headers: { "x-cors-gratis": "true" },
      },
      {
        url: `https://thingproxy.freeboard.io/fetch/${targetUrl}`,
        isAllOriginsGet: false,
      },
      {
        url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
        isAllOriginsGet: false,
      },
      {
        url: `/api/proxy?url=${encodeURIComponent(targetUrl)}`,
        isAllOriginsGet: false,
      },
    ];

    let htmlText = "";
    let lastError = null;

    const isSefazHtml = (html: string): boolean => {
      if (!html || html.length < 500) return false;
      const lowerHtml = html.toLowerCase();
      // Check for common SEFAZ/NFC-e keywords and avoid the app's own Vite client
      return (
        (lowerHtml.includes("sefaz") ||
          lowerHtml.includes("nfc-e") ||
          lowerHtml.includes("nota fiscal") ||
          lowerHtml.includes("fazenda")) &&
        !lowerHtml.includes("/@vite/client")
      );
    };

    for (const proxy of proxyOptions) {
      try {
        const result = await fetchWithProxy(
          proxy.url,
          proxy.isAllOriginsGet,
          proxy.headers || {},
        );
        if (isSefazHtml(result)) {
          htmlText = result;
          break;
        } else {
          console.warn(`Proxy ${proxy.url} returned non-SEFAZ content.`);
        }
      } catch (e) {
        lastError = e;
        console.warn(`Proxy failed: ${proxy.url}`, e);
        continue;
      }
    }

    if (!htmlText) {
      throw (
        lastError ||
        new Error(
          "Não foi possível obter uma resposta válida do portal SEFAZ. Tente novamente em alguns instantes.",
        )
      );
    }

    try {
      const parser = new DOMParser();
      // Pre-process HTML to remove potential double <html> tags that might confuse some parsers
      const cleanHtml = htmlText
        .replace(/<\?xml[^?]*\?>/g, "")
        .replace(/<!DOCTYPE[^>]*>/g, "");
      const doc = parser.parseFromString(cleanHtml, "text/html");

      // Specific selectors for MS SEFAZ with broader fallbacks
      let storeName =
        doc.querySelector("#u20")?.textContent?.trim() ||
        doc.querySelector(".txtTopo")?.textContent?.trim() ||
        doc.querySelector(".txtCenter .txtTopo")?.textContent?.trim();

      let totalText =
        doc.querySelector(".txtMax")?.textContent?.trim() ||
        doc.querySelector(".totalNumb.txtMax")?.textContent?.trim() ||
        doc.querySelector("#totalNota .totalNumb.txtMax")?.textContent?.trim() ||
        doc.querySelector(".totalNFe")?.textContent?.trim();

      // REGEX FALLBACKS (Accounting for potential encoding and nested structures)
      // Store Name fallback
      if (!storeName) {
        const storeMatch = 
          htmlText.match(/id="u20"[^>]*>([^<]+)/i) || 
          htmlText.match(/class="[^"]*txtTopo[^"]*"[^>]*>([^<]+)/i) ||
          htmlText.match(/<div[^>]*class="txtCenter"[^>]*>.*?<div[^>]*>([^<]+)/is);
        if (storeMatch) storeName = storeMatch[1].trim();
      }

      // Total Value fallback
      if (!totalText) {
        // Search for the number following "Valor a pagar" or within totalNumb txtMax
        const totalMatch = 
          htmlText.match(/class="[^"]*totalNumb[^"]*txtMax[^"]*"[^>]*>([^<]+)/i) ||
          htmlText.match(/Valor a pagar R\$:?<\/label>\s*<span[^>]*class="totalNumb[^"]*"[^>]*>([^<]+)/i) ||
          htmlText.match(/Valor a pagar.*?R\$:?.*?([\d,.]+)/is);
        if (totalMatch) totalText = totalMatch[1].trim();
      }

      // Cleanup and decode basics if extracted via regex
      if (storeName) {
        storeName = storeName.replace(/&[a-z0-9]+;/gi, (match) => {
          const entities: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&atilde;': 'ã', '&Atilde;': 'Ã', '&otilde;': 'õ', '&Otilde;': 'Õ' };
          return entities[match] || match;
        });
      }

      // CNPJ extraction
      const cnpjMatch =
        doc.body.textContent?.match(/CNPJ:\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/) || 
        htmlText.match(/CNPJ:\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
      const cnpj = cnpjMatch?.[1] || "00.000.000/0000-00";

      const accessKeyElement =
        doc.querySelector(".chave") ||
        doc.querySelector("#chave") ||
        doc.querySelector(".txtChave");
      const accessKey =
        accessKeyElement?.textContent?.replace(/\D/g, "") ||
        url.match(/p=(\d{44})/)?.[1] ||
        url.match(/p=(\d{44})/)?.[1];

      // Extract emission date (Format: DD/MM/YYYY HH:MM:SS)
      const dateMatch =
        doc.body.textContent?.match(/Emiss[ãa]o:\s*(\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2}:\d{2})?)/i) ||
        htmlText.match(/Emiss(?:[ãa]o|&atilde;o|&Atilde;o):?\s*(\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2}:\d{2})?)/i);
      let emissionDate = new Date().toISOString();

      if (dateMatch?.[1]) {
        try {
          const dateStr = dateMatch[1].trim();
          const parts = dateStr.split(/[\/\s:]/);
          const [d, m, y] = parts.map((p) => parseInt(p));
          const h = parts[3] ? parseInt(parts[3]) : 0;
          const min = parts[4] ? parseInt(parts[4]) : 0;
          const s = parts[5] ? parseInt(parts[5]) : 0;

          const parsedDate = new Date(y, m - 1, d, h, min, s);
          if (!isNaN(parsedDate.getTime())) {
            emissionDate = parsedDate.toISOString();
          }
        } catch (e) {
          console.warn("Failed to parse emission date:", dateMatch[1]);
        }
      }

      if (storeName && totalText) {
        const totalRaw = totalText.replace('Total R$ ', '').replace('R$', '').replace(',', '.').replace(/[^\d.]/g, '').trim();
        const total = parseFloat(totalRaw);

        return {
          id: crypto.randomUUID(),
          accessKey: accessKey || "UNKNOWN_KEY",
          date: emissionDate,
          total: isNaN(total) ? 0 : total,
          store: {
            name: storeName,
            cnpj: cnpj,
          },
          products: extractProducts(doc, htmlText),
          category: "Outros",
          qrCodeUrl: url,
          createdAt: Date.now(),
        };
      } else {
        console.warn("Extraction failed details:", { hasStore: !!storeName, hasTotal: !!totalText, htmlPreview: htmlText.substring(0, 300) });
        throw new Error(
          "Não foi possível identificar o nome da loja ou o valor total. Verifique se o QR Code é do Mato Grosso do Sul ou tente novamente."
        );
      }
    } catch (error: any) {
      console.error("Scraping failed:", error);
      throw new Error(error.message || "Erro ao processar os dados da nota.");
    }
  },
};

function extractProducts(doc: Document, htmlText: string): Product[] {
  const products: Product[] = [];
  const productRows = doc.querySelectorAll("#tabResult tr");

  if (productRows.length > 0) {
    productRows.forEach((row) => {
      const nameEl = row.querySelector(".txtTit");
      if (
        nameEl &&
        nameEl.textContent &&
        !nameEl.textContent.includes("Vl. Total")
      ) {
        const name = nameEl.textContent.trim();

        const parseNum = (selector: string) => {
          const el = row.querySelector(selector);
          if (!el) return null;
          const text = el.textContent || "";
          const match = text.match(/[\d,.]+/);
          if (!match) return null;
          let val = match[0];
          // Handle Brazilian format
          if (val.includes(".") && val.includes(",")) {
            val = val.replace(/\./g, "").replace(",", ".");
          } else {
            val = val.replace(",", ".");
          }
          return parseFloat(val);
        };

        const quantity = parseNum(".Rqtd") || 1;
        const unitPrice = parseNum(".RvlUnit") || 0;
        const unit =
          row.querySelector(".RUN")?.textContent?.replace(/.*:/, "")?.trim() ||
          "UN";
        const code =
          row.querySelector(".RCod")?.textContent?.match(/\d+/)?.[0] || "";

        if (unitPrice > 0 || name.length > 2) {
          products.push({
            id: crypto.randomUUID(),
            name,
            quantity,
            price: unitPrice,
            unit,
            code: code || undefined,
          });
        }
      }
    });
  }

  // Regex fallback for products if the table was not parsed correctly
  if (products.length === 0) {
    // Try to find product blocks in raw HTML (common in JSF/XSLT results)
    const productRegex =
      /<span class="txtTit">([^<]+)<\/span>.*?class="Rqtd">.*?(\d+(?:,\d+)?)<\/span>.*?class="RvlUnit">.*?(\d+(?:,\d+)?)<\/span>/gs;
    let match;
    while ((match = productRegex.exec(htmlText)) !== null) {
      const name = match[1].trim();
      const quantity = parseFloat(match[2].replace(",", "."));
      const price = parseFloat(match[3].replace(",", "."));
      if (name && !isNaN(price)) {
        products.push({
          id: crypto.randomUUID(),
          name,
          quantity: isNaN(quantity) ? 1 : quantity,
          price,
          unit: "UN",
        });
      }
    }
  }

  return products;
}
