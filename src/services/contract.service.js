const jsPDF = require('jspdf');
const prisma = require('../config/prisma');
const path = require('path');
const fs = require('fs').promises;

// Generate rental contract PDF
const generateRentalContract = async (bookingId, templateId = 1) => {
  try {
    // Get booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        car: {
          include: {
            brand: true,
            category: true
          }
        },
        additionalDrivers: true,
        status: true
      }
    });

    if (!booking) {
      throw new Error('Réservation non trouvée');
    }

    // Get contract template
    const template = await prisma.contractTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error('Modèle de contrat non trouvé');
    }

    // Generate contract data
    const contractData = {
      contract_number: `CONT-${Date.now()}-${bookingId}`,
      booking_id: bookingId,
      user: {
        nom: booking.user.nom,
        prenom: booking.user.prenom,
        email: booking.user.email,
        telephone: booking.user.telephone,
        adresse: booking.user.adresse,
        permis_conduire: booking.user.permis_conduire
      },
      car: {
        marque: booking.car.brand.name,
        modele: booking.car.modele,
        annee: booking.car.annee,
        immatriculation: booking.car.immatriculation,
        couleur: booking.car.couleur,
        prix_par_jour: booking.car.prix_par_jour,
        caution: booking.car.caution
      },
      rental: {
        date_debut: booking.date_debut,
        date_fin: booking.date_fin,
        lieu_prise_en_charge: booking.lieu_prise_en_charge,
        lieu_retour: booking.lieu_retour,
        prix_total: booking.prix_total,
        caution_payee: booking.caution_payee
      },
      additional_drivers: booking.additionalDrivers,
      generated_at: new Date(),
      terms_and_conditions: getTermsAndConditions()
    };

    // Create PDF
    const pdfBuffer = await createContractPDF(contractData, template);

    // Save contract to database
    const contract = await prisma.rentalContract.create({
      data: {
        booking_id: bookingId,
        template_id: templateId,
        contract_number: contractData.contract_number,
        contract_data: JSON.stringify(contractData),
        pdf_path: `contracts/${contractData.contract_number}.pdf`
      }
    });

    // Save PDF file
    const contractsDir = path.join(process.cwd(), 'public', 'contracts');
    await fs.mkdir(contractsDir, { recursive: true });
    const filePath = path.join(contractsDir, `${contractData.contract_number}.pdf`);
    await fs.writeFile(filePath, pdfBuffer);

    return {
      contract,
      contractData,
      pdfPath: filePath
    };
  } catch (error) {
    console.error('Error generating contract:', error);
    throw error;
  }
};

// Create PDF document
const createContractPDF = async (contractData, template) => {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  let yPosition = 20;
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRAT DE LOCATION DE VÉHICULE', 105, yPosition, { align: 'center' });
  yPosition += 20;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contrat N°: ${contractData.contract_number}`, 20, yPosition);
  doc.text(`Date: ${contractData.generated_at.toLocaleDateString('fr-FR')}`, 150, yPosition);
  yPosition += 20;
  
  // Locataire section
  doc.setFont('helvetica', 'bold');
  doc.text('LOCATAIRE:', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom: ${contractData.user.nom} ${contractData.user.prenom}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Email: ${contractData.user.email}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Téléphone: ${contractData.user.telephone || 'Non renseigné'}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Adresse: ${contractData.user.adresse || 'Non renseignée'}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Permis de conduire: ${contractData.user.permis_conduire || 'Non renseigné'}`, 20, yPosition);
  yPosition += 15;
  
  // Véhicule section
  doc.setFont('helvetica', 'bold');
  doc.text('VÉHICULE LOUÉ:', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Marque et modèle: ${contractData.car.marque} ${contractData.car.modele}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Année: ${contractData.car.annee}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Immatriculation: ${contractData.car.immatriculation}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Couleur: ${contractData.car.couleur}`, 20, yPosition);
  yPosition += 15;
  
  // Conditions de location
  doc.setFont('helvetica', 'bold');
  doc.text('CONDITIONS DE LOCATION:', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Date de début: ${new Date(contractData.rental.date_debut).toLocaleDateString('fr-FR')}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Date de fin: ${new Date(contractData.rental.date_fin).toLocaleDateString('fr-FR')}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Lieu de prise en charge: ${contractData.rental.lieu_prise_en_charge || 'À définir'}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Lieu de retour: ${contractData.rental.lieu_retour || 'À définir'}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Prix par jour: ${contractData.car.prix_par_jour} MAD`, 20, yPosition);
  yPosition += 7;
  doc.text(`Prix total: ${contractData.rental.prix_total} MAD`, 20, yPosition);
  yPosition += 7;
  doc.text(`Caution: ${contractData.car.caution} MAD`, 20, yPosition);
  yPosition += 15;
  
  // Conducteurs additionnels
  if (contractData.additional_drivers && contractData.additional_drivers.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('CONDUCTEURS ADDITIONNELS:', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    contractData.additional_drivers.forEach((driver, index) => {
      doc.text(`${index + 1}. ${driver.nom} ${driver.prenom} - Permis: ${driver.permis_numero}`, 20, yPosition);
      yPosition += 7;
    });
    yPosition += 10;
  }
  
  // Terms and conditions
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('TERMES ET CONDITIONS:', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const terms = contractData.terms_and_conditions;
  const splitTerms = doc.splitTextToSize(terms, 170);
  
  splitTerms.forEach(line => {
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(line, 20, yPosition);
    yPosition += 5;
  });
  
  // Signatures
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  } else {
    yPosition += 20;
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES:', 20, yPosition);
  yPosition += 20;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Locataire:', 20, yPosition);
  doc.text('Tomobilty (Loueur):', 120, yPosition);
  yPosition += 30;
  
  doc.text('Signature:', 20, yPosition);
  doc.text('Signature:', 120, yPosition);
  yPosition += 10;
  
  doc.text(`Date: ${contractData.generated_at.toLocaleDateString('fr-FR')}`, 20, yPosition);
  doc.text(`Date: ${contractData.generated_at.toLocaleDateString('fr-FR')}`, 120, yPosition);
  
  return doc.output('arraybuffer');
};

// Get terms and conditions
const getTermsAndConditions = () => {
  return `
1. OBJET DU CONTRAT
Le présent contrat a pour objet la location du véhicule décrit ci-dessus aux conditions définies.

2. DURÉE DE LA LOCATION
La location commence à la date et heure de prise en charge et se termine à la date et heure de retour convenues.

3. CONDITIONS D'UTILISATION
- Le locataire s'engage à utiliser le véhicule conformément à sa destination normale.
- La conduite est interdite aux personnes non autorisées.
- Le véhicule ne doit pas être utilisé pour des activités illégales.
- Le locataire est responsable des infractions au code de la route.

4. ÉTAT DU VÉHICULE
Le locataire reconnaît avoir pris livraison du véhicule en bon état de fonctionnement.
Un état des lieux contradictoire sera établi à la prise en charge et au retour.

5. ASSURANCE
Le véhicule est couvert par une assurance responsabilité civile obligatoire.
Le locataire peut souscrire des assurances complémentaires.

6. CARBURANT
Le véhicule est remis avec un niveau de carburant déterminé et doit être restitué avec le même niveau.

7. CAUTION
Une caution est exigée et sera restituée après vérification de l'état du véhicule au retour.

8. RETARD
Tout retard dans la restitution du véhicule entraîne une facturation supplémentaire.

9. PANNE OU ACCIDENT
En cas de panne ou d'accident, le locataire doit immédiatement contacter Tomobilty.

10. RÉSILIATION
Le contrat peut être résilié par l'une ou l'autre des parties en cas de manquement aux obligations.

Le présent contrat est régi par le droit marocain.
  `.trim();
};

// Initialize default contract template
const initializeDefaultTemplate = async () => {
  try {
    const existingTemplate = await prisma.contractTemplate.count();
    
    if (existingTemplate === 0) {
      await prisma.contractTemplate.create({
        data: {
          name: 'Contrat Standard',
          template: 'Template de contrat de location standard pour Tomobilty',
          version: '1.0',
          is_active: true
        }
      });
    }
  } catch (error) {
    console.error('Error initializing default template:', error);
  }
};

module.exports = {
  generateRentalContract,
  createContractPDF,
  getTermsAndConditions,
  initializeDefaultTemplate
};
