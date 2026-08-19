import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as https from 'https';

export interface BcvDualScrapeResult {
  usd: { rawString: string; rate: number };
  eur: { rawString: string; rate: number };
  fechaValorISO: string;
  fechaValorTexto: string;
  updatedAt: Date;
}

@Injectable()
export class BcvService {
  private readonly logger = new Logger(BcvService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Realiza Web Scraping directo y delimitado EXCLUSIVAMENTE al recuadro oficial
   * "TIPO DE CAMBIO DE REFERENCIA" del Banco Central de Venezuela (bcv.org.ve).
   */
  async scrapeLiveBcvRates(): Promise<BcvDualScrapeResult> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.bcv.org.ve',
        path: `/?nocache=${Date.now()}`,
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Cache-Control': 'no-cache',
        },
        rejectUnauthorized: false,
      };

      const req = https.request(options, (res) => {
        let html = '';
        res.on('data', (chunk) => {
          html += chunk;
        });

        res.on('end', () => {
          try {
            // Delimitar estrictamente el recuadro "TIPO DE CAMBIO DE REFERENCIA" alrededor de Fecha Valor
            const widgetEndPos = html.indexOf('Fecha Valor:');
            if (widgetEndPos === -1) {
              throw new Error('No se encontró la etiqueta "Fecha Valor:" en el recuadro del BCV');
            }

            const widgetBox = html.substring(Math.max(0, widgetEndPos - 3000), widgetEndPos + 400);

            // 1. Extraer Fecha Valor oficial del recuadro
            const fechaMatch = widgetBox.match(/class="date-display-single"[^>]*content="([^"]*)"[^>]*>([\s\S]*?)<\/span>/i);
            const fechaValorISO = fechaMatch ? fechaMatch[1].split('T')[0] : new Date().toISOString().split('T')[0];
            const fechaValorTexto = fechaMatch ? fechaMatch[2].trim().replace(/\s+/g, ' ') : 'Fecha Oficial';

            // 2. Extraer EUR (id="euro") exclusivamente dentro del recuadro
            const euroPos = widgetBox.indexOf('id="euro"');
            if (euroPos === -1) {
              throw new Error('No se encontró el contenedor id="euro" dentro del recuadro del BCV');
            }
            const euroSection = widgetBox.substring(euroPos, euroPos + 600);
            const euroMatch = euroSection.match(/<strong[^>]*class="[^"]*strong-tb[^"]*"[^>]*>([\s\S]*?)<\/strong>/i);

            if (!euroMatch) {
              throw new Error('No se encontró el valor EUR en <strong class="strong-tb">');
            }

            const rawEur = euroMatch[1].trim();
            // Redondear a 4 decimales para coincidir exactamente con el esquema Decimal(10,4) de PostgreSQL
            const eurRate = Math.round(parseFloat(rawEur.replace(/\./g, '').replace(',', '.')) * 10000) / 10000;

            // 3. Extraer USD (id="dolar") exclusivamente dentro del recuadro
            const dolarPos = widgetBox.indexOf('id="dolar"');
            if (dolarPos === -1) {
              throw new Error('No se encontró el contenedor id="dolar" dentro del recuadro del BCV');
            }
            const dolarSection = widgetBox.substring(dolarPos, dolarPos + 600);
            const dolarMatch = dolarSection.match(/<strong[^>]*class="[^"]*strong-tb[^"]*"[^>]*>([\s\S]*?)<\/strong>/i);

            if (!dolarMatch) {
              throw new Error('No se encontró el valor USD en <strong class="strong-tb">');
            }

            const rawUsd = dolarMatch[1].trim();
            // Redondear a 4 decimales para coincidir exactamente con el esquema Decimal(10,4) de PostgreSQL
            const usdRate = Math.round(parseFloat(rawUsd.replace(/\./g, '').replace(',', '.')) * 10000) / 10000;

            this.logger.log(`✅ Recuadro Oficial BCV [${fechaValorTexto}] -> USD: ${rawUsd} (${usdRate}) | EUR: ${rawEur} (${eurRate})`);

            resolve({
              usd: { rawString: rawUsd, rate: usdRate },
              eur: { rawString: rawEur, rate: eurRate },
              fechaValorISO,
              fechaValorTexto,
              updatedAt: new Date(),
            });
          } catch (err: any) {
            this.logger.error(`❌ Error parseando recuadro oficial del BCV: ${err.message}`);
            reject(err);
          }
        });
      });

      req.on('error', (err) => {
        this.logger.error(`❌ Error en petición HTTPS al BCV: ${err.message}`);
        reject(err);
      });

      req.end();
    });
  }

  /**
   * Sincronización Inteligente & Estable:
   * Solo guarda nuevos registros en PostgreSQL cuando el recuadro oficial del BCV cambia de fecha/tasa.
   */
  async syncBcvRateSmart() {
    const scraped = await this.scrapeLiveBcvRates();

    const activeUsdRecord = await this.prisma.exchangeRate.findFirst({
      where: { source: 'BCV_USD', isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const activeEurRecord = await this.prisma.exchangeRate.findFirst({
      where: { source: 'BCV_EUR', isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const currentUsdVal = activeUsdRecord ? Number(activeUsdRecord.rate) : 0;
    const currentEurVal = activeEurRecord ? Number(activeEurRecord.rate) : 0;

    const usdChanged = Math.abs(scraped.usd.rate - currentUsdVal) >= 0.0001;
    const eurChanged = Math.abs(scraped.eur.rate - currentEurVal) >= 0.0001;

    if (usdChanged) {
      await this.prisma.exchangeRate.updateMany({
        where: { source: 'BCV_USD', isActive: true },
        data: { isActive: false },
      });

      await this.prisma.exchangeRate.create({
        data: {
          rate: scraped.usd.rate,
          source: 'BCV_USD',
          isActive: true,
        },
      });
      this.logger.log(`🎉 [NUEVA TASA USD DEL RECUADRO OFICIAL (${scraped.fechaValorTexto})]: ${scraped.usd.rate} VES`);
    }

    if (eurChanged) {
      await this.prisma.exchangeRate.updateMany({
        where: { source: 'BCV_EUR', isActive: true },
        data: { isActive: false },
      });

      await this.prisma.exchangeRate.create({
        data: {
          rate: scraped.eur.rate,
          source: 'BCV_EUR',
          isActive: true,
        },
      });
      this.logger.log(`🎉 [NUEVA TASA EUR DEL RECUADRO OFICIAL (${scraped.fechaValorTexto})]: ${scraped.eur.rate} VES`);
    }

    const message = (usdChanged || eurChanged)
      ? `Nuevas tasas del recuadro oficial BCV (${scraped.fechaValorTexto}) registradas exitosamente.`
      : `Tasas del recuadro oficial BCV (${scraped.fechaValorTexto}) al día: USD ${scraped.usd.rate.toFixed(2)} Bs | EUR ${scraped.eur.rate.toFixed(2)} Bs. Sin variaciones.`;

    return {
      success: true,
      updated: usdChanged || eurChanged,
      usdChanged,
      eurChanged,
      message,
      usd: scraped.usd.rate,
      eur: scraped.eur.rate,
      fechaValorTexto: scraped.fechaValorTexto,
      updatedAt: scraped.updatedAt,
    };
  }

  /**
   * Cron Job programado: Revisa el recuadro del BCV cada 15 minutos en segundo plano
   */
  @Cron('*/15 * * * *')
  async handleCronPolling() {
    this.logger.log('⏰ [Cron Polling 15m] Verificando recuadro "Tipo de Cambio de Referencia" del BCV...');
    try {
      await this.syncBcvRateSmart();
    } catch (e: any) {
      this.logger.error(`Error en Cron Polling de BCV: ${e.message}`);
    }
  }

  /**
   * Obtiene las tasas activas actuales (USD y EUR)
   */
  async getCurrentRate() {
    const activeUsd = await this.prisma.exchangeRate.findFirst({
      where: { source: 'BCV_USD', isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const activeEur = await this.prisma.exchangeRate.findFirst({
      where: { source: 'BCV_EUR', isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeUsd || !activeEur) {
      return this.syncBcvRateSmart();
    }

    return {
      usd: Number(activeUsd.rate),
      eur: Number(activeEur.rate),
      updatedAt: activeUsd.createdAt,
    };
  }

  /**
   * Obtiene la bitácora / historial de cambios de tasas
   */
  async getRateHistory() {
    const history = await this.prisma.exchangeRate.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return history.map((record) => ({
      id: record.id,
      source: record.source,
      rate: Number(record.rate),
      isActive: record.isActive,
      createdAt: record.createdAt,
    }));
  }
}
