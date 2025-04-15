import { jsPDF } from 'jspdf';

/**
 * Set up a PDF document with proper font support for Vietnamese
 * @param pdf The jsPDF instance to set up
 */
export const setupVietnameseFonts = (pdf: jsPDF) => {
  // Use default fonts without trying to add custom ones
  pdf.setFont('helvetica');

  // We don't add custom fonts because they cause Base64 decoding errors
  return pdf;
};

/**
 * Encode Vietnamese text into a form that's safe to use with jsPDF
 * @param text The Vietnamese text to encode
 * @returns A string safe for jsPDF
 */
export const encodeVietnameseText = (text: string): string => {
  // Replace Vietnamese characters with Latin equivalents
  // This loses diacritical marks but ensures the text works in PDF
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};
