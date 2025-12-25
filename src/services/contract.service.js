const prisma = require('../config/prisma');
const { generateContractPDF, generatePDFPath } = require('../utils/pdf.utils');
const { generateContractNumber } = require('../utils/booking.utils');
const { ContractGenerationError } = require('../errors/booking.errors');

/**
 * Generate rental contract for a booking
 * @param {number} bookingId - Booking ID
 * @param {number} templateId - Contract template ID (optional)
 * @returns {Promise<Object>} Generated contract details
 */
const generateContract = async (bookingId, templateId = 1) => {
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
      throw new ContractGenerationError(bookingId, 'Réservation non trouvée');
    }

    // Get contract template
    const template = await prisma.contractTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new ContractGenerationError(bookingId, 'Modèle de contrat non trouvé');
    }

    // Generate contract number
    const contractNumber = generateContractNumber(bookingId);

    // Prepare contract data
    const contractData = {
      contractNumber,
      bookingDetails: {
        dates: {
          debut: booking.date_debut.toLocaleDateString('fr-FR'),
          fin: booking.date_fin.toLocaleDateString('fr-FR')
        },
        locations: {
          prise: booking.lieu_prise_en_charge || 'À définir',
          retour: booking.lieu_retour || 'À définir'
        },
        price: {
          total: parseFloat(booking.prix_total),
          caution: parseFloat(booking.caution_payee)
        }
      },
      mainDriver: {
        nom: booking.user.nom,
        prenom: booking.user.prenom,
        permis: booking.user.permis_conduire || 'Non renseigné',
        adresse: booking.user.adresse || 'Non renseignée'
      },
      additionalDrivers: booking.additionalDrivers.map(driver => ({
        nom: driver.nom,
        prenom: driver.prenom,
        permis: driver.permis_numero
      })),
      vehicle: {
        brand: booking.car.brand.name,
        model: booking.car.modele,
        registration: booking.car.immatriculation,
        year: booking.car.annee || 'Non renseigné'
      },
      insurance: {
        type: 'Responsabilité civile obligatoire',
        coverage: 'Couverture de base'
      },
      terms: getTermsAndConditions(),
      signatures: {
        customer: null,
        agent: null
      },
      vehicleCondition: {
        start: null,
        end: null
      }
    };

    // Generate PDF
    const pdfPath = generatePDFPath('contract', contractNumber);
    await generateContractPDF(contractData, pdfPath);

    // Save contract to database
    const contract = await prisma.rentalContract.create({
      data: {
        booking_id: bookingId,
        template_id: templateId,
        contract_number: contractNumber,
        contract_data: JSON.stringify(contractData),
        pdf_path: pdfPath
      }
    });

    console.log(`✅ Contract ${contractNumber} generated for booking ${bookingId}`);

    return {
      contract,
      contractData,
      pdfPath
    };

  } catch (error) {
    console.error('Error generating contract:', error);
    throw new ContractGenerationError(bookingId, error.message);
  }
};

/**
 * Sign contract electronically
 * @param {number} contractId - Contract ID
 * @param {Object} signatureData - Signature information
 * @returns {Promise<Object>} Updated contract
 */
const signContract = async (contractId, signatureData) => {
  try {
    const { customer_signature, agent_signature } = signatureData;

    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      throw new Error('Contrat introuvable');
    }

    const contractData = JSON.parse(contract.contract_data);
    contractData.signatures = {
      customer: customer_signature,
      agent: agent_signature || 'TOMOBILTY - Signature électronique'
    };

    // Update contract
    const updatedContract = await prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        contract_data: JSON.stringify(contractData),
        signed_at: new Date()
      }
    });

    // Regenerate PDF with signatures
    await generateContractPDF(contractData, contract.pdf_path);

    console.log(`✅ Contract ${contract.contract_number} signed`);

    return updatedContract;

  } catch (error) {
    console.error('Error signing contract:', error);
    throw error;
  }
};

/**
 * Get contract by ID
 * @param {number} contractId - Contract ID
 * @returns {Promise<Object>} Contract details
 */
const getContract = async (contractId) => {
  try {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        booking: {
          include: {
            user: {
              select: {
                nom: true,
                prenom: true,
                email: true
              }
            },
            car: {
              include: {
                brand: true
              }
            }
          }
        },
        template: true
      }
    });

    if (!contract) {
      throw new Error('Contrat introuvable');
    }

    return {
      ...contract,
      contract_data: JSON.parse(contract.contract_data)
    };

  } catch (error) {
    console.error('Error getting contract:', error);
    throw error;
  }
};

/**
 * Get terms and conditions text
 * @returns {string} Terms and conditions
 */
const getTermsAndConditions = () => {
  return `1. OBJET DU CONTRAT
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

Le présent contrat est régi par le droit marocain.`;
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
  generateContract,
  signContract,
  getContract,
  getTermsAndConditions,
  initializeDefaultTemplate
};
