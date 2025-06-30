import * as XLSX from 'xlsx';
import { SearchResult } from '@/types/search';

export function exportToExcel(results: SearchResult[], filename?: string) {
  if (results.length === 0) {
    throw new Error('エクスポートするデータがありません');
  }

  // データを整形
  const data = results.map((result, index) => ({
    '番号': index + 1,
    '氏名': result.name,
    '会社名': result.company || '',
    '役職': result.position || '',
    '住所': result.address || '',
    '電話番号': result.phone || '',
    'メールアドレス': result.email || '',
    'ウェブサイト': result.website || '',
    '出典': result.source,
    '概要': result.snippet,
  }));

  // ワークブックを作成
  const wb = XLSX.utils.book_new();
  
  // ワークシートを作成
  const ws = XLSX.utils.json_to_sheet(data);

  // 列幅を調整
  const colWidths = [
    { wch: 6 },  // 番号
    { wch: 15 }, // 氏名
    { wch: 25 }, // 会社名
    { wch: 15 }, // 役職
    { wch: 30 }, // 住所
    { wch: 15 }, // 電話番号
    { wch: 25 }, // メールアドレス
    { wch: 30 }, // ウェブサイト
    { wch: 20 }, // 出典
    { wch: 40 }, // 概要
  ];
  ws['!cols'] = colWidths;

  // ワークシートをワークブックに追加
  XLSX.utils.book_append_sheet(wb, ws, '検索結果');

  // ファイル名を生成
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const defaultFilename = `customer-search-${timestamp}.xlsx`;
  const finalFilename = filename || defaultFilename;

  // ファイルをダウンロード
  XLSX.writeFile(wb, finalFilename);

  return {
    filename: finalFilename,
    recordCount: results.length,
  };
}