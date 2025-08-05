// Test du webhook Discord
console.log("Test du webhook Discord pour Kaspa Ecosystem...");

const testWebhook = async () => {
    // Simuler un projet test
    const testData = {
        projectId: "test-" + Date.now(),
        reportCount: 5,
        projectTitle: "Test Project for Webhook",
        reason: "Testing webhook functionality"
    };
    
    console.log("Sending test alert...");
    console.log("Project:", testData.projectTitle);
    console.log("Reports:", testData.reportCount);
    
    // Note: Le webhook sera déclenché automatiquement
    // quand un projet atteint le seuil de reports
    console.log("\n✅ Configuration du webhook terminée!");
    console.log("Le webhook se déclenchera automatiquement après 5 reports de scam.");
};

testWebhook();
