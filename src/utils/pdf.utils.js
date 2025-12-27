/**
 * Utility functions for PDF generation
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate contract PDF
 * @param {Object} contractData - Contract data
 * @param {string} outputPath - Output file path
 * @returns {Promise<string>} Generated PDF path
 */
const generateContractPDF = async (contractData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('CONTRAT DE LOCATION DE VÉHICULE', { align: 'center' });
      doc.moveDown();
      
      // Contract number and date
      doc.fontSize(12)
         .text(`Contrat N°: ${contractData.contractNumber}`, { align: 'right' })
         .text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown();

      // Company info
      doc.fontSize(14).text('TOMMOBILTY SARL', { underline: true });
      doc.fontSize(10)
         .text('Adresse: [Adresse de l\'entreprise]')
         .text('Téléphone: [Numéro de téléphone]')
         .text('Email: contact@tommobilty.com');
      doc.moveDown();

      // Client info
      doc.fontSize(14).text('INFORMATIONS CLIENT', { underline: true });
      doc.fontSize(10)
         .text(`Nom: ${contractData.mainDriver.nom} ${contractData.mainDriver.prenom}`)
         .text(`Permis N°: ${contractData.mainDriver.permis}`)
         .text(`Adresse: ${contractData.mainDriver.adresse || '[Adresse non renseignée]'}`);
      doc.moveDown();

      // Vehicle info
      doc.fontSize(14).text('VÉHICULE LOUÉ', { underline: true });
      doc.fontSize(10)
         .text(`Marque: ${contractData.vehicle.brand}`)
         .text(`Modèle: ${contractData.vehicle.model}`)
         .text(`Immatriculation: ${contractData.vehicle.registration}`)
         .text(`Année: ${contractData.vehicle.year}`);
      doc.moveDown();

      // Rental details
      doc.fontSize(14).text('DÉTAILS DE LA LOCATION', { underline: true });
      doc.fontSize(10)
         .text(`Date de début: ${contractData.bookingDetails.dates.debut}`)
         .text(`Date de fin: ${contractData.bookingDetails.dates.fin}`)
         .text(`Lieu de prise en charge: ${contractData.bookingDetails.locations.prise}`)
         .text(`Lieu de retour: ${contractData.bookingDetails.locations.retour}`)
         .text(`Prix total: ${contractData.bookingDetails.price.total} MAD`);
      doc.moveDown();

      // Additional drivers
      if (contractData.additionalDrivers && contractData.additionalDrivers.length > 0) {
        doc.fontSize(14).text('CONDUCTEURS ADDITIONNELS', { underline: true });
        contractData.additionalDrivers.forEach((driver, index) => {
          doc.fontSize(10)
             .text(`${index + 1}. ${driver.nom} ${driver.prenom} - Permis: ${driver.permis}`);
        });
        doc.moveDown();
      }

      // Insurance
      if (contractData.insurance) {
        doc.fontSize(14).text('ASSURANCE', { underline: true });
        doc.fontSize(10)
           .text(`Type: ${contractData.insurance.type}`)
           .text(`Couverture: ${contractData.insurance.coverage}`);
        doc.moveDown();
      }

      // Terms and conditions
      doc.fontSize(14).text('CONDITIONS GÉNÉRALES', { underline: true });
      doc.fontSize(8)
         .text('1. Le locataire s\'engage à restituer le véhicule dans l\'état où il l\'a reçu.')
         .text('2. Toute dégradation sera facturée au locataire.')
         .text('3. Le véhicule doit être rendu avec le même niveau de carburant.')
         .text('4. En cas de retard, des frais supplémentaires seront appliqués.')
         .text('5. Le locataire est responsable des infractions commises pendant la location.');
      doc.moveDown();

      // Signatures
      doc.fontSize(12).text('SIGNATURES', { underline: true });
      doc.moveDown();
      
      const signatureY = doc.y;
      doc.text('Le locataire:', 50, signatureY);
      doc.text('TOMMOBILTY:', 300, signatureY);
      
      doc.moveDown(3);
      doc.text('Date et signature:', 50, doc.y);
      doc.text('Date et signature:', 300, doc.y);

      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate invoice PDF
 * @param {Object} invoiceData - Invoice data
 * @param {string} outputPath - Output file path
 * @returns {Promise<string>} Generated PDF path
 */
const generateInvoicePDF = async (invoiceData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('FACTURE', { align: 'center' });
      doc.moveDown();

      // Invoice details
      doc.fontSize(12)
         .text(`Facture N°: ${invoiceData.invoiceNumber}`, { align: 'right' })
         .text(`Date: ${new Date(invoiceData.createdAt).toLocaleDateString('fr-FR')}`, { align: 'right' })
         .text(`Échéance: ${new Date(invoiceData.dueDate || Date.now()).toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown();

      // Company info
      doc.fontSize(14).text('TOMMOBILTY SARL', { underline: true });
      doc.fontSize(10)
         .text('Adresse: [Adresse de l\'entreprise]')
         .text('Téléphone: [Numéro de téléphone]')
         .text('Email: contact@tommobilty.com')
         .text('TVA: [Numéro TVA]');
      doc.moveDown();

      // Client info
      doc.fontSize(14).text('FACTURÉ À', { underline: true });
      doc.fontSize(10)
         .text(`${invoiceData.client.nom} ${invoiceData.client.prenom}`)
         .text(`Email: ${invoiceData.client.email}`)
         .text(`Adresse: ${invoiceData.client.adresse || '[Adresse non renseignée]'}`);
      doc.moveDown();

      // Items table header
      doc.fontSize(12).text('DÉTAIL DES PRESTATIONS', { underline: true });
      doc.moveDown();

      const tableTop = doc.y;
      const itemCodeX = 50;
      const descriptionX = 150;
      const quantityX = 350;
      const priceX = 400;
      const amountX = 480;

      doc.fontSize(10)
         .text('Code', itemCodeX, tableTop)
         .text('Description', descriptionX, tableTop)
         .text('Qté', quantityX, tableTop)
         .text('Prix Unit.', priceX, tableTop)
         .text('Montant', amountX, tableTop);

      // Draw line under header
      doc.moveTo(itemCodeX, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();

      let currentY = tableTop + 25;

      // Add items
      invoiceData.items.forEach((item) => {
        doc.text(item.code || 'LOC', itemCodeX, currentY)
           .text(item.description, descriptionX, currentY)
           .text(item.quantity.toString(), quantityX, currentY)
           .text(`${item.unitPrice} MAD`, priceX, currentY)
           .text(`${item.amount} MAD`, amountX, currentY);
        currentY += 20;
      });

      // Draw line before totals
      doc.moveTo(itemCodeX, currentY)
         .lineTo(550, currentY)
         .stroke();

      currentY += 10;

      // Totals
      const totalsX = 400;
      doc.fontSize(10)
         .text(`Sous-total: ${invoiceData.subtotal} MAD`, totalsX, currentY);
      currentY += 15;

      if (invoiceData.discount > 0) {
        doc.text(`Remise: -${invoiceData.discount} MAD`, totalsX, currentY);
        currentY += 15;
      }

      if (invoiceData.tax > 0) {
        doc.text(`TVA (${invoiceData.taxRate}%): ${invoiceData.tax} MAD`, totalsX, currentY);
        currentY += 15;
      }

      doc.fontSize(12)
         .text(`TOTAL: ${invoiceData.total} MAD`, totalsX, currentY, { underline: true });

      // Payment info
      doc.moveDown(2);
      doc.fontSize(10)
         .text('INFORMATIONS DE PAIEMENT')
         .text(`Statut: ${invoiceData.status === 'PAID' ? 'PAYÉE' : 'EN ATTENTE'}`)
         .text(`Mode de paiement: ${invoiceData.paymentMethod || 'Carte bancaire'}`);

      if (invoiceData.status === 'PAID') {
        doc.text(`Date de paiement: ${new Date(invoiceData.paidAt).toLocaleDateString('fr-FR')}`);
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8)
         .text('Merci de votre confiance !', { align: 'center' })
         .text('Cette facture est générée automatiquement.', { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Ensure directory exists
 * @param {string} dirPath - Directory path
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Generate PDF file path
 * @param {string} type - PDF type (contract, invoice)
 * @param {string} identifier - Unique identifier
 * @returns {string} File path
 */
const generatePDFPath = (type, identifier) => {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs', type);
  ensureDirectoryExists(uploadsDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${type}_${identifier}_${timestamp}.pdf`;
  
  return path.join(uploadsDir, filename);
};

/**
 * Delete PDF file
 * @param {string} filePath - File path to delete
 * @returns {boolean} Success status
 */
const deletePDF = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return false;
  }
};

module.exports = {
  generateContractPDF,
  generateInvoicePDF,
  ensureDirectoryExists,
  generatePDFPath,
  deletePDF
};
