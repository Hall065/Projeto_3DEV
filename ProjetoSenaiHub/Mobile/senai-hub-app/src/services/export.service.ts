import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { Platform } from 'react-native';

export type ExportRow = Record<string, string | number | boolean | null | undefined>;

function sanitizeFileName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function formatCell(value: unknown) {
  if (value == null) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return String(value);
}

function escapeHtml(value: unknown) {
  return formatCell(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function gerarHTMLRelatorio(dados: ExportRow[], titulo: string) {
  const columns = Array.from(new Set(dados.flatMap((row) => Object.keys(row))));
  const rows = dados.length ? dados : [{ mensagem: 'Nenhum dado encontrado.' }];
  const tableColumns = columns.length ? columns : ['mensagem'];

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 28px; color: #0B2F4F; }
          h1 { font-size: 22px; margin: 0 0 4px; }
          p { margin: 0 0 18px; color: #64748B; }
          table { border-collapse: collapse; width: 100%; font-size: 11px; }
          th { background: #0B2F4F; color: white; text-align: left; }
          th, td { border: 1px solid #D7DEE8; padding: 8px; }
          tr:nth-child(even) { background: #F6F8FB; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(titulo)}</h1>
        <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
        <table>
          <thead>
            <tr>${tableColumns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr>${tableColumns
                    .map((column) => `<td>${escapeHtml(row[column])}</td>`)
                    .join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

function downloadBlobWeb(blob: Blob, fileName: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Download web indisponivel neste ambiente.');
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}

async function shareFile(uri: string, mimeType: string, dialogTitle: string) {
  const available = await Sharing.isAvailableAsync();
  if (!available) return uri;
  await Sharing.shareAsync(uri, { mimeType, dialogTitle });
  return uri;
}

export const exportService = {
  async exportarPDF(dados: ExportRow[], titulo: string) {
    const html = gerarHTMLRelatorio(dados, titulo);
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        return downloadBlobWeb(new Blob([html], { type: 'text/html;charset=utf-8' }), `${sanitizeFileName(titulo)}.html`);
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      return 'web-print';
    }

    const { uri } = await Print.printToFileAsync({ html });
    return shareFile(uri, 'application/pdf', `Exportar ${titulo}`);
  },

  async exportarExcel(dados: ExportRow[], nomeArquivo: string) {
    const ws = XLSX.utils.json_to_sheet(dados.length ? dados : [{ mensagem: 'Nenhum dado encontrado.' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    const fileName = `${sanitizeFileName(nomeArquivo)}.xlsx`;

    if (Platform.OS === 'web') {
      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as BlobPart;
      return downloadBlobWeb(
        new Blob([wbout], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        fileName
      );
    }

    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return shareFile(
      uri,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `Exportar ${nomeArquivo}`
    );
  },
};
