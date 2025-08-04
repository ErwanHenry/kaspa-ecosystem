// fix-google-permissions.js
// Script pour diagnostiquer et corriger les problèmes de permissions Google Sheets

const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

// Configuration du compte de service
const SERVICE_ACCOUNT = {
    type: "service_account",
    project_id: "annuairekaspa",
    private_key_id: "08f6620c50134cf77e781ecd75a0b9aa63bd2311",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDGTdd50P1xtUSq\nAtiTQfgW+/IBhMisY6Kt2Hlqbh+EjtINer4EgUp2NqA+zrXdoXJkh+F6fFQ3BRT/\nfDd65W6i3x4FSv6+bDPJGJRmTxwemqDu75gWvKyNmoaws/61wup04mm67T+xJErO\nKRhVDY4Yvn1S9FkAf1Ck2+CAaoaMqFwM5W/wd8OE7flkIh1lb2T3jcKdgg66QmyO\nSk4AgflNwO0BAcFR7Yz7xy3hjoOr4dHTmEmTZAMqB4Pb74pBkCQHcq75Y6AGCJc7\nLwl4F59tWgOTqB++CgVQQO3vtWTMoVz8r5JNnfnnl1aKXSLhLhqC14UFr7WNOSeZ\nC50WPCWXAgMBAAECggEAIjuW2oMe9W2u7FBwdb9aJhGZPfTftY6/qxYnI53eGAKV\ntVj+i4WMRqr4b888awWvWzZv0La8zQC2FsKpSzBnMHum0ZAYOOQx7mGtYJoAhzH3\nXTgEP8yTVyCZZtCzxEnhMotRaEEDkT9sIHnMpwYfhRsBRHxFDwZrdAI3F8QL9STf\nXc/HwhbZqJ7qRGXB1+aH+RM9NXwuCH4AYPEOJbJD3NE8GwAmK5YiFDKzMhpPoMAh\nCpvOP+DKcWVyNXWsjr5Z7wjQG2h7vljwtZ/YbmmecGFGiIzlRBaXxJ0RE5cVX45S\nuPn0Fyxh42GZhu8cpD4JqqL6+ePKTQn8y4TtemT1AQKBgQDrSLdTV1jhRh87SIRL\n7JBocNrTECd3xuTorbyq/GQ67YQi9pIy7Q13md0X8nZ3hti73nz5mptGyWd71EzK\nJbJM/43B0RtxquD0jdRynqB2lXjVNyGLeQcLDvb/3nifNa6ntWlbwrhcLgAne0hh\nHb8G58JfB/rFIX+RiYAlN831AQKBgQDXw5mMDfIZAV8QwqHIs0a859XgxWfQsWeF\nAoTmglvd9mel6Pxu6dRhleVBzW9UPzLiU6BpmuCxA5fiCjIBwQpeFnA4Wx/pUoeK\n0IzbEQnNdfbQtXGBaN5edS2bXtA0TfI86ghEkabm1FwMTUJckFBFVnumYmIg1kAR\nMJ8kqLailwKBgQDXJpqFenVLIs1Cb9CSgROYfcKMiNQegmEmqGDDVqLtA+717dXI\n/d53xNpZoJ1WNZgRS6WqtgdR1rBrmrpRi+Ec6f+eAXKAIcsttlhUK9v+NDbXel+R\nY63eHeQeHDjfFb7Nm2VpxIjDukjn0aNhM0tQrDOgpPJau4Qk+MCWyA3tAQKBgQCU\n6+qlIlMBM1McTFpCHosqg5G5rEb1Yh0jTxPPzhX+Y74yY1cobrgqCr3L5zF6IozK\nbhIAEegYBXTljUfqsgSn4DDglPS3pEDtbPhrk50CdPNAJpwLSAiDhblOzehC0bHq\nnVXLjgR2ugg2bXTqUqk00nZR5wH3zCk4NCkDsncsTQKBgECDAMLRUpjKM35/cKpS\n7MflPfGy/gJ5CRSquKU4uDI99Ubte7KFWxA63Uz9KT1Tb6mkcWw+iCWN71R+lp8y\nJrL4BrM1PtKnopXQnp2tri+I71Z5XdMncIvoPGToK72XwDnoP/w8s8eDDIN+7fem\nAbvO+Asn1xWd779UOiRjE2y/\n-----END PRIVATE KEY-----\n",
    client_email: "kaspa-ecosystem-service@annuairekaspa.iam.gserviceaccount.com",
    client_id: "106469363499872636088",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/kaspa-ecosystem-service%40annuairekaspa.iam.gserviceaccount.com"
};

async function testGooglePermissions() {
    console.log('🔍 Test des permissions Google Sheets\n');
    
    try {
        // 1. Créer le client JWT
        console.log('1️⃣ Création du client JWT...');
        const auth = new JWT({
            email: SERVICE_ACCOUNT.client_email,
            key: SERVICE_ACCOUNT.private_key,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ]
        });

        // 2. Tester l'authentification
        console.log('2️⃣ Test de l\'authentification...');
        await auth.authorize();
        console.log('✅ Authentification réussie\n');

        // 3. Initialiser les services
        console.log('3️⃣ Initialisation des services Google...');
        const sheets = google.sheets({ version: 'v4', auth });
        const drive = google.drive({ version: 'v3', auth });
        console.log('✅ Services initialisés\n');

        // 4. Tester l'accès à Drive
        console.log('4️⃣ Test de l\'accès à Google Drive...');
        try {
            const driveResponse = await drive.files.list({
                pageSize: 1,
                fields: 'files(id, name)'
            });
            console.log('✅ Accès à Drive OK');
            console.log(`   Fichiers visibles: ${driveResponse.data.files?.length || 0}\n`);
        } catch (driveError) {
            console.log('❌ Erreur d\'accès à Drive:', driveError.message);
            console.log('   → Le compte de service n\'a peut-être pas accès à Drive\n');
        }

        // 5. Créer un spreadsheet de test
        console.log('5️⃣ Tentative de création d\'un spreadsheet...');
        try {
            const createResponse = await sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title: `Test Kaspa - ${new Date().toISOString()}`
                    }
                }
            });
            
            const spreadsheetId = createResponse.data.spreadsheetId;
            console.log('✅ Spreadsheet créé avec succès!');
            console.log(`   ID: ${spreadsheetId}`);
            console.log(`   URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}\n`);

            // 6. Tester l'écriture
            console.log('6️⃣ Test d\'écriture dans le spreadsheet...');
            try {
                await sheets.spreadsheets.values.update({
                    spreadsheetId: spreadsheetId,
                    range: 'A1',
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [['Test réussi!']]
                    }
                });
                console.log('✅ Écriture réussie!\n');
            } catch (writeError) {
                console.log('❌ Erreur d\'écriture:', writeError.message, '\n');
            }

            // 7. Partager le spreadsheet avec vous
            console.log('7️⃣ Configuration du partage...');
            console.log('⚠️  IMPORTANT: Pour utiliser ce spreadsheet, vous devez le partager manuellement:');
            console.log(`   1. Ouvrez: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
            console.log('   2. Cliquez sur "Partager"');
            console.log('   3. Ajoutez votre email personnel');
            console.log('   4. Donnez les permissions "Éditeur"\n');

        } catch (createError) {
            console.log('❌ Erreur lors de la création:', createError.message);
            console.log('\n🔧 SOLUTION POSSIBLE:');
            console.log('1. Vérifiez que les APIs sont activées dans Google Cloud Console:');
            console.log('   - Google Sheets API');
            console.log('   - Google Drive API');
            console.log('2. URL: https://console.cloud.google.com/apis/library');
            console.log('3. Projet: annuairekaspa\n');
        }

    } catch (error) {
        console.log('❌ Erreur générale:', error.message);
        console.log('\n📋 Détails de l\'erreur:');
        console.log(error);
    }
}

// Solution alternative : Utiliser un spreadsheet existant
async function useExistingSpreadsheet(spreadsheetId) {
    console.log('📊 Configuration avec un spreadsheet existant\n');
    
    console.log('Instructions:');
    console.log('1. Créez un nouveau Google Sheets manuellement');
    console.log('2. Partagez-le avec:', SERVICE_ACCOUNT.client_email);
    console.log('3. Donnez les permissions "Éditeur"');
    console.log('4. Copiez l\'ID depuis l\'URL');
    console.log('5. Modifiez kaspa-backend.js pour ajouter cet ID:\n');
    console.log(`   SHEET_ID: '${spreadsheetId || 'VOTRE_ID_ICI'}',\n`);
    
    if (spreadsheetId) {
        try {
            const auth = new JWT({
                email: SERVICE_ACCOUNT.client_email,
                key: SERVICE_ACCOUNT.private_key,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
            
            const sheets = google.sheets({ version: 'v4', auth });
            
            // Tester l'accès
            const response = await sheets.spreadsheets.get({
                spreadsheetId: spreadsheetId
            });
            
            console.log('✅ Accès au spreadsheet confirmé!');
            console.log(`   Titre: ${response.data.properties.title}`);
            console.log(`   URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
            
        } catch (error) {
            console.log('❌ Impossible d\'accéder au spreadsheet');
            console.log('   Vérifiez que vous l\'avez bien partagé avec le compte de service');
        }
    }
}

// Menu principal
async function main() {
    console.log('🔧 Diagnostic des permissions Google Sheets');
    console.log('==========================================\n');
    
    const args = process.argv.slice(2);
    
    if (args[0] === '--use-existing' && args[1]) {
        await useExistingSpreadsheet(args[1]);
    } else {
        await testGooglePermissions();
        
        console.log('\n💡 OPTIONS DISPONIBLES:');
        console.log('1. Activez les APIs dans Google Cloud Console');
        console.log('2. Utilisez un spreadsheet existant:');
        console.log('   node fix-google-permissions.js --use-existing YOUR_SPREADSHEET_ID');
        console.log('3. Créez manuellement et partagez avec:', SERVICE_ACCOUNT.client_email);
    }
}

if (require.main === module) {
    main();
}

module.exports = { testGooglePermissions, useExistingSpreadsheet };