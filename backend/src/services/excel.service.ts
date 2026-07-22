import ExcelJS from 'exceljs';
import { Question } from '../types/kahoot.types.js';

export const createKahootWorkbook = async (questions: Question[]): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Kahoot');
  sheet.addRow(['Question', 'Answer 1', 'Answer 2', 'Answer 3', 'Answer 4', 'Time limit', 'Correct answer']);
  questions.forEach((item) => sheet.addRow([
    item.question, item.option1, item.option2, item.option3, item.option4, item.time, item.correct,
  ]));
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((column) => { column.width = 20; });
  sheet.getColumn(1).width = 35;
  return Buffer.from(await workbook.xlsx.writeBuffer());
};
