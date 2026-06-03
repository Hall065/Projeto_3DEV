import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

type ExportRow = Record<string, string | number | boolean | null | undefined>;

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
        <h1>${titulo}</h1>
        <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
        <table>
          <thead>
            <tr>${tableColumns.map((column) => `<th>${column}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr>${tableColumns
                    .map((column) => `<td>${formatCell(row[column])}</td>`)
                    .join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
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
    const { uri } = await Print.printToFileAsync({ html });
    return shareFile(uri, 'application/pdf', `Exportar ${titulo}`);
  },

  async exportarExcel(dados: ExportRow[], nomeArquivo: string) {
    const ws = XLSX.utils.json_to_sheet(dados.length ? dados : [{ mensagem: 'Nenhum dado encontrado.' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = `${FileSystem.documentDirectory}${sanitizeFileName(nomeArquivo)}.xlsx`;
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
