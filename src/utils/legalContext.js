/**
 * Utility for managing legal context in AI requests
 */

// Legal domains supported by the system
export const LEGAL_DOMAINS = {
    HAWAII_STATE: 'hawaiiState',
    FEDERAL_US: 'federalUS',
    HAWAIIAN_CULTURAL: 'hawaiianCultural',
    GENERAL: 'general'
};

/**
 * Get specialized context for Hawaii state law
 * @returns {string} Hawaii legal context
 */
export function getHawaiiLegalContext() {
    return `
You are knowledgeable about Hawaii state law with expertise in:

1. Hawaii Revised Statutes (HRS)
2. Hawaii Administrative Rules
3. Hawaii case law and judicial precedents
4. Hawaiian land use regulations and property law
5. Hawaii-specific business regulations and tax codes
6. State constitutional provisions
7. Environmental regulations specific to Hawaii's unique ecosystems
8. Hawaii Family Law and Probate
9. Hawaii landlord-tenant regulations
10. Hawaii employment law and workers' compensation

When analyzing legal questions under Hawaii law:
- Reference specific HRS sections when applicable
- Consider Hawaii Supreme Court and Intermediate Court of Appeals precedents
- Recognize Hawaii's unique legal frameworks that differ from mainland states
- Acknowledge the influence of Hawaiian cultural values on state law interpretation
- Be aware of Hawaii's specific regulatory agencies like DLNR, DCCA, and DOH
  `.trim();
}

/**
 * Get specialized context for US federal law
 * @returns {string} Federal legal context
 */
export function getFederalLegalContext() {
    return `
You are knowledgeable about US federal law with expertise in:

1. US Constitution and its amendments
2. Federal statutes and United States Code (USC)
3. Federal regulations and the Code of Federal Regulations (CFR)
4. US Supreme Court decisions and federal case law
5. Federal administrative law and agency procedures
6. Federal civil and criminal procedure
7. Federal jurisdiction and its interaction with state law
8. Interstate commerce regulations
9. Federal taxation and IRS requirements
10. Federal environmental laws (EPA), labor laws (DOL), and securities laws (SEC)

When analyzing federal legal questions:
- Reference specific USC sections and CFR provisions
- Consider controlling Supreme Court precedent and relevant Circuit Court opinions
- Distinguish between federal questions and matters of state law
- Identify proper jurisdiction and venue for federal claims
- Recognize federal preemption doctrines when applicable
  `.trim();
}

/**
 * Get specialized context for Hawaiian cultural law
 * @returns {string} Hawaiian cultural legal context
 */
export function getHawaiianCulturalLegalContext() {
    return `
You are knowledgeable about Native Hawaiian cultural law and practices with expertise in:

1. Hawaiian Kingdom law and historical precedents
2. Native Hawaiian traditional and customary rights protected under Hawaii State Constitution Article XII, Section 7
3. Kuleana rights and traditional land use access
4. Gathering rights for traditional and customary practices
5. Water rights and traditional ahupuaʻa systems
6. Cultural resource protection under state and federal law
7. Native Hawaiian burial sites and practices under Hawaii law
8. Hawaiian language preservation initiatives
9. The legal framework of the Hawaiian Homes Commission Act
10. Indigenous rights under international law as applied to Native Hawaiians

When analyzing Hawaiian cultural legal questions:
- Apply both contemporary law and traditional Hawaiian concepts of justice
- Reference relevant Hawaiian terms and concepts correctly with proper ʻōlelo Hawaiʻi (Hawaiian language)
- Consider the principles of mālama ʻāina (caring for the land) and pono (righteousness/balance)
- Acknowledge the legal significance of genealogical connections to place
- Recognize the ongoing legal discussions regarding Hawaiian sovereignty
- Incorporate understanding of konohiki fishing rights and traditional resource management
  `.trim();
}

/**
 * Combine legal contexts based on selected domains
 * @param {Array} domains - Array of legal domains to include
 * @returns {string} Combined legal context
 */
export function getCombinedLegalContext(domains = []) {
    let contextParts = [];

    if (domains.includes(LEGAL_DOMAINS.HAWAII_STATE)) {
        contextParts.push(getHawaiiLegalContext());
    }

    if (domains.includes(LEGAL_DOMAINS.FEDERAL_US)) {
        contextParts.push(getFederalLegalContext());
    }

    if (domains.includes(LEGAL_DOMAINS.HAWAIIAN_CULTURAL)) {
        contextParts.push(getHawaiianCulturalLegalContext());
    }

    if (contextParts.length === 0) {
        return "";
    }

    return `
===LEGAL CONTEXT===
${contextParts.join('\n\n')}
===============
`.trim();
}

/**
 * Enhance a system prompt with legal context
 * @param {string} basePrompt - Original system prompt
 * @param {Array} domains - Legal domains to include
 * @returns {string} Enhanced prompt with legal context
 */
export function enhancePromptWithLegalContext(basePrompt, domains = []) {
    const legalContext = getCombinedLegalContext(domains);

    if (!legalContext) {
        return basePrompt;
    }

    return `${basePrompt}\n\n${legalContext}`;
}
