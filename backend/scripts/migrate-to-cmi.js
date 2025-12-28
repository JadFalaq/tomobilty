#!/usr/bin/env node

/**
 * Script de migration Stripe → CMI
 * Usage: node scripts/migrate-to-cmi.js [--dry-run] [--backup]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StripeToCmiMigrator {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.backup = options.backup || false;
    this.projectRoot = path.resolve(__dirname, '..');
    this.backupDir = path.join(this.projectRoot, 'backups', `stripe-backup-${Date.now()}`);
    
    this.filesToMigrate = [
      'src/services/payment.service.js',
      'src/controllers/payment.controller.js',
      'src/routes/payment.routes.js',
      'src/controllers/webhook.controller.js',
      'src/routes/webhook.routes.js'
    ];
  }

  async migrate() {
    console.log('🚀 Début de la migration Stripe → CMI\n');

    try {
      // 1. Vérifications préliminaires
      await this.performChecks();

      // 2. Sauvegarde si demandée
      if (this.backup) {
        await this.createBackup();
      }

      // 3. Migration des fichiers
      await this.migrateFiles();

      // 4. Mise à jour des imports
      await this.updateImports();

      // 5. Mise à jour de la configuration
      await this.updateConfiguration();

      // 6. Tests de validation
      await this.runValidationTests();

      console.log('✅ Migration terminée avec succès!\n');
      this.printNextSteps();

    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error.message);
      process.exit(1);
    }
  }

  async performChecks() {
    console.log('🔍 Vérifications préliminaires...');

    // Vérifier que les nouveaux fichiers existent
    const requiredFiles = [
      'src/services/payment.service.v2.js',
      'src/controllers/payment.controller.v2.js',
      'src/routes/payment.routes.v2.js',
      'src/services/providers/PaymentProvider.js',
      'src/services/providers/CmiProvider.js',
      'src/services/providers/StripeProvider.js',
      'src/services/providers/PaymentProviderFactory.js'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Fichier requis manquant: ${file}`);
      }
    }

    // Vérifier les variables d'environnement CMI
    const requiredEnvVars = [
      'CMI_MERCHANT_ID',
      'CMI_STORE_KEY',
      'CMI_GATEWAY_URL'
    ];

    const envPath = path.join(this.projectRoot, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      for (const envVar of requiredEnvVars) {
        if (!envContent.includes(envVar)) {
          console.warn(`⚠️  Variable d'environnement manquante: ${envVar}`);
        }
      }
    }

    console.log('✅ Vérifications terminées\n');
  }

  async createBackup() {
    console.log('💾 Création de la sauvegarde...');

    if (!this.dryRun) {
      // Créer le dossier de sauvegarde
      fs.mkdirSync(this.backupDir, { recursive: true });

      // Sauvegarder les fichiers existants
      for (const file of this.filesToMigrate) {
        const sourcePath = path.join(this.projectRoot, file);
        if (fs.existsSync(sourcePath)) {
          const backupPath = path.join(this.backupDir, file);
          const backupDir = path.dirname(backupPath);
          fs.mkdirSync(backupDir, { recursive: true });
          fs.copyFileSync(sourcePath, backupPath);
        }
      }

      // Sauvegarder package.json
      const packagePath = path.join(this.projectRoot, 'package.json');
      const backupPackagePath = path.join(this.backupDir, 'package.json');
      fs.copyFileSync(packagePath, backupPackagePath);

      console.log(`✅ Sauvegarde créée dans: ${this.backupDir}\n`);
    } else {
      console.log('🔍 [DRY RUN] Sauvegarde simulée\n');
    }
  }

  async migrateFiles() {
    console.log('📁 Migration des fichiers...');

    const migrations = [
      {
        from: 'src/services/payment.service.v2.js',
        to: 'src/services/payment.service.js'
      },
      {
        from: 'src/controllers/payment.controller.v2.js',
        to: 'src/controllers/payment.controller.js'
      },
      {
        from: 'src/routes/payment.routes.v2.js',
        to: 'src/routes/payment.routes.js'
      }
    ];

    for (const migration of migrations) {
      const fromPath = path.join(this.projectRoot, migration.from);
      const toPath = path.join(this.projectRoot, migration.to);

      if (this.dryRun) {
        console.log(`🔍 [DRY RUN] ${migration.from} → ${migration.to}`);
      } else {
        fs.copyFileSync(fromPath, toPath);
        console.log(`✅ ${migration.from} → ${migration.to}`);
      }
    }

    console.log('');
  }

  async updateImports() {
    console.log('🔄 Mise à jour des imports...');

    const filesToUpdate = [
      'src/services/booking.service.js',
      'src/controllers/booking.controller.js'
    ];

    for (const file of filesToUpdate) {
      const filePath = path.join(this.projectRoot, file);
      
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remplacer les imports Stripe directs
        const updates = [
          {
            from: /const stripe = require\('stripe'\)\(process\.env\.STRIPE_SECRET_KEY\);?/g,
            to: '// Stripe direct import removed - using PaymentProvider pattern'
          },
          {
            from: /require\('\.\.\/services\/payment\.service'\)/g,
            to: "require('../services/payment.service')"
          }
        ];

        let hasChanges = false;
        for (const update of updates) {
          if (update.from.test(content)) {
            content = content.replace(update.from, update.to);
            hasChanges = true;
          }
        }

        if (hasChanges) {
          if (this.dryRun) {
            console.log(`🔍 [DRY RUN] Mise à jour des imports dans: ${file}`);
          } else {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Imports mis à jour dans: ${file}`);
          }
        }
      }
    }

    console.log('');
  }

  async updateConfiguration() {
    console.log('⚙️  Mise à jour de la configuration...');

    // Mettre à jour .env.example
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    if (fs.existsSync(envExamplePath)) {
      let envContent = fs.readFileSync(envExamplePath, 'utf8');
      
      const cmiConfig = `
# Payment Provider Configuration
PAYMENT_PROVIDER=cmi

# CMI Configuration (Centre Monétique Interbancaire)
CMI_MERCHANT_ID=your_merchant_id
CMI_STORE_KEY=your_store_key
CMI_TERMINAL_ID=your_terminal_id
CMI_GATEWAY_URL=https://payment.cmi.co.ma/fim/est3Dgate
CMI_CURRENCY=MAD

# CMI URLs
CMI_RETURN_URL=https://yourdomain.com/payments/return
CMI_IPN_URL=https://yourdomain.com/api/payments/cmi/ipn

# Stripe Configuration (legacy support)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
`;

      if (!envContent.includes('CMI_MERCHANT_ID')) {
        envContent += cmiConfig;
        
        if (this.dryRun) {
          console.log('🔍 [DRY RUN] Ajout configuration CMI à .env.example');
        } else {
          fs.writeFileSync(envExamplePath, envContent, 'utf8');
          console.log('✅ Configuration CMI ajoutée à .env.example');
        }
      }
    }

    console.log('');
  }

  async runValidationTests() {
    console.log('🧪 Tests de validation...');

    try {
      if (this.dryRun) {
        console.log('🔍 [DRY RUN] Tests simulés');
        return;
      }

      // Test de syntaxe des nouveaux fichiers
      const testFiles = [
        'src/services/providers/CmiProvider.js',
        'src/services/providers/PaymentProviderFactory.js',
        'src/services/payment.service.js'
      ];

      for (const file of testFiles) {
        try {
          require(path.join(this.projectRoot, file));
          console.log(`✅ Syntaxe valide: ${file}`);
        } catch (error) {
          console.error(`❌ Erreur de syntaxe dans ${file}:`, error.message);
        }
      }

      // Test de configuration CMI
      try {
        const PaymentProviderFactory = require(path.join(this.projectRoot, 'src/services/providers/PaymentProviderFactory.js'));
        const cmiProvider = PaymentProviderFactory.createProvider('cmi');
        console.log('✅ Provider CMI créé avec succès');
        
        const isValid = cmiProvider.validateConfig();
        if (isValid) {
          console.log('✅ Configuration CMI valide');
        } else {
          console.warn('⚠️  Configuration CMI incomplète - vérifiez les variables d\'environnement');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la création du provider CMI:', error.message);
      }

    } catch (error) {
      console.warn('⚠️  Certains tests ont échoué:', error.message);
    }

    console.log('');
  }

  printNextSteps() {
    console.log('📋 Prochaines étapes:');
    console.log('');
    console.log('1. 🔧 Configurer les variables d\'environnement CMI:');
    console.log('   - CMI_MERCHANT_ID=votre_merchant_id');
    console.log('   - CMI_STORE_KEY=votre_store_key');
    console.log('   - CMI_TERMINAL_ID=votre_terminal_id');
    console.log('');
    console.log('2. 🌐 Mettre à jour les URLs publiques:');
    console.log('   - CMI_RETURN_URL=https://votredomaine.com/payments/return');
    console.log('   - CMI_IPN_URL=https://votredomaine.com/api/payments/cmi/ipn');
    console.log('');
    console.log('3. 🧪 Tester l\'intégration:');
    console.log('   - npm test src/tests/providers/CmiProvider.test.js');
    console.log('   - Tester avec les cartes de test CMI');
    console.log('');
    console.log('4. 🚀 Déployer en production:');
    console.log('   - Vérifier la configuration production');
    console.log('   - Tester quelques transactions');
    console.log('   - Monitorer les logs CMI');
    console.log('');
    console.log('5. 🧹 Nettoyage (optionnel):');
    console.log('   - Supprimer les anciens fichiers Stripe');
    console.log('   - Mettre à jour package.json (retirer stripe)');
    console.log('');
    
    if (this.backup) {
      console.log(`💾 Sauvegarde disponible dans: ${this.backupDir}`);
      console.log('');
    }
  }
}

// Exécution du script
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    backup: args.includes('--backup')
  };

  if (args.includes('--help')) {
    console.log('Usage: node scripts/migrate-to-cmi.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run    Simulation sans modifications');
    console.log('  --backup     Créer une sauvegarde avant migration');
    console.log('  --help       Afficher cette aide');
    console.log('');
    console.log('Exemples:');
    console.log('  node scripts/migrate-to-cmi.js --dry-run');
    console.log('  node scripts/migrate-to-cmi.js --backup');
    console.log('  node scripts/migrate-to-cmi.js --dry-run --backup');
    return;
  }

  const migrator = new StripeToCmiMigrator(options);
  await migrator.migrate();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = StripeToCmiMigrator;
