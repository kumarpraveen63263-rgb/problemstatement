const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'Studentinfo', 'password.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

console.log('Sheets found:', workbook.SheetNames);
console.log('Total rows:', data.length);
console.log('Sample rows:', JSON.stringify(data.slice(0, 5), null, 2));
console.log('All rows:');
console.table(data);
