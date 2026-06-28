/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { Order, Language } from '../types';
import { getDishes } from './storage';

// Simple Cyrillic-to-Latin transliterator to prevent font encoding glitches in jsPDF's standard Helvetica font
const transliterate = (text: string): string => {
  const map: Record<string, string> = {
    'А': 'A', 'а': 'a', 'Б': 'B', 'б': 'b', 'В': 'V', 'в': 'v', 'Г': 'G', 'г': 'g',
    'Д': 'D', 'д': 'd', 'Е': 'E', 'е': 'e', 'Ё': 'Yo', 'ё': 'yo', 'Ж': 'Zh', 'ж': 'zh',
    'З': 'Z', 'з': 'z', 'И': 'I', 'и': 'i', 'Й': 'Y', 'й': 'y', 'К': 'K', 'к': 'k',
    'Л': 'L', 'л': 'l', 'М': 'M', 'м': 'm', 'Н': 'N', 'н': 'n', 'О': 'O', 'о': 'o',
    'П': 'P', 'п': 'p', 'Р': 'R', 'р': 'r', 'С': 'S', 'с': 's', 'Т': 'T', 'т': 't',
    'У': 'U', 'у': 'u', 'Ф': 'F', 'ф': 'f', 'Х': 'Kh', 'х': 'kh', 'Ц': 'Ts', 'ц': 'ts',
    'Ч': 'Ch', 'ч': 'ch', 'Ш': 'Sh', 'ш': 'sh', 'Щ': 'Shch', 'щ': 'shch', 'Ъ': '', 'ъ': '',
    'Ы': 'Y', 'ы': 'y', 'Ь': '', 'ь': '', 'Э': 'E', 'э': 'e', 'Ю': 'Yu', 'ю': 'yu',
    'Я': 'Ya', 'я': 'ya', 'Ў': "O'", 'ў': "o'", 'Қ': 'Q', 'қ': 'q', 'Ғ': "G'", 'ғ': "g'",
    'Ҳ': 'H', 'ҳ': 'h'
  };
  return text.split('').map(char => map[char] || char).join('');
};

export const generateReceiptPDF = async (order: Order, language: Language) => {
  const allDishes = await getDishes();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Localized dictionary for the PDF
  const dictionary = {
    uz: {
      title: 'ONLAYN MENYU XIZMATI',
      subtitle: 'Premium ta\'m va yuksak xizmat ko\'rsatish maskani',
      receiptTitle: 'RASMIY KVI_TANSIYA (CHEK)',
      table: 'Stol',
      orderId: 'Buyurtma ID',
      date: 'Sana',
      time: 'Vaqt',
      status: 'Holati',
      statusPaid: 'YETKAZILDI VA TO\'LANDI',
      colNo: 'T/r',
      colName: 'Taom nomi',
      colQty: 'Soni',
      colPrice: 'Narxi',
      colTotal: 'Jami',
      notes: 'Izoh',
      totalAmount: 'Umumiy summa',
      subtotal: 'Oraliq summa',
      serviceCharge: 'Xizmat haqi',
      tableSittingFee: 'Stol o\'tirish haqi',
      thanks: 'Tashrifingiz uchun rahmat! Yoqimli ishtaha!',
      contact: 'Onlayn Menyu Xizmati, O\'zbekiston',
      currency: 'so\'m'
    },
    ru: {
      title: 'ONLAYN MENYU XIZMATI',
      subtitle: 'Mesto roskoshnogo vkusa i premium obsluzhivaniya',
      receiptTitle: 'OFITSIALNIY CHEK',
      table: 'Stol',
      orderId: 'ID Zakaza',
      date: 'Data',
      time: 'Vremya',
      status: 'Status',
      statusPaid: 'DOSTAVLENO I OPLACHENO',
      colNo: 'No.',
      colName: 'Naimenovanie',
      colQty: 'Kol-vo',
      colPrice: 'Tsena',
      colTotal: 'Itogo',
      notes: 'Primechanie',
      totalAmount: 'Obshchaya summa',
      subtotal: 'Podytog',
      serviceCharge: 'Obsluzhivanie',
      tableSittingFee: 'Plata za stol',
      thanks: 'Spasibo za vizit! Priyatnogo appetita!',
      contact: 'Onlayn Menyu Xizmati, Uzbekistan',
      currency: 'sum'
    },
    en: {
      title: 'ONLAYN MENYU XIZMATI',
      subtitle: 'A place of luxurious taste and premium service',
      receiptTitle: 'OFFICIAL RECEIPT',
      table: 'Table',
      orderId: 'Order ID',
      date: 'Date',
      time: 'Time',
      status: 'Status',
      statusPaid: 'DELIVERED & PAID',
      colNo: 'No.',
      colName: 'Item Name',
      colQty: 'Qty',
      colPrice: 'Price',
      colTotal: 'Total',
      notes: 'Notes',
      totalAmount: 'Total Amount',
      subtotal: 'Subtotal',
      serviceCharge: 'Service charge',
      tableSittingFee: 'Table sitting fee',
      thanks: 'Thank you for dining with us! Bon Appetit!',
      contact: 'Onlayn Menyu Xizmati, Uzbekistan',
      currency: 'so\'m'
    }
  };

  const labels = dictionary[language] || dictionary.en;

  // Transliterate specific elements for safety to avoid rendering weird characters in default Latin font
  const cleanTitle = transliterate(labels.title);
  const cleanSubtitle = transliterate(labels.subtitle);
  const cleanReceiptTitle = transliterate(labels.receiptTitle);
  const cleanTable = transliterate(labels.table);
  const cleanOrderId = transliterate(labels.orderId);
  const cleanDate = transliterate(labels.date);
  const cleanTime = transliterate(labels.time);
  const cleanStatus = transliterate(labels.status);
  const cleanStatusPaid = transliterate(labels.statusPaid);
  const cleanColNo = transliterate(labels.colNo);
  const cleanColName = transliterate(labels.colName);
  const cleanColQty = transliterate(labels.colQty);
  const cleanColPrice = transliterate(labels.colPrice);
  const cleanColTotal = transliterate(labels.colTotal);
  const cleanNotes = transliterate(labels.notes);
  const cleanTotalAmount = transliterate(labels.totalAmount);
  const cleanSubtotal = labels.subtotal ? transliterate(labels.subtotal) : 'Subtotal';
  const cleanServiceCharge = labels.serviceCharge ? transliterate(labels.serviceCharge) : 'Service Charge';
  const cleanTableSittingFee = labels.tableSittingFee ? transliterate(labels.tableSittingFee) : 'Sitting Fee';
  const cleanThanks = transliterate(labels.thanks);
  const cleanContact = transliterate(labels.contact);
  const cleanCurrency = transliterate(labels.currency);

  const formatPrice = (num: number) => {
    return num.toLocaleString('uz-UZ') + ' ' + cleanCurrency;
  };

  // Setup Document
  doc.setFont('helvetica', 'normal');

  // Decorative header accent line (amber/gold color: #D97706 -> RGB 217, 119, 6)
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1.5);
  doc.line(15, 12, 195, 12);

  // Restaurant Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.text(cleanTitle, 105, 23, { align: 'center' });

  // Slogan
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(115, 115, 115);
  doc.text(cleanSubtitle, 105, 29, { align: 'center' });

  // Receipt Identifier
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6);
  doc.text(cleanReceiptTitle, 105, 37, { align: 'center' });

  // Elegant divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, 41, 195, 41);

  // Metadata Columns
  const dateObj = new Date(order.createdAt);
  const dateStr = dateObj.toLocaleDateString('uz-UZ');
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  // Left Column Metas
  doc.text(`${cleanTable}:`, 15, 48);
  doc.text(`${cleanOrderId}:`, 15, 54);
  doc.text(`${cleanDate} / ${cleanTime}:`, 15, 60);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(`${order.tableNumber}`, 45, 48);
  doc.text(`#${order.id.slice(-8).toUpperCase()}`, 45, 54);
  doc.text(`${dateStr}  ${timeStr}`, 45, 60);

  // Right Column Metas
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text(`${cleanStatus}:`, 120, 48);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 124, 65); // Green for Delivered/Paid
  doc.text(cleanStatusPaid, 140, 48);

  // Separator
  doc.setDrawColor(220, 220, 220);
  doc.line(15, 66, 195, 66);

  // Table Headers
  doc.setFillColor(245, 245, 245);
  doc.rect(15, 71, 180, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(cleanColNo, 18, 76.5);
  doc.text(cleanColName, 30, 76.5);
  doc.text(cleanColQty, 115, 76.5, { align: 'right' });
  doc.text(cleanColPrice, 150, 76.5, { align: 'right' });
  doc.text(cleanColTotal, 192, 76.5, { align: 'right' });

  // Table Items
  let currentY = 85;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);

  order.items.forEach((item, index) => {
    // Check if we are running out of page height
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }

    const dishNameRaw = item.dishName[language] || item.dishName.en;
    const dishNameClean = transliterate(dishNameRaw);

    doc.text(`${index + 1}`, 18, currentY);
    
    // Auto-wrap long names if they exceed boundaries
    const maxNameWidth = 65;
    const textLines = doc.splitTextToSize(dishNameClean, maxNameWidth);
    doc.text(textLines, 30, currentY);

    const dishRef = allDishes.find(d => d.id === item.dishId);
    const isKg = dishRef?.unit === 'kg' || item.quantity % 1 !== 0;
    const unitText = isKg 
      ? (language === 'uz' ? ' kg' : language === 'ru' ? ' kg' : ' kg') 
      : (language === 'uz' ? ' dona' : language === 'ru' ? ' sht' : ' pcs');

    doc.text(`${item.quantity}${unitText}`, 115, currentY, { align: 'right' });
    doc.text(formatPrice(item.price), 150, currentY, { align: 'right' });
    doc.text(formatPrice(item.price * item.quantity), 192, currentY, { align: 'right' });

    // Handle line count for next offset
    const lineCount = textLines.length;
    const rowHeight = lineCount > 1 ? (lineCount * 4) + 2 : 7;

    // Draw bottom row divider line
    doc.setDrawColor(240, 240, 240);
    doc.line(15, currentY + rowHeight - 2, 195, currentY + rowHeight - 2);

    currentY += rowHeight;
  });

  // Totals Area
  currentY += 4;
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasServiceCharge = order.serviceCharge !== undefined && order.serviceCharge > 0;
  const hasSittingFee = order.tableSittingFee !== undefined && order.tableSittingFee > 0;

  let rectHeight = 12;
  if (hasServiceCharge) rectHeight += 6;
  if (hasSittingFee) rectHeight += 6;
  rectHeight += 2; // extra padding

  // Draw light gold/amber background box for final totals
  doc.setFillColor(254, 252, 232); // Tailwind amber-50 light tint
  doc.setDrawColor(251, 191, 36); // amber-400
  doc.setLineWidth(0.2);
  doc.rect(110, currentY, 85, rectHeight, 'FD');

  let textY = currentY + 5;

  if (hasServiceCharge || hasSittingFee) {
    // Show subtotal line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`${cleanSubtotal}:`, 115, textY);
    doc.text(formatPrice(subtotal), 190, textY, { align: 'right' });
    textY += 6;

    if (hasServiceCharge) {
      doc.text(`${cleanServiceCharge}:`, 115, textY);
      doc.text(`+${formatPrice(order.serviceCharge || 0)}`, 190, textY, { align: 'right' });
      textY += 6;
    }

    if (hasSittingFee) {
      doc.text(`${cleanTableSittingFee}:`, 115, textY);
      doc.text(`+${formatPrice(order.tableSittingFee || 0)}`, 190, textY, { align: 'right' });
      textY += 6;
    }

    // Add separator line inside the box
    doc.setDrawColor(252, 211, 77); // amber-200
    doc.line(112, textY - 3, 193, textY - 3);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(`${cleanTotalAmount}:`, 115, textY + 1);
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  doc.text(formatPrice(order.totalAmount), 190, textY + 1, { align: 'right' });

  currentY += rectHeight + 4;

  // Order notes if any
  if (order.notes && order.notes.trim()) {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    const cleanNotesLabel = transliterate(cleanNotes);
    const cleanNotesContent = transliterate(order.notes);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`${cleanNotesLabel}:`, 15, currentY);
    
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    const wrappedNotes = doc.splitTextToSize(cleanNotesContent, 175);
    doc.text(wrappedNotes, 15, currentY + 5);

    currentY += 5 + (wrappedNotes.length * 4) + 5;
  }

  // Thank You Footer
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.line(40, 270, 170, 270);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(217, 119, 6);
  doc.text(cleanThanks, 105, 276, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(cleanContact, 105, 281, { align: 'center' });

  // Save the PDF
  const filename = `Receipt-OnlaynMenyuXizmati-Table${order.tableNumber}-${order.id.slice(-6).toUpperCase()}.pdf`;
  doc.save(filename);
};

export const generateSummaryReceiptPDF = async (orders: Order[], language: Language) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Localized dictionary for the PDF
  const dictionary = {
    uz: {
      title: 'ONLAYN MENYU XIZMATI',
      subtitle: 'Premium ta\'m va yuksak xizmat ko\'rsatish maskani',
      reportTitle: 'TUGALLANGAN BUYURTMALAR HISOBOTI',
      period: 'Hisobot sanasi',
      totalOrders: 'Tugallangan buyurtmalar soni',
      totalRevenue: 'Umumiy tushum',
      subtotal: 'Taomlar savdosi',
      serviceCharge: 'Jami xizmat haqi',
      tableSittingFee: 'Jami stol o\'tirish haqi',
      colNo: 'T/r',
      colName: 'Taom nomi',
      colQty: 'Sotilgan soni',
      colPrice: 'Narxi',
      colTotal: 'Jami tushum',
      currency: 'so\'m',
      itemizedBreakdown: 'TAOMLAR BO\'YICHA BATAFSIL SAVDO',
      noData: 'Tugallangan buyurtmalar mavjud emas.',
      printedAt: 'Chop etilgan vaqt',
      contact: 'Onlayn Menyu Xizmati, O\'zbekiston',
    },
    ru: {
      title: 'ONLAYN MENYU XIZMATI',
      subtitle: 'Mesto roskoshnogo vkusa i premium obsluzhivaniya',
      reportTitle: 'ОТЧЕТ ПО ВЫПОЛНЕННЫМ ЗАКАЗАМ',
      period: 'Дата отчета',
      totalOrders: 'Количество выполненных заказов',
      totalRevenue: 'Общая выручка',
      subtotal: 'Продажи блюд',
      serviceCharge: 'Всего за обслуживание',
      tableSittingFee: 'Всего за столы',
      colNo: 'No.',
      colName: 'Наименование блюда',
      colQty: 'Продано (кол-vo)',
      colPrice: 'Цена',
      colTotal: 'Всего выручка',
      currency: 'sum',
      itemizedBreakdown: 'ДЕТАЛИЗАЦИЯ ПО БЛЮДАМ',
      noData: 'Нет выполненных заказов.',
      printedAt: 'Время печати',
      contact: 'Onlayn Menyu Xizmati, Uzbekistan',
    },
    en: {
      title: 'ONLAYN MENYU XIZMATI',
      subtitle: 'A place of luxurious taste and premium service',
      reportTitle: 'COMPLETED ORDERS SUMMARY REPORT',
      period: 'Report Date',
      totalOrders: 'Total Completed Orders',
      totalRevenue: 'Total Revenue',
      subtotal: 'Item Sales (Subtotal)',
      serviceCharge: 'Total Service Charge',
      tableSittingFee: 'Total Table Sitting Fee',
      colNo: 'No.',
      colName: 'Dish Name',
      colQty: 'Qty Sold',
      colPrice: 'Price',
      colTotal: 'Total Revenue',
      currency: 'so\'m',
      itemizedBreakdown: 'ITEMIZED SALES BREAKDOWN',
      noData: 'No completed orders found.',
      printedAt: 'Printed At',
      contact: 'Onlayn Menyu Xizmati, Uzbekistan',
    }
  };

  const labels = dictionary[language] || dictionary.en;

  const cleanTitle = transliterate(labels.title);
  const cleanSubtitle = transliterate(labels.subtitle);
  const cleanReportTitle = transliterate(labels.reportTitle);
  const cleanPeriod = transliterate(labels.period);
  const cleanTotalOrders = transliterate(labels.totalOrders);
  const cleanTotalRevenue = transliterate(labels.totalRevenue);
  const cleanSubtotal = transliterate(labels.subtotal);
  const cleanServiceCharge = transliterate(labels.serviceCharge);
  const cleanTableSittingFee = transliterate(labels.tableSittingFee);
  const cleanColNo = transliterate(labels.colNo);
  const cleanColName = transliterate(labels.colName);
  const cleanColQty = transliterate(labels.colQty);
  const cleanColPrice = transliterate(labels.colPrice);
  const cleanColTotal = transliterate(labels.colTotal);
  const cleanCurrency = transliterate(labels.currency);
  const cleanItemized = transliterate(labels.itemizedBreakdown);
  const cleanNoData = transliterate(labels.noData);
  const cleanPrintedAt = transliterate(labels.printedAt);
  const cleanContact = transliterate(labels.contact);

  const formatPrice = (num: number) => {
    return num.toLocaleString('uz-UZ') + ' ' + cleanCurrency;
  };

  // Setup Document
  doc.setFont('helvetica', 'normal');

  // Decorative header line
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1.5);
  doc.line(15, 12, 195, 12);

  // Restaurant Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text(cleanTitle, 105, 23, { align: 'center' });

  // Slogan
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(115, 115, 115);
  doc.text(cleanSubtitle, 105, 29, { align: 'center' });

  // Report Identifier
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6);
  doc.text(cleanReportTitle, 105, 37, { align: 'center' });

  // Elegant divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, 41, 195, 41);

  // Filter only delivered (successful) orders
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  // Metadata Columns
  const now = new Date();
  const dateStr = now.toLocaleDateString('uz-UZ');
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  doc.text(`${cleanPeriod}:`, 15, 48);
  doc.text(`${cleanPrintedAt}:`, 15, 54);
  doc.text(`${cleanTotalOrders}:`, 15, 60);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(`${dateStr}`, 65, 48);
  doc.text(`${dateStr}  ${timeStr}`, 65, 54);
  doc.text(`${deliveredOrders.length}`, 65, 60);

  // Totals calculations
  let grandTotal = 0;
  let serviceChargeTotal = 0;
  let sittingFeeTotal = 0;
  let subtotalTotal = 0;

  // Aggregate dishes
  const dishSales: { [id: string]: { name: string; quantity: number; price: number; total: number; unit: string } } = {};

  deliveredOrders.forEach(o => {
    grandTotal += o.totalAmount;
    serviceChargeTotal += o.serviceCharge || 0;
    sittingFeeTotal += o.tableSittingFee || 0;
    
    o.items.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      subtotalTotal += itemSubtotal;

      if (!dishSales[item.dishId]) {
        dishSales[item.dishId] = {
          name: item.dishName[language] || item.dishName['uz'] || 'Unknown',
          quantity: 0,
          price: item.price,
          total: 0,
          unit: 'pcs'
        };
      }
      dishSales[item.dishId].quantity += item.quantity;
      dishSales[item.dishId].total += itemSubtotal;
    });
  });

  // Get units correctly
  const allDishes = await getDishes();
  Object.keys(dishSales).forEach(dishId => {
    const d = allDishes.find((x: any) => x.id === dishId);
    if (d && d.unit) {
      dishSales[dishId].unit = d.unit;
    }
  });

  // Draw light gold/amber background box for Summary Metrics
  doc.setFillColor(254, 252, 232); // Tailwind amber-50
  doc.setDrawColor(251, 191, 36); // amber-400
  doc.rect(15, 66, 180, 24, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(`${cleanSubtotal}:`, 20, 72);
  doc.text(`${cleanServiceCharge}:`, 20, 78);
  doc.text(`${cleanTableSittingFee}:`, 20, 84);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(formatPrice(subtotalTotal), 80, 72);
  doc.text(formatPrice(serviceChargeTotal), 80, 78);
  doc.text(formatPrice(sittingFeeTotal), 80, 84);

  // Big Grand Total right side inside the box
  doc.setDrawColor(252, 211, 77); // amber-200
  doc.line(110, 68, 110, 88);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(180, 83, 9);
  doc.text(`${cleanTotalRevenue}:`, 115, 75);
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(formatPrice(grandTotal), 115, 83);

  // Itemized Sales Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text(cleanItemized, 15, 98);

  // Table Headers
  doc.setFillColor(245, 245, 245);
  doc.rect(15, 102, 180, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(cleanColNo, 18, 107.5);
  doc.text(cleanColName, 30, 107.5);
  doc.text(cleanColQty, 115, 107.5, { align: 'right' });
  doc.text(cleanColPrice, 150, 107.5, { align: 'right' });
  doc.text(cleanColTotal, 192, 107.5, { align: 'right' });

  let currentY = 116;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);

  const salesList = Object.values(dishSales).sort((a, b) => b.total - a.total);

  if (salesList.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(140, 140, 140);
    doc.text(cleanNoData, 105, currentY, { align: 'center' });
  } else {
    salesList.forEach((item, index) => {
      // Page break check
      if (currentY > 265) {
        doc.addPage();
        // Redraw column headers on the new page
        doc.setFillColor(245, 245, 245);
        doc.rect(15, 15, 180, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(cleanColNo, 18, 20.5);
        doc.text(cleanColName, 30, 20.5);
        doc.text(cleanColQty, 115, 20.5, { align: 'right' });
        doc.text(cleanColPrice, 150, 20.5, { align: 'right' });
        doc.text(cleanColTotal, 192, 20.5, { align: 'right' });

        currentY = 29;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 30);
      }

      const dishNameClean = transliterate(item.name);
      
      doc.text(`${index + 1}`, 18, currentY);
      
      const maxNameWidth = 80;
      const textLines = doc.splitTextToSize(dishNameClean, maxNameWidth);
      doc.text(textLines, 30, currentY);

      const unitText = item.unit === 'kg' 
        ? (language === 'uz' ? ' kg' : language === 'ru' ? ' kg' : ' kg') 
        : (language === 'uz' ? ' dona' : language === 'ru' ? ' sht' : ' pcs');

      doc.text(`${item.quantity}${unitText}`, 115, currentY, { align: 'right' });
      doc.text(formatPrice(item.price), 150, currentY, { align: 'right' });
      doc.text(formatPrice(item.total), 192, currentY, { align: 'right' });

      const lineOffset = Math.max(textLines.length * 4.5, 7);
      
      doc.setDrawColor(240, 240, 240);
      doc.line(15, currentY + lineOffset - 2.5, 195, currentY + lineOffset - 2.5);

      currentY += lineOffset;
    });
  }

  // Summary report ending footnote
  if (currentY > 260) {
    doc.addPage();
    currentY = 20;
  }

  // Decorative footer line
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.line(40, 270, 170, 270);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(cleanContact, 105, 278, { align: 'center' });

  const filename = `SummaryReport-OnlaynMenyuXizmati-${dateStr.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
};
