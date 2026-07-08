export function numberToWords(num: number): string {
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if ((num = num.toString() as any).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != '00') ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'crore ' : '';
  str += (n[2] != '00') ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'lakh ' : '';
  str += (n[3] != '00') ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'thousand ' : '';
  str += (n[4] != '0') ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'hundred ' : '';
  str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) : '';
  return str.trim();
}
